import * as ts from 'typescript';
import { NodeWithTypeArguments } from 'typescript';
import { InternalTypeDefinition, BuiltinTypeNames } from '../apiManagement/InternalTypes';

export interface SymbolWithId extends ts.Symbol {
    id: number;
}

export interface SymbolWithParent extends ts.Symbol {
    parent: ts.Symbol;
}

export interface IntrinsicType extends ts.Type {
    intrinsicName: InternalTypeDefinition['type'];
}

export interface UnionType extends ts.Type {
    types: ts.Type[];
}

export interface IntersectionType extends ts.Type {
    types: ts.Type[];
}

export interface ArrayType extends ts.Type {
    elementType: ts.Type;
}

export interface WithJsDoc extends ts.Node {
    jsDoc: ts.JSDoc[];
}

export interface NamedNode extends ts.Node {
    name: ts.PropertyName;
}

export interface BuiltinSymbol extends ts.Symbol {
    name: BuiltinTypeNames;
}

export interface ParameterizedType extends ts.Type {
    resolvedTypeArguments: ts.Type[];
    typeArguments: ts.Type[];
}

export function isNamedNode(n: ts.Node & Partial<NamedNode>): n is NamedNode {
    return typeof n.name !== 'undefined';
}

export function isSymbolWithId(s: ts.Symbol & Partial<SymbolWithId>): s is SymbolWithId {
    return typeof s.id === 'number';
}

export function isSymbolWithParent(s: ts.Symbol & Partial<SymbolWithParent>): s is SymbolWithParent {
    return typeof s.parent === 'object';
}

export function isBuiltinSymbol(s: ts.Symbol): s is BuiltinSymbol {
    return s.name === Buffer.name || s.name === Promise.name;
}

export function isIntrinsicType(s: ts.Type & Partial<IntrinsicType>): s is IntrinsicType {
    return typeof s.intrinsicName === 'string';
}

export function isUnionType(n: ts.TypeNode, s: ts.Type & Partial<UnionType>): s is UnionType {
    if (n) {
        return ts.isUnionTypeNode(n);
    }
    
    return Array.isArray(s.types);
}

export function isParameterizedType(t: ts.Type & Partial<ParameterizedType>): t is ParameterizedType {
    if (t) {
        return Array.isArray(t.resolvedTypeArguments);
    }
    
    return false;
}

export function isNodeWithTypeArguments(n: ts.Node & Partial<NodeWithTypeArguments>): n is NodeWithTypeArguments {
    return !!n && Array.isArray(n.typeArguments);
}

export function isIntersectionType(n: ts.TypeNode, s: ts.Type & Partial<IntersectionType>): s is IntersectionType {
    if (n) {
        return ts.isIntersectionTypeNode(n);
    }

    return Array.isArray(s.types);
}

export function isNodeWithJsDoc(n: ts.Node): n is WithJsDoc {
    return Array.isArray((<WithJsDoc>n).jsDoc);
}

export function isNamedDeclaration(n: ts.Declaration): n is ts.NamedDeclaration {
    return typeof (<ts.NamedDeclaration>n).name !== 'undefined';
}

export function isTypeWithSymbol<T extends object>(t: T): t is T & { symbol: ts.Symbol } {
    return typeof (<any>t).symbol === 'object';
}