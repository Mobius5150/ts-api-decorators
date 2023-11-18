import * as ts from 'typescript';
import * as tjs from "typescript-json-schema";
import { InternalTypeDefinition, IJsonSchemaWithRefs, InternalTypeUtil, InternalEnumTypeDefinition, IntrinsicTypeDefinitionString, IntrinsicTypeDefinitionNumber } from '../apiManagement/InternalTypes';
import { isIntrinsicType, isUnionType, isIntersectionType, isSymbolWithId, isBuiltinSymbol, isParameterizedType, isSymbolWithParent, isNodeWithTypeArguments, UnionType, nodeHasElements } from './TransformerUtil';
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
		if (node && (ts.isRegularExpressionLiteral(node) || node.getText() === RegExp.name)) {
			return {
				...base,
				type: 'regex',
			};
		}
		if (type.symbol && isBuiltinSymbol(type.symbol)) {
			switch (type.symbol.name) {
				case 'Buffer':
					return {
						...base,
						type: 'Buffer'
					};

				case 'Promise':
					if (isParameterizedType(type)) {
						if (isNodeWithTypeArguments(node)) {
							return {
								...base,
								...this.getInternalTypeRepresentation(node.typeArguments[0], type.resolvedTypeArguments[0]),
							};
						}

						return {
							...base,
							...this.getInternalTypeRepresentation(node, type.resolvedTypeArguments[0]),
						};
					} else {
						return {
							...base,
							type: 'Promise'
						};
					}
			}
		}
		if (type.symbol && isSymbolWithId(type.symbol)) {
			const name = this.typeChecker.getFullyQualifiedName(type.symbol);
			const symbols = [
				...this.generator.getSymbols(name),
				...this.generator.getSymbols(type.symbol.name),
			];

			if (isSymbolWithParent(type.symbol)) {
				symbols.push(...this.generator.getSymbols(type.symbol.parent.name));
			}

			for (const symbol of symbols) {
				if (
					isSymbolWithId(symbol.symbol) && (
						symbol.symbol.id === type.symbol.id
						|| isSymbolWithParent(type.symbol) && isSymbolWithId(type.symbol.parent) && symbol.symbol.id === type.symbol.parent.id
					)
				) {
					return this.getTypeForSymbolWithId(symbol, base);
				}
			}
		}
		if (node && ts.isUnionTypeNode(node) && isUnionType(node, type)) {
			return this.getUnionType(base, type, node);
		}
		if (node && ts.isIntersectionTypeNode(node) && isIntersectionType(node, type)) {
			return {
				...base,
				type: 'intersection',
				types: type.types.map((t, i) => this.getInternalTypeRepresentation(node.types[i], t)),
				typename: type.aliasSymbol ? type.aliasSymbol.escapedName.toString() : undefined,
				uniqueTypename: type.aliasSymbol ? type.aliasSymbol.name : undefined,
			};
		}
		if (node && node && ts.isArrayTypeNode(node)) {
			return {
				...base,
				type: 'array',
				elementType: this.getInternalTypeRepresentation(node.elementType, this.typeChecker.getTypeFromTypeNode(node.elementType)),
			};
		}
		if (type.aliasSymbol && type.aliasSymbol.declarations.length > 0) {
			for (const decl of type.aliasSymbol.declarations) {
				if (!ts.isTypeAliasDeclaration(decl)) {
					continue;
				}
				if (decl.type && ts.isTypeNode(decl.type)) {
					return this.getInternalTypeRepresentation(decl.type, this.typeChecker.getTypeFromTypeNode(decl.type));
				}
			}
		}
		if (node && ts.isParenthesizedTypeNode(node)) {
			return this.getInternalTypeRepresentation(node.type, this.typeChecker.getTypeFromTypeNode(node.type));
		}
		if (node && ts.isLiteralTypeNode(node)) {
			switch (node.literal.kind) {
				case ts.SyntaxKind.StringLiteral:
					return <IntrinsicTypeDefinitionString> { type: 'string', schema: { enum: [ node.literal.text ] } };

				case ts.SyntaxKind.NumericLiteral:
					return <IntrinsicTypeDefinitionNumber> { type: 'number', schema: { enum: [ Number(node.literal.text) ] } };

				case ts.SyntaxKind.UndefinedKeyword:
					return { type: 'void' };

				default:
					throw new Error(`Cannot convert literal type: ${node.literal.kind}`);
			}
		}
	}
	
	private getUnionType(base: { optional?: boolean; }, type: UnionType, node: ts.UnionTypeNode): InternalTypeDefinition {
		const union: InternalTypeDefinition = {
			...base,
			type: 'union',
			types: type.types
				.map((t, i) => this.getInternalTypeRepresentation(node.types[i], t))
				.filter(t => !!t),
			typename: type.aliasSymbol ? type.aliasSymbol.escapedName.toString() : undefined,
			uniqueTypename: type.aliasSymbol ? type.aliasSymbol.name : undefined,
		};

		if (union.types && union.types.every(t => (t.type === 'string' || t.type === 'number') && t.schema && 'enum' in t.schema && Array.isArray(t.schema?.enum))) {
			// This union can be collapsed to an enum
			let type = 'enum';
			if (union.types.every(t => t.type === 'string')) {
				type = 'string';
			} else if (union.types.every(t => t.type === 'number')) {
				type = 'number';
			}
			return <InternalEnumTypeDefinition> {
				...base,
				type,
				schema: {
					enum: union.types.reduce(
						(p, c: IntrinsicTypeDefinitionString | IntrinsicTypeDefinitionNumber) =>
							p.concat('enum' in c.schema ? c.schema.enum : []), []),
				},
				typename: union.typename,
				uniqueTypename: union.uniqueTypename,
			};
		}

		return union;
	}

	private getTypeForSymbolWithId(symbol: any, base: { optional?: boolean; }) {
		let schema = this.generator.getSchemaForSymbol(symbol.name, true);
		let type: any = schema.type || InternalTypeUtil.TypeAnyObject.type;
		if (schema.$ref && schema.definitions) {
			const refDefParts = schema.$ref.split('/');
			const refDefName = refDefParts[refDefParts.length - 1];
			const def = schema.definitions[refDefName];
			if (typeof def === 'boolean') {
				throw new Error('Boolean definition: ' + refDefName);
			}
			if (def.type !== InternalTypeUtil.TypeAnyObject.type) {
				if (def.enum) {
					type = (def.type && !Array.isArray(def.type)) ? def.type : InternalTypeUtil.TypeEnum.type;
					schema = {
						...def,
						...schema,
					};
				} else {
					type = def.type;
					schema = def;
				}
			}
		}

		return {
			...base,
			type,
			schema: this.reduceSchemaReferences(schema),
			typename: symbol.typeName,
			uniqueTypename: symbol.name,
		};
	}

	private reduceSchemaReferences(schema: tjs.Definition): tjs.Definition {
		if (!schema.$ref || !schema.definitions) {
			return schema;
		}

		const newSchema = {
			...schema,
			definitions: {},
		};
		const refs: string[] = [this.getRefShortName(schema.$ref)];
		const def = schema.definitions[refs[0]];
		if (typeof def === 'boolean') {
			throw new Error('Boolean definition: ' + schema.$ref);
		}

		this.getRefsRecursive(def, schema.definitions, refs);
		refs.forEach(v => newSchema.definitions[v] = schema.definitions[v]);

		return newSchema;
	}

	private getRefsRecursive(obj: { $ref?: string }, definitions: tjs.Definition['definitions'], refs: string[]): void {
		Object.keys(obj).filter(k => typeof obj[k] === 'object')
			.map(k => this.getRefsRecursive(obj[k], definitions, refs));
		if (obj.$ref) {
			const ref = this.getRefShortName(obj.$ref);

			if (refs.indexOf(ref) !== -1) {
				return;
			}
			
			refs.push(ref);
			const definition = definitions[ref];
			if (definition) {
				this.getRefsRecursive(<any>definition, definitions, refs)
			}
		}
	}

	private getRefShortName(ref?: string) {
		ref = ref.substring('#/definitions/'.length);
		if (ref.indexOf('/')) {
			ref = ref.split('/')[0];
		}
		return ref;
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

		// TODO: This is a hack to get around the fact that the generator have the same json schema def
		return def as any as IJsonSchemaWithRefs;
	}

	protected valueToLiteral(val: any): ts.Expression {
		switch (typeof val) {
			case 'string':
				return ts.factory.createStringLiteral(val);
			case 'number':
				return ts.factory.createNumericLiteral(val);
			case 'boolean':
				return val ? ts.factory.createTrue() : ts.factory.createFalse();
			case 'bigint':
				return ts.factory.createBigIntLiteral(val.toString());
			case 'object':
				if (Array.isArray(val)) {
					return ts.factory.createArrayLiteralExpression(val.map(v => this.valueToLiteral(v)));
				}
				else if (val instanceof ExpressionWrapper) {
					return val.node;
				}
				else {
					return this.objectToLiteral(val);
				}
			case 'undefined':
				return ts.factory.createIdentifier('undefined');
			default:
				throw new Error(`Unknown type serialization path: ${typeof val}`);
		}
    }
    
	public objectToLiteral(val: object): ts.ObjectLiteralExpression {
		return ts.factory.createObjectLiteralExpression(
			Object.keys(val).map(k => {
				let propName: string | ts.StringLiteral = k;
				if (/[^a-zA-Z0-9_]/.test(<string>k)) {
					propName = ts.factory.createStringLiteral(k);
				}

				return ts.factory.createPropertyAssignment(propName, this.valueToLiteral(<any>val[<any>k]))
			}), false);
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

	public compileExpressionToStringConstant(expression: ts.Expression): string {
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

	public compileExpressionToArrayConstant(expression: ts.Expression): Array<number | boolean | string> {
		if (expression.kind !== ts.SyntaxKind.ArrayLiteralExpression) {
			throw new Error('Expression was of invalid kind to compile to array: ' + expression.kind);
		}

		if (nodeHasElements(expression)) {
			return expression.elements.map(c => this.arrayNodeToConstant(c)).filter(c => Boolean(c));
		}

		try {
			return expression.getChildren().map(c => this.arrayNodeToConstant(c)).filter(c => Boolean(c));
		} catch (e) {

		}

		return expression.forEachChild(undefined, (children) => children.map(c => this.arrayNodeToConstant(c))).filter(c => Boolean(c));
	}
	
	private arrayNodeToConstant(c: ts.Node) {
		if (!ts.isLiteralExpression(c)) {
			if (ts.isToken(c)) {
				return null;
			}

			throw new Error('Array elements must be literals');
		}

		if (c.kind === ts.SyntaxKind.SyntaxList && c.getChildCount() === 1) {
			return this.compileExpressionToConstant(c.getChildAt(0) as ts.Expression);
		}

		return this.compileExpressionToConstant(c);
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