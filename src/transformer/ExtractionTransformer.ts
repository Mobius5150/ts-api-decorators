import * as ts from 'typescript';
import * as tjs from "typescript-json-schema";
import { InternalTypeDefinition, __ApiParamArgs, IntrinsicTypeDefinitionNumber } from '../apiManagement/InternalTypes';
import { DecoratorTransformer, IDecorationFunctionTransformInfoBase, TypePredicateFunc, ParamArgsInitializer, ExpressionWrapper } from './DecoratorTransformer';
import { ParamDecoratorTransformer, ParamDecoratorTransformerInfo } from './ParamDecoratorTransformer';
import { IApiDefinition, ApiMethod, IApiDefinitionBase } from '../apiManagement/ApiDefinition';

export interface IExtractedApiDefinition extends IApiDefinitionBase {
	file: string;
}

export type OnApiMethodExtractedHandler = (method: IExtractedApiDefinition) => void;

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
    constructor(
        program: ts.Program,
        generator: tjs.JsonSchemaGenerator,
		transformInfo: IExtractionTransformInfoBase,
		private readonly onApiMethodExtracted: OnApiMethodExtractedHandler
    ) {
		super(program, generator, {
            ...transformInfo,
            nodeCheckFunction: <TypePredicateFunc<ts.Node, ts.MethodDeclaration>>(node => this.isDecoratedMethodDeclaration(node)),
        })
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
        
		// Replace decorator definitions
		for (const decorator of node.decorators) {
			if (this.isArgumentDecoratorCallExpression(decorator.expression)) {
				let route: string = null;

				// Replace decorator invocation
				for (let i = 0; i < this.transformInfo.arguments.length; ++i) {
					const argDef = this.transformInfo.arguments[i];
					const arg = decorator.expression.arguments[i];
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

				if (route) {
					this.onApiMethodExtracted({
						handlerKey: name,
						method: this.transformInfo.apiDecoratorMethod,
						route,
						file: node.getSourceFile().fileName,
					});
				}
			}
        }
        
		return node;
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