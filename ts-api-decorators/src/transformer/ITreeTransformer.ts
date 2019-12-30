import * as ts from 'typescript';

export interface ITreeTransformer {
    visitNodeAndChildren(node: ts.SourceFile, context: ts.TransformationContext): ts.SourceFile;
    visitNodeAndChildren(node: ts.Node, context: ts.TransformationContext): ts.Node;
}
