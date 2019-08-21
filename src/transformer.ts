import * as ts from 'typescript';
import * as path from 'path';
import * as tjs from "typescript-json-schema";

export default function transformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
	const generator = tjs.buildGenerator(program, {
		uniqueNames: true,
	});
	return (context: ts.TransformationContext) => (file: ts.SourceFile) => visitNodeAndChildren(file, program, context, generator);
}

function visitNodeAndChildren(node: ts.SourceFile, program: ts.Program, context: ts.TransformationContext, generator: tjs.JsonSchemaGenerator): ts.SourceFile;
function visitNodeAndChildren(node: ts.Node, program: ts.Program, context: ts.TransformationContext, generator: tjs.JsonSchemaGenerator): ts.Node;
function visitNodeAndChildren(node: ts.Node, program: ts.Program, context: ts.TransformationContext, generator: tjs.JsonSchemaGenerator): ts.Node {
	return ts.visitEachChild(visitNode(node, program, generator), childNode => visitNodeAndChildren(childNode, program, context, generator), context);
}

function visitNode(node: ts.Node, program: ts.Program, generator: tjs.JsonSchemaGenerator): ts.Node {
	const typeChecker = program.getTypeChecker();
	if (!isKeysCallExpression(node, typeChecker)) {
		return node;
	}

	let internalType: InternalTypeDefinition | undefined;
	if (node.typeArguments) {
		const typeNode = node.typeArguments[0];
		const type = typeChecker.getTypeFromTypeNode(typeNode);
		internalType = getInternalTypeRepresentation(typeNode, type, typeChecker, generator);	
	} else {
		// No type definition, so can be anything
		internalType = {
			type: 'any',
		}
	}

	if (internalType) {
		return valueToLiteral(internalType);
	}
	
	return node;
}

function getInternalTypeRepresentation(node: ts.TypeNode, type: ts.Type, typeChecker: ts.TypeChecker, generator: tjs.JsonSchemaGenerator): InternalTypeDefinition {
	if (isIntrinsicType(type)) {
		return {
			type: <any>type.intrinsicName,
		}
	} else if (ts.isUnionTypeNode(node) && isUnionType(node, type)) {
		return {
			type: 'union',
			types: type.types.map((t, i) => getInternalTypeRepresentation(node.types[i], t, typeChecker, generator)),
		}
	} else if (ts.isIntersectionTypeNode(node) && isIntersectionType(node, type)) {
		return {
			type: 'intersection',
			types: type.types.map((t, i) => getInternalTypeRepresentation(node.types[i], t, typeChecker, generator)),
		}
	} else if (node && ts.isArrayTypeNode(node)) {
		return {
			type: 'array',
			elementType: getInternalTypeRepresentation(node.elementType, typeChecker.getTypeFromTypeNode(node.elementType), typeChecker, generator),
		};
	} else if (type.symbol && isSymbolWithId(type.symbol)) {
		const name = typeChecker.getFullyQualifiedName(type.symbol);
		for (const symbol of generator.getSymbols(name)) {
			if (isSymbolWithId(symbol.symbol) && symbol.symbol.id === type.symbol.id) {
				return {
					type: 'object',
					schema: generator.getSchemaForSymbol(symbol.name),
				}
			}
		}
	} else if (type.aliasSymbol && type.aliasSymbol.declarations.length > 0) {
		for (const decl of type.aliasSymbol.declarations) {
			if (!ts.isTypeAliasDeclaration(decl)) {
				continue;
			}

			if (decl.type && ts.isTypeNode(decl.type)) {
				return getInternalTypeRepresentation(decl.type, typeChecker.getTypeFromTypeNode(decl.type), typeChecker, generator);
			}
		}
	} else if (node && ts.isParenthesizedTypeNode(node)) {
		return getInternalTypeRepresentation(node.type, typeChecker.getTypeFromTypeNode(node.type), typeChecker, generator);
	} else {
		console.log(node);
		console.log(type);
	}
}

interface IntrinsicTypeDefinition {
	type: 'string' | 'number' | 'boolean' | 'any';
}

type InternalTypeDefinition = IntrinsicTypeDefinition | InternalObjectTypeDefinition | InternalUnionTypeDefinition | InternalIntersectionTypeDefinition | InternalArrayTypeDefinition;

interface InternalObjectTypeDefinition {
	type: 'object';
	schema: object;
}

interface InternalUnionTypeDefinition {
	type: 'union';
	types: InternalTypeDefinition[];
}

interface InternalArrayTypeDefinition {
	type: 'array';
	elementType: InternalTypeDefinition;
}

// TODO: The intersection type will probably yield less-than optimal results or longer validation runtime. Should see if it can be collapased to the single resulting type
interface InternalIntersectionTypeDefinition {
	type: 'intersection';
	types: InternalTypeDefinition[];
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

function valueToLiteral(val: any): ts.Expression {
	switch (typeof val) {
		case 'string': 
		case 'number':
		case 'boolean':
			return ts.createLiteral(val);
		
		case 'bigint':
			return ts.createBigIntLiteral(val.toString());
		
		case 'object':
			if (Array.isArray(val)) {
				return ts.createArrayLiteral(val.map(v => valueToLiteral(v)));
			} else {
				return ts.createObjectLiteral(
					Object.keys(val).map(
						k => ts.createPropertyAssignment(k, valueToLiteral(val[k]))
						),
					false)
			}

		case 'undefined':
			return ts.createIdentifier('undefined');

		default:
			throw new Error(`Unknown type serialization path: ${typeof val}`);
	}
}

const magicFunctionName = 'magicSchema';
const indexTs = path.join(__dirname, `index.d.ts`);
function isKeysCallExpression(node: ts.Node, typeChecker: ts.TypeChecker): node is ts.CallExpression {
	if (!ts.isCallExpression(node)) {
		return false;
	}

	const signature = typeChecker.getResolvedSignature(node);
	if (typeof signature === 'undefined') {
		return false;
	}

	const { declaration } = signature;
	return !!declaration
		&& !ts.isJSDocSignature(declaration)
		&& (path.join(declaration.getSourceFile().fileName) === indexTs)
		&& !!declaration.name
		&& declaration.name.getText() === magicFunctionName;
}
