import * as ts from 'typescript';
import * as tjs from "typescript-json-schema";
import * as path from 'path';
import { ITreeTransformer } from "./ITreeTransformer";
import { __ApiParamArgs, InternalTypeDefinition, IntrinsicTypeDefinitionNumber } from '../apiManagement/InternalTypes';
import { isIntrinsicType, isUnionType, isIntersectionType, isSymbolWithId } from './TransformerUtil';

export interface IDecorationFunctionTransformInfoBase {
	magicFunctionName: string;
	indexTs: string;
}

export type TypePredicateFunc<P, T extends P> = (p: P) => p is T;

export interface IDecoratorFunctionTransformInfo<T extends ts.Node> {
	nodeCheckFunction: TypePredicateFunc<ts.Node, T>;
}

export class ExpressionWrapper {
	constructor(public node: ts.Expression) { }
}

export type ParamArgsInitializer = {
	[P in keyof __ApiParamArgs]?: __ApiParamArgs[P] | ExpressionWrapper;
};

export abstract class DecoratorTransformer<T extends ts.Node, I extends IDecorationFunctionTransformInfoBase = IDecorationFunctionTransformInfoBase> implements ITreeTransformer {
	protected readonly typeChecker: ts.TypeChecker;
	constructor(
        protected readonly program: ts.Program,
        protected readonly generator: tjs.JsonSchemaGenerator,
        protected readonly transformInfo: I & IDecoratorFunctionTransformInfo<T> 
    ) {
		this.typeChecker = this.program.getTypeChecker();
    }

    public visitNodeAndChildren(node: ts.SourceFile, context: ts.TransformationContext): ts.SourceFile;
	public visitNodeAndChildren(node: ts.Node, context: ts.TransformationContext): ts.Node;
	public visitNodeAndChildren(node: ts.Node, context: ts.TransformationContext): ts.Node {
		return ts.visitEachChild(this.__visitNode(node), childNode => this.visitNodeAndChildren(childNode, context), context);
    }
    
    public abstract visitNode(node: T): ts.Node;

    private __visitNode(node: ts.Node): ts.Node {
        if (!this.transformInfo.nodeCheckFunction(node)) {
			return node;
        }
        
        this.visitNode(node);
    }

    protected isArgumentDecoratorCallExpression(decorator: ts.Decorator['expression']): decorator is ts.CallExpression {
		if (!ts.isCallExpression(decorator)) {
			return false;
        }
        
		const signature = this.typeChecker.getResolvedSignature(decorator);
		if (typeof signature === 'undefined') {
			return false;
        }
        
		const { declaration } = signature;
		if (!(!!declaration
			&& !ts.isJSDocSignature(declaration)
			&& !!declaration.name
			&& declaration.name.getText() === this.transformInfo.magicFunctionName)) {
			return false;
		}
		
		const sourceFile = path.join(declaration.getSourceFile().fileName);
		return sourceFile.endsWith(this.transformInfo.indexTs + '.ts') || sourceFile.endsWith(this.transformInfo.indexTs + '.d.ts');
	}
	
