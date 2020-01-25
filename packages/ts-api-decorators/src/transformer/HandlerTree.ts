import * as ts from 'typescript';
import { IDecoratorDefinition } from './DecoratorDefinition';
import { ApiMethod } from '../apiManagement';
import { IApiParamDefinition } from '../apiManagement/ApiDefinition';
import { ITransformerMetadataCollection } from './TransformerMetadata';

export enum HandlerTreeNodeType {
	Root,
	Dependency,
	DependencyProperty,
	HandlerCollection,
	Handler,
	HandlerModifier,
	HandlerParameter,
}

export interface IHandlerLocation {
	file: string;
	line: number;
	character: number;
	position: number;
}

export interface IHandlerTreeNodeBase extends ITransformerMetadataCollection {
	type: HandlerTreeNodeType;
	children: IHandlerTreeNode[];
	parent?: IHandlerTreeNode;
}

export interface IHandlerTreeNodeRoot extends IHandlerTreeNodeBase {
	type: HandlerTreeNodeType.Root;
	parent?: undefined;
}

export interface IHandlerTreeDecoratorNodeBase extends IHandlerTreeNodeBase {
	decorator: IDecoratorDefinition;
	location: IHandlerLocation;
}

export function isDecoratorNode(node: IHandlerTreeNode): node is IHandlerTreeDecoratorNode {
	return !!(<IHandlerTreeDecoratorNode>node).decorator;
}

export interface IHandlerTreeNodeDependency extends IHandlerTreeDecoratorNodeBase {
	type: HandlerTreeNodeType.Dependency;
}

export const isDependencyNode = isNodeByType<IHandlerTreeNodeDependency>(HandlerTreeNodeType.Dependency);

export interface IHandlerTreeNodeDependencyProperty extends IHandlerTreeDecoratorNodeBase {
	type: HandlerTreeNodeType.DependencyProperty;
}

export const isDependencyPropertyNode = isNodeByType<IHandlerTreeNodeDependencyProperty>(HandlerTreeNodeType.DependencyProperty);

export interface IHandlerTreeNodeHandlerCollection extends IHandlerTreeDecoratorNodeBase {
	type: HandlerTreeNodeType.HandlerCollection;
}

export const isHandlerCollectionNode = isNodeByType<IHandlerTreeNodeHandlerCollection>(HandlerTreeNodeType.HandlerCollection);

export interface IHandlerTreeNodeHandler extends IHandlerTreeDecoratorNodeBase {
	type: HandlerTreeNodeType.Handler;
	apiMethod: ApiMethod;
	route: string;
}

export const isHandlerNode = isNodeByType<IHandlerTreeNodeHandler>(HandlerTreeNodeType.Handler);

export interface IHandlerTreeNodeHandlerModifier extends IHandlerTreeDecoratorNodeBase {
	type: HandlerTreeNodeType.HandlerModifier;
}

export const isHandlerModifierNode = isNodeByType<IHandlerTreeNodeHandlerModifier>(HandlerTreeNodeType.HandlerModifier);

export interface IHandlerTreeNodeParameter extends IHandlerTreeDecoratorNodeBase {
	type: HandlerTreeNodeType.HandlerParameter;
	paramDef: IApiParamDefinition;
}

export const isHandlerParameterNode = isNodeByType<IHandlerTreeNodeParameter>(HandlerTreeNodeType.HandlerParameter);

export type IHandlerTreeDecoratorNode =
	| IHandlerTreeNodeDependency
	| IHandlerTreeNodeDependencyProperty
	| IHandlerTreeNodeHandlerCollection
	| IHandlerTreeNodeHandler
	| IHandlerTreeNodeHandlerModifier
	| IHandlerTreeNodeParameter
;

export type IHandlerTreeNode = IHandlerTreeNodeRoot | IHandlerTreeDecoratorNode;

export interface ITransformedTreeElement<T extends ts.Node> {
	transformedDecorator?: T;
	decoratorTreeNode: IHandlerTreeNode;
}

function isNodeByType<T extends any>(type: HandlerTreeNodeType): (node: IHandlerTreeNode) => node is T {
	return (node): node is T => {
		return node.type === type;
	};
}

/**
 * Performs a depth-first search of the tree, yielding each node
 */
export function* WalkTree(node: IHandlerTreeNode): Generator<IHandlerTreeNode, void, void> {
	yield * WalkTreeByType<IHandlerTreeNode>(node);
}

/**
 * Performs a depth-first search of a tree, only returning nodes that match checkFunc.
 * @param node 
 * @param checkFunc 
 */
export function* WalkTreeByType<T extends any>(node: IHandlerTreeNode, checkFunc?: (node) => node is T): Generator<T, void, void> {
	for (const child of node.children) {
		if (!checkFunc || checkFunc(node)) {
			yield <T>node;
		}

		yield * WalkTreeByType<T>(child, checkFunc);
	}
}

/**
 * Performs a depth-first search of a tree, only returning nodes that match checkFunc.
 * @param node 
 * @param checkFunc 
 */
export function* WalkChildrenByType<T extends any>(node: IHandlerTreeNode, checkFunc?: (node) => node is T): Generator<T, void, void> {
	for (const child of node.children) {
		if (!checkFunc || checkFunc(node)) {
			yield <T>node;
		}
	}
}