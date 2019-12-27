import * as ts from 'typescript';
import * as tjs from "typescript-json-schema";
import { __ApiParamArgs, __ApiParamArgsBase, InternalTypeDefinition } from '../apiManagement/InternalTypes';
import { DecoratorTransformer, IDecorationFunctionTransformInfoBase, TypePredicateFunc, ParamArgsInitializer, ExpressionWrapper } from './DecoratorTransformer';
import { ParamDecoratorTransformer, ParamDecoratorTransformerInfo } from './ParamDecoratorTransformer';
import { ApiMethod, IApiDefinitionBase, IApiParamDefinition } from '../apiManagement/ApiDefinition';
import { ITransformerMetadataCollection, ITransformerMetadata } from './TransformerMetadata';
import { IMetadataResolver } from './MetadataManager';
import { IApiMethodDecoratorFunctionArg, IApiMethodDecoratorDefinition } from '..';

export interface IExtractedApiDefinition extends IApiDefinitionBase {
	file: string;
	parameters: IApiParamDefinition[];
}

export interface IExtractedApiDefinitionWithMetadata extends IExtractedApiDefinition, ITransformerMetadataCollection {
}

export interface IExtractedTag {
	name: string;
	description?: string;
}

export type OnApiMethodExtractedHandler = (method: IExtractedApiDefinitionWithMetadata) => void;

export interface IExtractionTransformInfoBase extends IDecorationFunctionTransformInfoBase, IApiMethodDecoratorDefinition {
	parameterTypes: ParamDecoratorTransformerInfo[];
}

interface IDecoratorArgumentsDefinitionExtractorResult {
	definition: IExtractedApiDefinition;
	exprArguments?: ts.NodeArray<ts.Expression>;
}

export class ExtractionTransformer extends DecoratorTransformer<ts.MethodDeclaration, IExtractionTransformInfoBase> {
	private paramTransformers = new Map<ParamDecoratorTransformerInfo, ParamDecoratorTransformer>();
    constructor(
        program: ts.Program,
        generator: tjs.JsonSchemaGenerator,
		transformInfo: IExtractionTransformInfoBase,
		private readonly onApiMethodExtracted: OnApiMethodExtractedHandler | undefined,
		private readonly metadataManager: IMetadataResolver,
		private readonly extractOnly: boolean = false,
    ) {
		super(program, generator, {
            ...transformInfo,
            nodeCheckFunction: <TypePredicateFunc<ts.Node, ts.MethodDeclaration>>(node => this.isDecoratedMethodDeclaration(node)),
		});
		
		this.transformInfo.parameterTypes.forEach(p => {
			this.paramTransformers.set(p,
				new ParamDecoratorTransformer(
					this.program,
					this.generator,
					p));
		});
    }

	public visitNode(node: ts.MethodDeclaration): ts.Node{
		// Parse argument name
		let name: string;
		if (typeof node.name === 'string') {
			name = node.name;
		} else if (ts.isIdentifier(node.name)) {
			name = node.name.text;
		} else {
			throw new Error('Unknown node name type');
		}

		// Pull out the registered decorators
		const registeredDecorators = [this.transformInfo, ...this.metadataManager.getApiMethodMetadataDecorators()];
		const decoratorMap = new Map<IDecorationFunctionTransformInfoBase, ts.CallExpression>();
		for (const decorator of node.decorators) {
			for (const transformInfo of registeredDecorators) {
				if (this.isArgumentDecoratorCallExpression(decorator.expression)) {
					decoratorMap.set(transformInfo, decorator.expression);
				}
			}
		}

		let definition: IExtractedApiDefinition;
		if (decoratorMap.has(this.transformInfo)) {
			const expression = decoratorMap.get(this.transformInfo);
			const type = this.typeChecker.getTypeAtLocation(node);
			const callSignatures = type.getCallSignatures();
			let returnType: InternalTypeDefinition;
			if (callSignatures.length === 1) {
				returnType = this.typeSerializer.getInternalTypeRepresentation(
					node.type,
					this.typeChecker.getReturnTypeOfSignature(callSignatures[0]));
			} else if (callSignatures.length > 1) {
				throw new Error('Cannot handle method with multiple call signatures');
			}

			const result = this.getDecoratorArguments({
				route: null,
				handlerKey: name,
				method: this.transformInfo.apiDecoratorMethod,
				file: node.getSourceFile().fileName,
				parameters: this.parseApiMethodCallParameters(node.parameters),
				returnType,
			}, expression);

			definition = result.definition;
			if (!this.extractOnly && result.exprArguments) {
				expression.arguments = result.exprArguments;
			}
		}

		if (definition) {
			let metadata: ITransformerMetadata[] = [];
			for (const decorator of decoratorMap) {
				metadata = metadata.concat(
					this.metadataManager.getApiMetadataForApiMethod(
						definition, node, decorator[0] === this.transformInfo ? null : decorator[0]));
			}

			if (this.onApiMethodExtracted) {
				this.onApiMethodExtracted({
					...definition,
					metadata,
				});
			}
		}

		return node;
	}

	private parseApiMethodCallParameters(parameters: ts.NodeArray<ts.ParameterDeclaration>): IApiParamDefinition[] {
		const parsedParams: IApiParamDefinition[] = [];
		for (let i = 0; i < parameters.length; ++i) {
			const param = parameters[i];
			for (const decorator of param.decorators) {
				for (const decoratorType of this.transformInfo.parameterTypes) {
					if (this.isArgumentDecoratorCallExpression(decorator.expression, decoratorType)) {
						const transformer = this.paramTransformers.get(decoratorType);
						const paramArgs = transformer.getParamArgs(param);
						parsedParams.push(
							{
								args: transformer.getDecoratorArguments(paramArgs, decorator.expression, decoratorType),
								parameterIndex: i,
								propertyKey: paramArgs.name,
								type: decoratorType.type,
							});
					}
				}
			}
		}

		return parsedParams;
	}
	
	protected isDecoratedMethodDeclaration(node: ts.Node): node is ts.MethodDeclaration {
		if (!ts.isMethodDeclaration(node)) {
			return false;
        }
        
		if (!node.decorators || node.decorators.length === 0) {
			return false;
        }
        
		for (const decorator of node.decorators) {
			if (this.isArgumentDecoratorCallExpression(decorator.expression)) {
				return true;
			}
        }
        
		return false;
	}

	protected getDecoratorArguments(decoratorArg: IExtractedApiDefinition, expression: ts.CallExpression): IDecoratorArgumentsDefinitionExtractorResult  {
		const definition = { ...decoratorArg };
		const exprArguments: ts.Expression[] = [];
		for (let i = 0; i < this.transformInfo.arguments.length; ++i) {
			const argDef = this.transformInfo.arguments[i];
			const arg = expression.arguments[i];
			if (typeof arg === 'undefined') {
				if (argDef.optional) {
					if (!argDef.transformedParameter) {
						break;
					}
				} else if (!argDef.optional) {
					throw new Error('Expected argument');
				}
			}
			
			switch (argDef.type) {
				case 'route':
					definition.route = this.typeSerializer.compileExpressionToStringConstant(arg);
					exprArguments[i] = arg;
					break;

				case 'returnSchema':
					if (definition.returnType) {
						exprArguments[i] = this.typeSerializer.objectToLiteral(definition.returnType);
					} else {
						exprArguments[i] = arg;
					}
					break;

				default:
					throw new Error(`Unknown argdef type for decorator "${this.transformInfo.apiDecoratorMethod}": "${argDef.type}"`);
			}
		}

		return { definition, exprArguments: ts.createNodeArray(exprArguments) };
	}
}