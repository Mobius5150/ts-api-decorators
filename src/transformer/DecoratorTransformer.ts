import * as ts from 'typescript';
import * as tjs from "typescript-json-schema";
import * as path from 'path';
import { ITreeTransformer } from "./ITreeTransformer";
import { __ApiParamArgs, InternalTypeDefinition, IntrinsicTypeDefinitionNumber, __ApiParamArgsFuncs, __ApiParamArgsBase } from '../apiManagement/InternalTypes';
import { isIntrinsicType, isUnionType, isIntersectionType, isSymbolWithId } from './TransformerUtil';
import { TypeSerializer } from './TypeSerializer';

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

export type ExpressionWrappedType<T extends object> = {
	[P in keyof T]?: T[P] | ExpressionWrapper;
}

export type ParamArgsInitializer = __ApiParamArgsBase & ExpressionWrappedType<__ApiParamArgsFuncs>;

export abstract class DecoratorTransformer<T extends ts.Node, I extends IDecorationFunctionTransformInfoBase = IDecorationFunctionTransformInfoBase> implements ITreeTransformer {
	protected readonly typeChecker: ts.TypeChecker;
	protected readonly typeSerializer: TypeSerializer;

	constructor(
        protected readonly program: ts.Program,
        protected readonly generator: tjs.JsonSchemaGenerator,
        protected readonly transformInfo: I & IDecoratorFunctionTransformInfo<T> 
    ) {
		this.typeChecker = this.program.getTypeChecker();
		this.typeSerializer = new TypeSerializer(program, generator, this.typeChecker);
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
        
        return this.visitNode(node);
    }

    protected isArgumentDecoratorCallExpression(decorator: ts.Decorator['expression'], transformInfo: IDecorationFunctionTransformInfoBase = this.transformInfo): decorator is ts.CallExpression {
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
			&& declaration.name.getText() === transformInfo.magicFunctionName)) {
			return false;
		}
		
		const sourceFile = path.join(declaration.getSourceFile().fileName);
		return sourceFile.endsWith(transformInfo.indexTs + '.ts') || sourceFile.endsWith(transformInfo.indexTs + '.d.ts');
	}
	
	protected isDecoratedParameterExpression(node: ts.Node, transformInfo: IDecorationFunctionTransformInfoBase = this.transformInfo): node is ts.ParameterDeclaration {
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
}