import * as ts from 'typescript';
import * as path from 'path';
import * as tjs from 'typescript-json-schema';
import { TypeSerializer } from './TypeSerializer';
import { DecoratorNodeType, IDecorator } from './Decorator';
import { IHandlerTreeNode, IHandlerTreeNodeRoot, HandlerTreeNodeType } from './HandlerTree';
import { ITransformContext } from './ITransformContext';
import { IMetadataResolver } from './MetadataManager';
import { IDecoratorResolver } from './IDecoratorResolver';
import { ITransformer } from './ITransformer';

export class TreeTransformer implements ITransformer {
	protected readonly typeChecker: ts.TypeChecker;
	protected readonly typeSerializer: TypeSerializer;
	protected readonly transformContext: ITransformContext;

	private readonly rootNode: IHandlerTreeNodeRoot = {
		type: HandlerTreeNodeType.Root,
		children: [],
		metadata: [],
	};

	constructor(
        protected readonly program: ts.Program,
        protected readonly generator: tjs.JsonSchemaGenerator,
		protected readonly decorators: IDecoratorResolver,
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
	
	public get root(): IHandlerTreeNodeRoot {
		return this.rootNode;
	}

	public visitNode(node: ts.SourceFile, context: ts.TransformationContext): ts.SourceFile;
	public visitNode(node: ts.Node, context: ts.TransformationContext): ts.Node;
    public visitNode(node: ts.Node, context: ts.TransformationContext): ts.Node {
		if (this.isPotentialClassContainer(node)) {
			return this.visitNodeChildren(node, context);
		}

		return this.visitNodeInTreeContext(node, context, this.rootNode);
	}

	private visitNodeChildren(node, context): ts.Node {
		return ts.visitEachChild(node, node => this.visitNode(node, context), context);
	}
	
	private visitNodeInTreeContext(node: ts.Node, context: ts.TransformationContext, parent: IHandlerTreeNode): ts.Node {
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
					parent.children.push(treeNode.decoratorTreeNode);

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
		return ts.isSourceFile(node) || ts.isModuleBlock(node) || ts.isModuleDeclaration(node) || ts.isBlock(node);
	}

	public getTypeForNode(node: ts.Node): DecoratorNodeType {
		if (ts.isMethodDeclaration(node)) {
			return DecoratorNodeType.Method;
		} else if (ts.isParameter(node)) {
			return DecoratorNodeType.Parameter;
		} else if (ts.isPropertyDeclaration(node)) {
			return DecoratorNodeType.ClassProperty;
		} else if (ts.isClassDeclaration(node)) {
			return DecoratorNodeType.Class;
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
		
		return definition.isSourceFileMatch(declaration.getSourceFile());
	}
}