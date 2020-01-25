import { IDecorator, DecoratorNodeType } from "./Decorator";
import { IHandlerTreeNode } from "./HandlerTree";

export interface IDecoratorResolver {
	addDecorator(decorator: IDecorator): void;
	getDecoratorsForNodeType(type: DecoratorNodeType, parent?: IHandlerTreeNode): IDecorator[];
}