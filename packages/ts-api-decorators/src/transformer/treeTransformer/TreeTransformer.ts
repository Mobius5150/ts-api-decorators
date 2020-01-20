import * as ts from 'typescript';
import * as path from 'path';
import * as tjs from 'typescript-json-schema';
import { TypeSerializer } from '../TypeSerializer';
import { DecoratorResolver } from './DecoratorResolver';
import { DecoratorNodeType, IDecorator } from './Decorator';
import { IHandlerTreeNode } from './HandlerTree';
import { ITransformContext } from './ITransformContext';
import { IMetadataResolver } from '../MetadataManager';

export abstract class TreeTransformer {
	protected readonly typeChecker: ts.TypeChecker;
	protected readonly typeSerializer: TypeSerializer;
	protected readonly transformContext: ITransformContext;

	constructor(
        protected readonly program: ts.Program,
        protected readonly generator: tjs.JsonSchemaGenerator,
		protected readonly decorators: DecoratorResolver,
		protected readonly applyTransformation: boolean,
		metadataManager: IMetadataResolver,
    ) {
		this.typeChecker = this.program.getTypeChecker();
		this.typeSerializer = new TypeSerializer(program, generator, this.typeChecker);
		this.transformContext = {
			generator,
			metadataManager,
			program,
			typeChecker: this.typeChecker,
			typeSerializer: this.typeSerializer,
		};
    }

    public visitNode(node: ts.Node, context: ts.TransformationContext): ts.Node {
		if (this.isPotentialClassContainer(node)) {
			return this.visitNodeChildren(node, context);
		}

		return this.visitNodeInTreeContext(node, context, undefined);
	}

	private visitNodeChildren(node, context): ts.Node {
		return ts.visitEachChild(node, node => this.visitNode(node, context), context);
	}
	
	private visitNodeInTreeContext(node: ts.Node, context: ts.TransformationContext, parent?: IHandlerTreeNode): ts.Node {
		const nodeType = this.getTypeForNode(node);
		if (!nodeType || !this.nodeHasDecorators(node)) {
			if (parent) {
				return this.visitNodeChildrenInTreeContext(node, context, parent);
			} else {
				return this.visitNodeChildren(node, context);
			}
		}

		const decorators = this.decorators.getDecoratorsForNodeType(nodeType, parent);
		const nodeDecorators: ts.Decorator[] = [];
		for (let i = 0; i < node.decorators.length; ++i) {
			nodeDecorators[i] = node.decorators[i];
			for (const definition of decorators) {
				if (this.isArgumentDecoratorCallExpression(nodeDecorators[i].expression, definition)) {
					const treeNode = definition.getDecoratorTreeElement(parent, node, nodeDecorators[i], this.transformContext);
					if (parent) {
						parent.children.push(treeNode.decoratorTreeNode);
					}

					if (treeNode.transformedDecorator) {
						nodeDecorators[i] = treeNode.transformedDecorator;
					}

					node = this.visitNodeChildrenInTreeContext(node, context, treeNode.decoratorTreeNode);
				}
			}
		}

		if (this.applyTransformation) {
			node.decorators = ts.createNodeArray(nodeDecorators);
		}

		return node;
	}
	
	private visitNodeChildrenInTreeContext(node: ts.Node, context: ts.TransformationContext, parent?: IHandlerTreeNode): ts.Node {
		return ts.visitEachChild(node, node => this.visitNodeInTreeContext(node, context, parent), context);
	}

	private nodeHasDecorators(node: ts.Node) {
		return node.decorators && node.decorators.length > 0;
	}

	/**
	 * Returns true if this node type could potentially contain a class
	 * @param node 
	 */
	private isPotentialClassContainer(node: ts.Node) {
		return ts.isSourceFile(node) || ts.isModuleBlock(node) || ts.isModuleDeclaration(node);
	}

	public getTypeForNode(node: ts.Node): DecoratorNodeType {
		if (ts.isMethodDeclaration(node)) {
			return DecoratorNodeType.Method;
		} else if (ts.isClassDeclaration(node)) {
			return DecoratorNodeType.Class;
		} else if (ts.isParameter(node)) {
			return DecoratorNodeType.Parameter;
		}
	}

    protected isArgumentDecoratorCallExpression(decoratorExpression: ts.Decorator['expression'], definition: IDecorator): decoratorExpression is ts.CallExpression {
		if (!ts.isCallExpression(decoratorExpression)) {
			return false;
        }
        
		const signature = this.typeChecker.getResolvedSignature(decoratorExpression);
		if (typeof signature === 'undefined') {
			return false;
        }
        
		const { declaration } = signature;
		if (!(!!declaration
			&& !ts.isJSDocSignature(declaration)
			&& !!declaration.name
			&& declaration.name.getText() === definition.magicFunctionName)) {
			return false;
		}
		
		const sourceFile = path.join(declaration.getSourceFile().fileName);
		return sourceFile.endsWith(definition.indexTs + '.ts') || sourceFile.endsWith(definition.indexTs + '.d.ts');
	}
}