	protected isDecoratedParameterExpression(node: ts.Node): node is ts.ParameterDeclaration {
		if (!ts.isParameter(node)) {
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

	protected parenthesizeExpression(expression: ts.Expression) {
		return ts.isParenthesizedExpression(expression)
			? expression
			: ts.createParen(expression);
    }
    
	protected getInternalTypeRepresentation(node: ts.TypeNode, type: ts.Type): InternalTypeDefinition {
		const base = {
			...(ts.isPropertySignature(node)
				? { optional: !!node.questionToken }
				: {})
		};
		if (isIntrinsicType(type)) {
			return {
				...base,
				type: <any>type.intrinsicName,
			};
		}
		else if (ts.isUnionTypeNode(node) && isUnionType(node, type)) {
			return {
				...base,
				type: 'union',
				types: type.types.map((t, i) => this.getInternalTypeRepresentation(node.types[i], t)),
			};
		}
		else if (ts.isIntersectionTypeNode(node) && isIntersectionType(node, type)) {
			return {
				...base,
				type: 'intersection',
				types: type.types.map((t, i) => this.getInternalTypeRepresentation(node.types[i], t)),
			};
		}
		else if (node && ts.isArrayTypeNode(node)) {
			return {
				...base,
				type: 'array',
				elementType: this.getInternalTypeRepresentation(node.elementType, this.typeChecker.getTypeFromTypeNode(node.elementType)),
			};
		}
		else if (type.symbol && isSymbolWithId(type.symbol)) {
			const name = this.typeChecker.getFullyQualifiedName(type.symbol);
			for (const symbol of this.generator.getSymbols(name)) {
				if (isSymbolWithId(symbol.symbol) && symbol.symbol.id === type.symbol.id) {
					return {
						...base,
						type: 'object',
						schema: this.generator.getSchemaForSymbol(symbol.name),
					};
				}
			}
		}
		else if (type.aliasSymbol && type.aliasSymbol.declarations.length > 0) {
			for (const decl of type.aliasSymbol.declarations) {
				if (!ts.isTypeAliasDeclaration(decl)) {
					continue;
				}
				if (decl.type && ts.isTypeNode(decl.type)) {
					return this.getInternalTypeRepresentation(decl.type, this.typeChecker.getTypeFromTypeNode(decl.type));
				}
			}
		}
		else if (node && ts.isParenthesizedTypeNode(node)) {
			return this.getInternalTypeRepresentation(node.type, this.typeChecker.getTypeFromTypeNode(node.type));
		}
		else {
			console.log(node);
			console.log(type);
		}
    }
    
	protected valueToLiteral(val: any): ts.Expression {
		switch (typeof val) {
			case 'string':
			case 'number':
			case 'boolean':
				return ts.createLiteral(val);
			case 'bigint':
				return ts.createBigIntLiteral(val.toString());
			case 'object':
				if (Array.isArray(val)) {
					return ts.createArrayLiteral(val.map(v => this.valueToLiteral(v)));
				}
				else if (val instanceof ExpressionWrapper) {
					return val.node;
				}
				else {
					return this.objectToLiteral(val);
				}
			case 'undefined':
				return ts.createIdentifier('undefined');
			default:
				throw new Error(`Unknown type serialization path: ${typeof val}`);
		}
    }
    
	protected objectToLiteral(val: object): ts.ObjectLiteralExpression {
		return ts.createObjectLiteral(Object.keys(val).map(k => ts.createPropertyAssignment(k, this.valueToLiteral(<any>val[<any>k]))), false);
	}
	
	protected compileExpressionToNumericConstant(expression: ts.Expression): number {
		const compiled = this.compileExpressionToConstant(expression);
		if (typeof compiled === 'number' || typeof compiled === 'bigint') {
			return compiled;
		} else if (typeof compiled === 'string') {
			return Number(compiled);
		} else {
			throw new Error('Unknown compilation result type: ' + typeof compiled);
		}
	}

	protected compileExpressionToStringConstant(expression: ts.Expression): string {
		const compiled = this.compileExpressionToConstant(expression);
		if (typeof compiled === 'number' || typeof compiled === 'bigint') {
			return compiled.toString();
		} else if (typeof compiled === 'string') {
			return compiled;
		} else {
			throw new Error('Unknown compilation result type: ' + typeof compiled);
		}
	}

	protected compileExpressionToConstant(expression: ts.Expression) {
		if (ts.isLiteralExpression(expression)) {
			switch (expression.kind) {
				case ts.SyntaxKind.StringLiteral:
					return expression.text;

				case ts.SyntaxKind.NumericLiteral:
					return Number(expression.text);

				default:
					throw new Error(`Unknown literal type: ${expression.kind}`);
			}
		}

		if (ts.isEnumMember(expression) || ts.isElementAccessExpression(expression) || ts.isPropertyAccessExpression(expression)) {
			return this.typeChecker.getConstantValue(expression);
		}

		if (ts.isNoSubstitutionTemplateLiteral(expression)) {
			return expression.text;
		}

		if (ts.isTemplateExpression(expression)) {
			let stringParts = [];
			if (expression.head) {
				stringParts.push(this.compileTemplateTextPart(expression.head));
			}

			for (const span of expression.templateSpans) {
				stringParts.push(this.compileTemplateSpan(span));
			}

			return stringParts.join();
		}
	}

	protected compileTemplateSpan(span: ts.TemplateSpan): any {
		let expression = '';
		let literal = '';
		if (span.expression) {
			expression = this.compileExpressionToConstant(span.expression).toString();
		}

		if (span.literal) {
			if (ts.isTemplateTail(span.literal)) {
				literal = this.compileTemplateTextPart(span.literal);
			} else if (ts.isTemplateMiddle(span.literal)) {
				literal = this.compileTemplateTextPart(span.literal);
			} else {
				throw new Error(`Unknown template literal type`);
			}
		}

		return expression + literal;
	}

	protected compileTemplateTextPart(part: ts.TemplateMiddle | ts.TemplateTail | ts.TemplateHead) {
		return part.text;
	}
}