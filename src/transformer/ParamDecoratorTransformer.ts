import * as ts from 'typescript';
import * as tjs from "typescript-json-schema";
import { InternalTypeDefinition, __ApiParamArgs, IntrinsicTypeDefinitionNumber } from '../apiManagement/InternalTypes';
import { DecoratorTransformer, IDecorationFunctionTransformInfoBase, TypePredicateFunc, ParamArgsInitializer, ExpressionWrapper } from './DecoratorTransformer';
import { ApiParamType } from '../apiManagement/ApiDefinition';

export interface IQueryParamDecoratorDefinition {
	allowableTypes: ('string' | 'number' | 'date' | 'any')[];
	arguments: IParamDecoratorFunctionArg[];
}

export interface IBodyParamDecoratorDefinition {
	allowableTypes: ('object' | 'string' | 'number' | 'date' | 'any')[];
	arguments: IParamDecoratorFunctionArg[];
}

export interface TransformerType {
	type: ApiParamType;
}

export type ParamDecoratorTransformerInfo = IBodyParamDecoratorDefinition & IDecorationFunctionTransformInfoBase & TransformerType;

export interface IParamDecoratorFunctionArg {
	type: 'paramName' | 'validationFunc' | 'numberMin' | 'numberMax' | 'regexp';
	optional: boolean;
}

export class ParamDecoratorTransformer extends DecoratorTransformer<ts.ParameterDeclaration, ParamDecoratorTransformerInfo> {
    constructor(
        program: ts.Program,
        generator: tjs.JsonSchemaGenerator,
		transformInfo: ParamDecoratorTransformerInfo,
		private readonly extractOnly: boolean = false,
    ) {
		super(program, generator, {
            ...transformInfo,
            nodeCheckFunction: <TypePredicateFunc<ts.Node, ts.ParameterDeclaration>>(node => this.isDecoratedParameterExpression(node)),
        })
    }

	public visitNode(node: ts.ParameterDeclaration): ts.ParameterDeclaration {
		// TODO: Validate the type of the parameter this decorator was used on matches the allowable types
        // defined on: this.transformInfo.allowableTypes
        
		// Parse type
		const decoratorArg = this.getParamArgs(node);
        
		// Replace decorator definitions
		for (const decorator of node.decorators) {
			if (this.isArgumentDecoratorCallExpression(decorator.expression)) {
				// Replace decorator invocation
				const thisArgs = this.getDecoratorArguments(decoratorArg, decorator.expression)
				if (thisArgs && !this.extractOnly) {
					// Change decorator arguments
					decorator.expression.arguments = ts.createNodeArray([this.typeSerializer.objectToLiteral(thisArgs)]);
				}
			}
        }
        
		return node;
	}
	
	public getParamArgs(node: ts.ParameterDeclaration) {
		let internalType: InternalTypeDefinition = {
			type: 'any',
		};
		
		if (node.type) {
			const type = this.typeChecker.getTypeFromTypeNode(node.type);
			internalType = this.typeSerializer.getInternalTypeRepresentation(node.type, type);
		}

		// Parse argument name
		let name: string;
		if (typeof node.name === 'string') {
			name = node.name;
		} else if (ts.isIdentifier(node.name)) {
			name = node.name.text;
		} else {
			throw new Error('Unknown node name type');
		}

		// Parse initializer
		let initializer: ts.Expression | undefined;
		if (node.initializer) {
			// Only wrap the expression if it's not already parenthesized
			let parenExpr = this.parenthesizeExpression(node.initializer);
			initializer = ts.createArrowFunction(undefined, undefined, [], undefined, undefined, parenExpr);
		}

		// Parse optional
		let optional: boolean = !!node.questionToken;

		// Construct param decorator args
		let description;
		const args: ParamArgsInitializer = {
			name,
			typedef: internalType,
			...((description = this.getParamDescription(node))
				? {description}
				: {}),
		};

		if (optional) {
			args.optional = optional;
		}

		const decoratorArg = {
			...args,
			...(initializer
				? { initializer: new ExpressionWrapper(initializer) }
				: {}),
		};

		return decoratorArg;
	}

	private getParamDescription(param: ts.ParameterDeclaration): string | undefined {
		const paramTags = ts.getJSDocParameterTags(param);
		if (paramTags.length) {
			return paramTags[0].comment;
		}

		return undefined;
	}

	public getDecoratorArguments(decoratorArg: ParamArgsInitializer, expression: ts.CallExpression, transformInfo: ParamDecoratorTransformerInfo = this.transformInfo): ParamArgsInitializer | undefined {
		const thisArgs = { ...decoratorArg };
		for (let i = 0; i < transformInfo.arguments.length; ++i) {
			const argDef = transformInfo.arguments[i];
			const arg = expression.arguments[i];
			if (typeof arg === 'undefined') {
				if (!argDef.optional) {
					throw new Error('Expected argument');
				}
				break;
			}
			
			switch (argDef.type) {
				case 'paramName':
					thisArgs.name = this.typeSerializer.compileExpressionToStringConstant(arg);
					break;
				case 'validationFunc':
					thisArgs.validationFunction = new ExpressionWrapper(this.parenthesizeExpression(arg));
					break;
				case 'numberMax':
					(<IntrinsicTypeDefinitionNumber>thisArgs.typedef!).maxVal = this.typeSerializer.compileExpressionToNumericConstant(arg);
					break;
				case 'numberMin':
					(<IntrinsicTypeDefinitionNumber>thisArgs.typedef!).minVal = this.typeSerializer.compileExpressionToNumericConstant(arg);
					break;
				default:
					throw new Error('Unknown argdef type');
			}
		}

		return thisArgs;
	}
}