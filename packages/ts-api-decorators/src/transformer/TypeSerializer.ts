import * as ts from 'typescript';
import * as tjs from "typescript-json-schema";
import { InternalTypeDefinition, IJsonSchemaWithRefs } from '../apiManagement/InternalTypes';
import { isIntrinsicType, isUnionType, isIntersectionType, isSymbolWithId } from './TransformerUtil';
import { ExpressionWrapper } from './ExpressionWrapper';

export class TypeSerializer {
	private static readonly ReferencePreamble = '#/definitions/';

    constructor(
        protected readonly program: ts.Program,
        protected readonly generator: tjs.JsonSchemaGenerator,
        protected readonly typeChecker: ts.TypeChecker,
    ) {}

    public getInternalTypeRepresentation(node: ts.TypeNode | undefined, type: ts.Type): InternalTypeDefinition {
		const base = {
			...(node && ts.isPropertySignature(node)
				? { optional: !!node.questionToken }
				: {})
		};
		if (isIntrinsicType(type)) {
			return {
				...base,
				type: <any>type.intrinsicName,
			};
		}
		else if (ts.isRegularExpressionLiteral(node) || node.getText() === RegExp.name) {
			return {
				...base,
				type: 'regex',
			};
		}
		else if (type.symbol && isSymbolWithId(type.symbol)) {
			const name = this.typeChecker.getFullyQualifiedName(type.symbol);
			for (const symbol of this.generator.getSymbols(name)) {
				if (isSymbolWithId(symbol.symbol) && symbol.symbol.id === type.symbol.id) {
					return {
						...base,
						type: 'object',
						schema: this.generator.getSchemaForSymbol(symbol.name, true),
						typename: symbol.typeName,
						uniqueTypename: symbol.name,
					};
				}
			}
		}
		else if (node && ts.isUnionTypeNode(node) && isUnionType(node, type)) {
			return {
				...base,
				type: 'union',
				types: type.types.map((t, i) => this.getInternalTypeRepresentation(node.types[i], t)),
				typename: type.aliasSymbol ? type.aliasSymbol.escapedName.toString() : undefined,
				uniqueTypename: type.aliasSymbol ? type.aliasSymbol.name : undefined,
			};
		}
		else if (node && ts.isIntersectionTypeNode(node) && isIntersectionType(node, type)) {
			return {
				...base,
				type: 'intersection',
				types: type.types.map((t, i) => this.getInternalTypeRepresentation(node.types[i], t)),
				typename: type.aliasSymbol ? type.aliasSymbol.escapedName.toString() : undefined,
				uniqueTypename: type.aliasSymbol ? type.aliasSymbol.name : undefined,
			};
		}
		else if (node && node && ts.isArrayTypeNode(node)) {
			return {
				...base,
				type: 'array',
				elementType: this.getInternalTypeRepresentation(node.elementType, this.typeChecker.getTypeFromTypeNode(node.elementType)),
			};
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
	
	public getReferencedTypeDefinition(reference: IJsonSchemaWithRefs): IJsonSchemaWithRefs {
		if (!reference.$ref) {
			throw new Error('Reference did not have a $ref field');
		}

		let def = 
			this.generator.ReffedDefinitions[reference.$ref]
			|| this.generator.ReffedDefinitions[reference.$ref.substr(
				TypeSerializer.ReferencePreamble.length)];
		
		if (!def) {
			throw new Error('Reference not found: ' + reference.$ref);
		}

		return def;
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
    
	public objectToLiteral(val: object): ts.ObjectLiteralExpression {
		return ts.createObjectLiteral(Object.keys(val).map(k => ts.createPropertyAssignment(k, this.valueToLiteral(<any>val[<any>k]))), false);
	}
	
	public compileExpressionToNumericConstant(expression: ts.Expression): number {
		const compiled = this.compileExpressionToConstant(expression);
		if (typeof compiled === 'number' || typeof compiled === 'bigint') {
			return compiled;
		} else if (typeof compiled === 'string') {
			return Number(compiled);
		} else if (typeof compiled === 'undefined') {
			return undefined;
		} else if (compiled === null) {
			return null;
		} else {
			throw new Error('Unknown compilation result type: ' + typeof compiled);
		}
	}

	public compileExpressionToBooleanConstant(expression: ts.Expression): boolean {
		return !!this.compileExpressionToConstant(expression);
	}

	public  compileExpressionToStringConstant(expression: ts.Expression): string {
		const compiled = this.compileExpressionToConstant(expression);
		if (typeof compiled === 'number' || typeof compiled === 'bigint') {
			return compiled.toString();
		} else if (typeof compiled === 'string') {
			return compiled;
		} else if (typeof compiled === 'undefined') {
			return undefined;
		} else if (compiled === null) {
			return null;
		} else {
			throw new Error('Unknown compilation result type: ' + typeof compiled);
		}
	}

	protected compileExpressionToConstant(expression: ts.Expression) {
		if (ts.isLiteralExpression(expression)) {
			switch (expression.kind) {
				case ts.SyntaxKind.StringLiteral:
					return expression.text;

				case ts.SyntaxKind.TrueKeyword:
					return true;

				case ts.SyntaxKind.FalseKeyword:
					return false;

				case ts.SyntaxKind.NumericLiteral:
					return Number(expression.text);

				case ts.SyntaxKind.UndefinedKeyword:
					return undefined;

				case ts.SyntaxKind.NullKeyword:
					return null;

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