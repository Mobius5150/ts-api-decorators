import * as ts from 'typescript';
import * as tjs from "typescript-json-schema";
import { InternalTypeDefinition, __ApiParamArgs, IntrinsicTypeDefinitionNumber, __ApiParamArgsBase } from '../apiManagement/InternalTypes';
import { DecoratorTransformer, IDecorationFunctionTransformInfoBase, TypePredicateFunc, ParamArgsInitializer, ExpressionWrapper } from './DecoratorTransformer';
import { ParamDecoratorTransformer, ParamDecoratorTransformerInfo } from './ParamDecoratorTransformer';
import { IApiDefinition, ApiMethod, IApiDefinitionBase, IApiParamDefinition, ApiParamType } from '../apiManagement/ApiDefinition';
import { isNodeWithJsDoc, WithJsDoc } from './TransformerUtil';
import { ITransformerMetadataCollection, ITransformerMetadata, IMetadataType } from './TransformerMetadata';
import { OpenApiMetadataType } from './OpenApi';
import { IMetadataResolver } from './MetadataManager';

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

export interface IExtractionTransformInfoBase extends IDecorationFunctionTransformInfoBase {
	apiDecoratorMethod: ApiMethod;
	arguments: IExtractionTransformArgument[];
	parameterTypes: ParamDecoratorTransformerInfo[];
}

export interface IExtractionTransformArgument {
	type: 'route';
	optional: boolean;
}

export class ExtractionTransformer extends DecoratorTransformer<ts.MethodDeclaration, IExtractionTransformInfoBase> {
	private paramTransformers = new Map<ParamDecoratorTransformerInfo, ParamDecoratorTransformer>();
    constructor(
        program: ts.Program,
        generator: tjs.JsonSchemaGenerator,
		transformInfo: IExtractionTransformInfoBase,
		private readonly onApiMethodExtracted: OnApiMethodExtractedHandler,
		private readonly metadataManager: IMetadataResolver,
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
		// TODO: Validate the type of the parameter this decorator was used on matches the allowable types
        // defined on: this.transformInfo.allowableTypes
        
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

		let apiDef: IExtractedApiDefinition;
		if (decoratorMap.has(this.transformInfo)) {
			const expression = decoratorMap.get(this.transformInfo);
			let route: string = null;

			// Replace decorator invocation
			for (let i = 0; i < this.transformInfo.arguments.length; ++i) {
				const argDef = this.transformInfo.arguments[i];
				const arg = expression.arguments[i];
				if (typeof arg === 'undefined') {
					if (!argDef.optional) {
						throw new Error('Expected argument');
					}
					break;
				}

				switch (argDef.type) {
					case 'route':
						route = this.compileExpressionToStringConstant(arg);
						break;

					default:
						throw new Error(`Unknown argdef type for "${this.transformInfo.apiDecoratorMethod}": "${argDef.type}"`);
				}
			}
			
			apiDef = {
				handlerKey: name,
				method: this.transformInfo.apiDecoratorMethod,
				route,
				file: node.getSourceFile().fileName,
				parameters: this.parseApiMethodCallParameters(node.parameters),
			};
		}

		if (apiDef) {
			let metadata: ITransformerMetadata[] = [];
			for (const decorator of decoratorMap) {
				metadata = metadata.concat(
					this.metadataManager.getApiMetadataForApiMethod(
						apiDef, node, decorator[0] === this.transformInfo ? null : decorator[0]));
			}

			this.onApiMethodExtracted({
				...apiDef,
				metadata,
			});
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

	protected getDecoratorArguments(decoratorArg: ParamArgsInitializer, expression: ts.CallExpression): ParamArgsInitializer | undefined {
		const thisArgs = { ...decoratorArg };
		for (let i = 0; i < this.transformInfo.arguments.length; ++i) {
			const argDef = this.transformInfo.arguments[i];
			const arg = expression.arguments[i];
			if (typeof arg === 'undefined') {
				if (!argDef.optional) {
					throw new Error('Expected argument');
				}
				break;
			}
			
			switch (argDef.type) {
				case 'route':
					thisArgs.validationFunction = new ExpressionWrapper(this.parenthesizeExpression(arg));
					break;
				default:
					throw new Error(`Unknown argdef type for decorator "${this.transformInfo.apiDecoratorMethod}": "${argDef.type}"`);
			}
		}

		return thisArgs;
	}
}