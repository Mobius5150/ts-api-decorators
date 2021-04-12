import * as ts from 'typescript';
import * as path from 'path';
import * as tjs from 'typescript-json-schema';
import { TypeSerializer } from './TypeSerializer';
import { DecoratorNodeType, IDecorator } from './Decorator';
import { IHandlerTreeNode, IHandlerTreeNodeRoot, HandlerTreeNodeType, ITransformedTreeElement } from './HandlerTree';
import { ITransformContext } from './ITransformContext';
import { IMetadataResolver } from './MetadataManager';
import { IDecoratorResolver } from './IDecoratorResolver';
import { ITransformer } from './ITransformer';
import { isNamedDeclaration, isTypeWithSymbol } from './TransformerUtil';
import { DecoratorNodeTreeHierarchyType } from './DecoratorDefinition';

export class TreeTransformer implements ITransformer {
	protected readonly typeChecker: ts.TypeChecker;
	protected readonly typeSerializer: TypeSerializer;
	protected readonly transformContext: ITransformContext;

	private readonly transformedNodes = new Map<ts.Node, Map<ts.Decorator, ITransformedTreeElement<ts.Decorator>>>();

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
		if (typeof nodeType === 'undefined' || !this.nodeHasDecorators(node)) {
			if (parent) {
				return this.visitNodeChildrenInTreeContext(node, context, parent);
			} else {
				return this.visitNodeChildren(node, context);
			}
		}

		const decorators = this.decorators.getDecoratorsForNodeType(nodeType, parent);
		const nodeDecorators: ts.Decorator[] = [];
		const nodeTypes = {
			[DecoratorNodeTreeHierarchyType.Child]: <IHandlerTreeNode[]>[],
			[DecoratorNodeTreeHierarchyType.Modifier]: <IHandlerTreeNode[]>[],
		};

		for (let i = 0; i < node.decorators.length; ++i) {
			nodeDecorators[i] = node.decorators[i];
			for (const definition of decorators) {
				if (
					(definition.isCallExpression && this.isArgumentDecoratorCallExpression(nodeDecorators[i].expression, definition))
					|| (!definition.isCallExpression && this.isArgumentDecoratorExpression(nodeDecorators[i].expression, definition))
				) {
					const treeNode = this.getDecoratorTreeElement(definition, parent, node, nodeDecorators[i]);
					nodeTypes[definition.treeHierarchyType].push(treeNode.decoratorTreeNode);

					if (treeNode.transformedDecorator) {
						nodeDecorators[i] = treeNode.transformedDecorator;
						this.cacheDecoratorTreeElement(node, nodeDecorators[i], treeNode);
					}

					node = this.visitNodeChildrenInTreeContext(node, context, treeNode.decoratorTreeNode);
				}
			}
		}

		for (const node of nodeTypes[DecoratorNodeTreeHierarchyType.Child]) {
			parent.children.push(node);
			for (const modifierNode of nodeTypes[DecoratorNodeTreeHierarchyType.Modifier]) {
				node.children.push(modifierNode);
			}
		}

		if (this.applyTransformation) {
			node.decorators = ts.createNodeArray(nodeDecorators);
		}

		return node;
	}

	private getDecoratorTreeElement(definition: IDecorator<ts.Node>, parent: IHandlerTreeNode, node: ts.Node, decorator: ts.Decorator): ITransformedTreeElement<ts.Decorator> {
		if (!this.transformedNodes.has(node)) {
			this.transformedNodes.set(node, new Map());
		}

		const set = this.transformedNodes.get(node);
		if (!set.has(decorator)) {
			this.cacheDecoratorTreeElement(node, decorator, definition.getDecoratorTreeElement(parent, node, decorator, this.transformContext));
		}
		
		return set.get(decorator);
	}

	private cacheDecoratorTreeElement(node: ts.Node, decorator: ts.Decorator, element: ITransformedTreeElement<ts.Decorator>) {
		if (!this.transformedNodes.has(node)) {
			this.transformedNodes.set(node, new Map());
		}

		const set = this.transformedNodes.get(node);
		if (!set.has(decorator)) {
			set.set(decorator, element);
		}
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
        
		return this.isMatchingDeclaration(signature.declaration, definition);
	}

	protected isMatchingDeclaration(declaration: ts.NamedDeclaration, definition: IDecorator): boolean {
		if (!(!!declaration
			&& !ts.isJSDocSignature(declaration)
			&& !!declaration.name
			&& declaration.name.getText() === definition.magicFunctionName)) {
			return false;
		}
		
		return definition.isSourceFileMatch(declaration.getSourceFile());
	}

	protected isArgumentDecoratorExpression(decoratorExpression: ts.Decorator['expression'], definition: IDecorator) {
		if (ts.isCallExpression(decoratorExpression) || !ts.isIdentifier(decoratorExpression)) {
			return false;
		}

		// const symbol = this.typeChecker.getSymbolAtLocation(decoratorExpression);
		// if (!symbol.declarations || symbol.declarations.length === 0) {
		// 	return false;
		// }

		// let declaration: ts.NamedDeclaration;
		// for (const decl of symbol.declarations) {
		// 	if (isNamedDeclaration(decl)) {
		// 		declaration = decl;
		// 		break;
		// 	}
		// }

		// if (!declaration) {
		// 	return false;
		// }
		const signatures = [
			...this.typeChecker.getSignaturesOfType(
				this.typeChecker.getTypeAtLocation(decoratorExpression),
				ts.SignatureKind.Call),
			...this.typeChecker.getSignaturesOfType(
				this.typeChecker.getTypeAtLocation(decoratorExpression),
				ts.SignatureKind.Construct),
		];
		
		return signatures.some(signature => {
			if (!signature || !signature.declaration) {
				return false;
			}
	
			return this.isMatchingDeclaration(signature.declaration, definition);
		});
	}
}