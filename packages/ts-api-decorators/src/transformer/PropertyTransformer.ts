import * as ts from 'typescript';
import * as tjs from "typescript-json-schema";
import { InternalTypeDefinition, __ApiParamArgs, IntrinsicTypeDefinitionNumber } from '../apiManagement/InternalTypes';
import { DecoratorTransformer, IDecorationFunctionTransformInfoBase, TypePredicateFunc, ParamArgsInitializer, ExpressionWrapper } from './DecoratorTransformer';
import { ApiParamType } from '../apiManagement/ApiDefinition';
import { ManagedApiInternal } from '../apiManagement';
import { ClassConstructor } from '../decorators';

export type AllowableTypeStrings = 'object' | 'string' | 'number' | 'date' | 'boolean' | 'any';

export interface IParamDecoratorDefinition {
	allowableTypes: AllowableTypeStrings[];
	arguments: IParamDecoratorFunctionArg[];
}

export interface TransformerType {
	type: ApiParamType;
}

export type ParamDecoratorTransformerInfo = IParamDecoratorDefinition & IDecorationFunctionTransformInfoBase & TransformerType;

export interface IParamDecoratorFunctionArg {
	type: 'paramName' | 'validationFunc' | 'numberMin' | 'numberMax' | 'regexp';
	optional: boolean;
}

export class PropertyTransformer extends DecoratorTransformer<ts.PropertyDeclaration, ParamDecoratorTransformerInfo> {
	constructor(
		program: ts.Program,
		generator: tjs.JsonSchemaGenerator,
		transformInfo: ParamDecoratorTransformerInfo,
		private readonly extractOnly: boolean = false,
	) {
		super(program, generator, {
			...transformInfo,
			nodeCheckFunction: <TypePredicateFunc<ts.Node, ts.PropertyDeclaration>>(node => this.isDecoratedPropertyDeclaration(node)),
		})
	}

	public visitNode(node: ts.PropertyDeclaration): ts.PropertyDeclaration {
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

	public getParamArgs(node: ts.PropertyDeclaration) {
		let internalType: InternalTypeDefinition = {
			type: 'any',
		};

		let typeref: ExpressionWrapper = null;
		if (node.type) {
			const type = this.typeChecker.getTypeFromTypeNode(node.type);
			internalType = this.typeSerializer.getInternalTypeRepresentation(node.type, type);
			if (
				!this.transformInfo.allowableTypes.find(t => t === internalType.type || t === 'any')
			) {
				throw new Error('Invalid type for decorator: ' + internalType.type);
			}

			if (internalType.type === 'object' && type.isClass() && ts.isTypeReferenceNode(node.type)) {
				if (ts.isIdentifier(node.type.typeName)) {
					typeref = new ExpressionWrapper(node.type.typeName);
				}
			}
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
		const args: ParamArgsInitializer = {
			name,
			typedef: internalType,
		};

		if (optional) {
			args.optional = optional;
		}

		if (typeref) {
			args.typeref = typeref;
		}

		const decoratorArg = {
			...args,
			...(initializer
				? { initializer: new ExpressionWrapper(initializer) }
				: {}),
		};

		return decoratorArg;
	}

	public getDecoratorArguments(decoratorArg: ParamArgsInitializer, expression: ts.CallExpression, transformInfo: ParamDecoratorTransformerInfo = this.transformInfo): ParamArgsInitializer | undefined {
		const thisArgs = { ...decoratorArg };
		for (let i = 0; i < transformInfo.arguments.length; ++i) {
			const argDef = transformInfo.arguments[i];
			const arg = expression.arguments[i];
			if (this.isNullOrUndefinedExpr(arg)) {
				if (!argDef.optional) {
					throw new Error('Expected argument');
				}
				continue;
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
				case 'regexp':
					if (ts.isRegularExpressionLiteral(arg)) {
						thisArgs.regexp = new ExpressionWrapper(arg);
					} else {
						throw new Error('Regular expression must be a regex literal');
					}
					break;
				default:
					throw new Error('Unknown argdef type');
			}
		}

		return thisArgs;
	}

	private isNullOrUndefinedExpr(arg: ts.Expression): boolean {
		if (typeof arg === 'undefined') {
			return true;
		} else if (ts.isParenthesizedExpression(arg)) {
			return this.isNullOrUndefinedExpr(arg.expression);
		} else if (arg.kind === ts.SyntaxKind.UndefinedKeyword || arg.kind === ts.SyntaxKind.NullKeyword) {
			return true;
		} else if (ts.isIdentifier(arg)) {
			return arg.originalKeywordKind === ts.SyntaxKind.UndefinedKeyword || arg.originalKeywordKind === ts.SyntaxKind.NullKeyword;
		} else {
			return false;
		}
	}

	protected isDecoratedPropertyDeclaration(node: ts.Node, transformInfo: IDecorationFunctionTransformInfoBase = this.transformInfo): node is ts.PropertyDeclaration {
		if (!ts.isPropertyDeclaration(node)) {
			return false;
        }
        
		if (!node.decorators || node.decorators.length === 0) {
			return false;
        }
        
		for (const decorator of node.decorators) {
			if (this.isArgumentDecoratorCallExpression(decorator.expression, transformInfo)) {
				return true;
			}
        }
        
		return false;
	}
}