import * as ts from 'typescript';
import * as path from 'path';
import * as tjs from "typescript-json-schema";
import {
	ApiQueryParam,
	ApiQueryParamString,
	ApiQueryParamNumber,
	GetQueryParamDecorator
} from './decorators/QueryParams';
import {
	InternalTypeDefinition,
	__ApiParamArgs,
	IntrinsicTypeDefinitionNumber,
} from './apiManagement/InternalTypes';
import { IBodyParamDecoratorDefinition } from './decorators/DecoratorUtil';
import { ApiBodyParam, ApiBodyParamNumber, ApiBodyParamString, GetBodyParamDecorator } from './decorators/BodyParams';

export default function transformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
	const generator = tjs.buildGenerator(program, {
		uniqueNames: true,
		required: true,
	});

	const queryParamIndexTs = path.join('decorators/QueryParams');
	const bodyParamIndexTs = path.join('decorators/BodyParams');
	const transformers: ParamDecoratorTransformer[] = [
		getQueryParamTransformer(program, generator, queryParamIndexTs, ApiQueryParam.name),
		getQueryParamTransformer(program, generator, queryParamIndexTs, ApiQueryParamString.name),
		getQueryParamTransformer(program, generator, queryParamIndexTs, ApiQueryParamNumber.name),

		getBodyParamTransformer(program, generator, bodyParamIndexTs, ApiBodyParam.name),
		getBodyParamTransformer(program, generator, bodyParamIndexTs, ApiBodyParamString.name),
		getBodyParamTransformer(program, generator, bodyParamIndexTs, ApiBodyParamNumber.name),
	];

	return (context: ts.TransformationContext) => (file: ts.SourceFile) =>  {
		for (const transformer of transformers) {
			file = transformer.visitNodeAndChildren(file, context)
		}

		return file;
	};
}

function getQueryParamTransformer(program: ts.Program, generator: tjs.JsonSchemaGenerator, indexTs: string, name: string) {
	const d = GetQueryParamDecorator(name);
	if (!d) {
		throw new Error('QueryParamDecorator not defined for: ' + name);
	}

	return new ParamDecoratorTransformer(program, generator, {
		indexTs,
		magicFunctionName: name,
		...d,
	});
}

function getBodyParamTransformer(program: ts.Program, generator: tjs.JsonSchemaGenerator, indexTs: string, name: string) {
	const d = GetBodyParamDecorator(name);
	if (!d) {
		throw new Error('BodyParamDecorator not defined for: ' + name);
	}

	return new ParamDecoratorTransformer(program, generator, {
		indexTs,
		magicFunctionName: name,
		...d,
	});
}

class ExpressionWrapper {
	constructor(public node: ts.Expression) {}
}

interface IDecoratorFunctionTransformInfo extends IBodyParamDecoratorDefinition {
	magicFunctionName: string;
	indexTs: string;
}

type ParamArgsInitializer = {
	[P in keyof __ApiParamArgs]?: __ApiParamArgs[P] | ExpressionWrapper;
}

class ParamDecoratorTransformer {
	private typeChecker: ts.TypeChecker;

	constructor(
		private program: ts.Program,
		private generator: tjs.JsonSchemaGenerator,
		private transformInfo: IDecoratorFunctionTransformInfo
	) {
		this.typeChecker = this.program.getTypeChecker();
	}

	public getTransformerFunction() {
		
	}

	public visitNodeAndChildren(node: ts.SourceFile, context: ts.TransformationContext): ts.SourceFile;
	public visitNodeAndChildren(node: ts.Node, context: ts.TransformationContext): ts.Node;
	public visitNodeAndChildren(node: ts.Node, context: ts.TransformationContext): ts.Node {
		return ts.visitEachChild(this.visitNode(node), childNode => this.visitNodeAndChildren(childNode, context), context);
	}

