import * as ts from 'typescript';

export interface ITransformer {
    visitNode(node: ts.SourceFile, context: ts.TransformationContext): ts.SourceFile;
    visitNode(node: ts.Node, context: ts.TransformationContext): ts.Node;
}
