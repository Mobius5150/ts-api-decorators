import * as ts from 'typescript';
import { InternalTypeDefinition } from '../apiManagement/InternalTypes';

export interface SymbolWithId extends ts.Symbol {
    id: number;
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

export function isNamedNode(n: ts.Node & Partial<NamedNode>): n is NamedNode {
    return typeof n.name !== 'undefined';
}

export function isSymbolWithId(s: ts.Symbol & Partial<SymbolWithId>): s is SymbolWithId {
    return typeof s.id === 'number';
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

export function isIntersectionType(n: ts.TypeNode, s: ts.Type & Partial<IntersectionType>): s is IntersectionType {
    if (n) {
        return ts.isIntersectionTypeNode(n);
    }

    return Array.isArray(s.types);
}

export function isNodeWithJsDoc(n: ts.Node): n is WithJsDoc {
    return Array.isArray((<WithJsDoc>n).jsDoc);
}