	private visitNode(node: ts.Node): ts.Node {
		if (!this.isDecoratedParameterExpression(node)) {
			return node;
		}

		// TODO: Validate the type of the parameter this decorator was used on matches the allowable types
		// defined on: this.transformInfo.allowableTypes

		// Parse type
		let internalType: InternalTypeDefinition = {
			type: 'any',
		};

		if (node.type) {
			const type = this.typeChecker.getTypeFromTypeNode(node.type);
			internalType = this.getInternalTypeRepresentation(node.type, type);	
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
			
			initializer = ts.createArrowFunction(
				undefined,
				undefined,
				[],
				undefined,
				undefined,
				parenExpr
			);

			// Remove the initializer from the definition
			node.initializer = undefined;
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

		const decoratorArg = {
			...args,
			...(initializer
				? { initializer: new ExpressionWrapper(initializer)}
				: {}),
		};

		// Replace decorator definitions
		for (const decorator of node.decorators) {
			if (this.isArgumentDecoratorCallExpression(decorator.expression)) {
				// Replace decorator invocation
				const thisArgs = {...decoratorArg};
				for (let i = 0; i < this.transformInfo.arguments.length; ++i)  {
					const argDef = this.transformInfo.arguments[i];
					const arg = decorator.expression.arguments[i];
					if (typeof arg === 'undefined') {
						if (!argDef.optional) {
							throw new Error('Expected argument');
						}

						break;
					}

					if (argDef.type === 'validationFunc') {
						
					}
					
					switch (argDef.type) {
						case 'validationFunc':
							thisArgs.validationFunction = new ExpressionWrapper(this.parenthesizeExpression(arg));
							break;

						case 'numberMax':
							(<IntrinsicTypeDefinitionNumber>thisArgs.typedef!).maxVal;
							break;

						case 'numberMin':
							(<IntrinsicTypeDefinitionNumber>thisArgs.typedef!).minVal;
							break;

						default:
							throw new Error('Unknown argdef type');
					}
				}

				// Change decorator arguments
				decorator.expression.arguments = ts.createNodeArray([this.objectToLiteral(thisArgs)]);
			}
		}
		
		return node;
	}

	private parenthesizeExpression(expression: ts.Expression) {
		return ts.isParenthesizedExpression(expression)
			? expression
			: ts.createParen(expression);
	}

	private getInternalTypeRepresentation(node: ts.TypeNode, type: ts.Type): InternalTypeDefinition {
		const base = {
			...(ts.isPropertySignature(node)
				? { optional: !!node.questionToken }
				: {})
		};
		
		if (isIntrinsicType(type)) {
			return {
				...base,
				type: <any>type.intrinsicName,
			}
		} else if (ts.isUnionTypeNode(node) && isUnionType(node, type)) {
			return {
				...base,
				type: 'union',
				types: type.types.map((t, i) => this.getInternalTypeRepresentation(node.types[i], t)),
			}
		} else if (ts.isIntersectionTypeNode(node) && isIntersectionType(node, type)) {
			return {
				...base,
				type: 'intersection',
				types: type.types.map((t, i) => this.getInternalTypeRepresentation(node.types[i], t)),
			}
		} else if (node && ts.isArrayTypeNode(node)) {
			return {
				...base,
				type: 'array',
				elementType: this.getInternalTypeRepresentation(node.elementType, this.typeChecker.getTypeFromTypeNode(node.elementType)),
			};
		} else if (type.symbol && isSymbolWithId(type.symbol)) {
			const name = this.typeChecker.getFullyQualifiedName(type.symbol);
			for (const symbol of this.generator.getSymbols(name)) {
				if (isSymbolWithId(symbol.symbol) && symbol.symbol.id === type.symbol.id) {
					return {
						...base,
						type: 'object',
						schema: this.generator.getSchemaForSymbol(symbol.name),
					}
				}
			}
		} else if (type.aliasSymbol && type.aliasSymbol.declarations.length > 0) {
			for (const decl of type.aliasSymbol.declarations) {
				if (!ts.isTypeAliasDeclaration(decl)) {
					continue;
				}

				if (decl.type && ts.isTypeNode(decl.type)) {
					return this.getInternalTypeRepresentation(decl.type, this.typeChecker.getTypeFromTypeNode(decl.type));
				}
			}
		} else if (node && ts.isParenthesizedTypeNode(node)) {
			return this.getInternalTypeRepresentation(node.type, this.typeChecker.getTypeFromTypeNode(node.type));
		} else {
			console.log(node);
			console.log(type);
		}
	}

	private valueToLiteral(val: any): ts.Expression {
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
				} else if (val instanceof ExpressionWrapper) {
					return val.node;
				} else {
					return this.objectToLiteral(val);
				}

			case 'undefined':
				return ts.createIdentifier('undefined');

			default:
				throw new Error(`Unknown type serialization path: ${typeof val}`);
		}
	}

	private objectToLiteral(val: object): ts.ObjectLiteralExpression {
		return ts.createObjectLiteral(
			Object.keys(val).map(
				k => ts.createPropertyAssignment(k, this.valueToLiteral(<any>val[<any>k]))
				),
			false)
	}

	private isArgumentDecoratorCallExpression(decorator: ts.Decorator['expression']): decorator is ts.CallExpression {
		if (!ts.isCallExpression(decorator)) {
			return false;
		}

		const signature = this.typeChecker.getResolvedSignature(decorator);
		if (typeof signature === 'undefined') {
			return false;
		}

		const { declaration } = signature;
		if (!(
			!!declaration
			&& !ts.isJSDocSignature(declaration)
			&& !!declaration.name
			&& declaration.name.getText() === this.transformInfo.magicFunctionName)
		) {
			return false;
		};

		const sourceFile = path.join(declaration.getSourceFile().fileName);
		return sourceFile.endsWith(this.transformInfo.indexTs + '.ts') || sourceFile.endsWith(this.transformInfo.indexTs + '.d.ts');
	}

	private isDecoratedParameterExpression(node: ts.Node): node is ts.ParameterDeclaration {
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
}

interface SymbolWithId extends ts.Symbol {
	id: number;
}

interface IntrinsicType extends ts.Type {
	intrinsicName: InternalTypeDefinition['type'];
}

interface UnionType extends ts.Type {
	types: ts.Type[];
}

interface IntersectionType extends ts.Type {
	types: ts.Type[];
}

interface ArrayType extends ts.Type {
	elementType: ts.Type;
}

function isSymbolWithId(s: ts.Symbol & Partial<SymbolWithId>): s is SymbolWithId {
	return typeof s.id === 'number';
}

function isIntrinsicType(s: ts.Type & Partial<IntrinsicType>): s is IntrinsicType {
	return typeof s.intrinsicName === 'string';
}

function isUnionType(n: ts.TypeNode, s: ts.Type & Partial<UnionType>): s is UnionType {
	if (n) {
		return ts.isUnionTypeNode(n);
	}

	return Array.isArray(s.types);
}

function isIntersectionType(n: ts.TypeNode, s: ts.Type & Partial<IntersectionType>): s is IntersectionType {
	if (n) {
		return ts.isIntersectionTypeNode(n);
	}
	
	return Array.isArray(s.types);
}