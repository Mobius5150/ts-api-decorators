import * as ts from 'typescript';
import { IDecoratorDefinition } from './DecoratorDefinition';
import { ApiMethod } from '../../apiManagement';
import { IApiParamDefinition } from '../../apiManagement/ApiDefinition';

export enum HandlerTreeNodeType {
	Dependency,
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

export interface IHandlerTreeNodeBase {
	type: HandlerTreeNodeType;
	decorator: IDecoratorDefinition;
	location: IHandlerLocation;
	children: IHandlerTreeNode[];
	parent?: IHandlerTreeNode;
}

export interface IHandlerTreeNodeDependency extends IHandlerTreeNodeBase {
	type: HandlerTreeNodeType.Dependency;
}

export interface IHandlerTreeNodeHandlerCollection extends IHandlerTreeNodeBase {
	type: HandlerTreeNodeType.HandlerCollection;
}

export interface IHandlerTreeNodeHandler extends IHandlerTreeNodeBase {
	type: HandlerTreeNodeType.Handler;
	apiMethod: ApiMethod;
	route: string;
}

export interface IHandlerTreeNodeHandlerModifier extends IHandlerTreeNodeBase {
	type: HandlerTreeNodeType.HandlerModifier;
}

export interface IHandlerTreeNodeParameter extends IHandlerTreeNodeBase {
	type: HandlerTreeNodeType.HandlerParameter;
	paramDef: IApiParamDefinition;
}

export type IHandlerTreeNode = IHandlerTreeNodeDependency | IHandlerTreeNodeHandlerCollection | IHandlerTreeNodeHandler | IHandlerTreeNodeHandlerModifier | IHandlerTreeNodeParameter;

export interface ITransformedTreeElement<T extends ts.Node> {
	transformedDecorator?: T;
	decoratorTreeNode: IHandlerTreeNode;
}