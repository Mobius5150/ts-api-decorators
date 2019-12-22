import * as ts from 'typescript';
import * as tjs from "typescript-json-schema";
import { InternalTypeDefinition, __ApiParamArgs, IntrinsicTypeDefinitionNumber, __ApiParamArgsBase } from '../apiManagement/InternalTypes';
import { DecoratorTransformer, IDecorationFunctionTransformInfoBase, TypePredicateFunc, ParamArgsInitializer, ExpressionWrapper } from './DecoratorTransformer';
import { ParamDecoratorTransformer, ParamDecoratorTransformerInfo } from './ParamDecoratorTransformer';
import { IApiDefinition, ApiMethod, IApiDefinitionBase, IApiParamDefinition, ApiParamType } from '../apiManagement/ApiDefinition';
import { isNodeWithJsDoc, WithJsDoc } from './TransformerUtil';

export interface IExtractedApiDefinition extends IApiDefinitionBase {
	file: string;
	parameters: IApiParamDefinition[];
	description?: string;
	summary?: string;
	returnDescription?: string;
	tags?: IExtractedTag[];
}

export interface IExtractedTag {
	name: string;
	description?: string;
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
	public static readonly JsDocTagTag = 'tags';

	private paramTransformers = new Map<ParamDecoratorTransformerInfo, ParamDecoratorTransformer>();
    constructor(
        program: ts.Program,
        generator: tjs.JsonSchemaGenerator,
		transformInfo: IExtractionTransformInfoBase,
		private readonly onApiMethodExtracted: OnApiMethodExtractedHandler
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

		const jsDoc = this.getJsDoc(node);
		const description = {
			...(jsDoc || {}),
			returnDescription: this.jsdocTagString(ts.getJSDocReturnTag(node)),
		};

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
						...description,
						handlerKey: name,
						method: this.transformInfo.apiDecoratorMethod,
						route,
						file: node.getSourceFile().fileName,
						parameters: this.parseApiMethodCallParameters(node.parameters),
					});
				}
			}
        }

		return node;
	}
	
	private getJsDocTags(node: ts.JSDoc): IExtractedTag[] {
		if (node.tags) {
			return (
				node.tags
					.filter(t => t.tagName.text === ExtractionTransformer.JsDocTagTag)
					.map(t => {
						const parts = t.comment.split(/\s+/);
						return {
							name: parts.shift(),
							description: parts.join(' '),
						};
					})
			);
		}

		return undefined;
	}
	
	private getJsDoc(node: ts.MethodDeclaration): { summary?: string, description?: string, tags: IExtractedTag[] } | undefined {
		if (isNodeWithJsDoc(node) && node.jsDoc.length > 0) {
			const firstLine = node.jsDoc.find(n => n.comment.length > 0);
			return {
				summary: firstLine ? firstLine.comment : undefined,
				tags: firstLine ? this.getJsDocTags(firstLine) : undefined,
				description: node.jsDoc.reduce((prev, current) => prev + current.comment, ''),
			}
		}

		return undefined;
	}

	private jsdocTagString(tag: ts.JSDocTag | undefined): string {
		if (tag) {
			return tag.comment;
		}

		return undefined;
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