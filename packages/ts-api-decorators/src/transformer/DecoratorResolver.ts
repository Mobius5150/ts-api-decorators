import { IDecorator, DecoratorNodeType } from "./Decorator";
import { CollectionUtil } from "../Util/CollectionUtil";
import { IHandlerTreeNode } from './HandlerTree';
import { IDecoratorResolver } from './IDecoratorResolver';

export class DecoratorResolver implements IDecoratorResolver {
	private nodeTypeMap = new Map<DecoratorNodeType, Set<IDecorator>>();

	public constructor(
		defaultDecorators?: IDecorator[],
	) {
		if (defaultDecorators) {
			for (const decorator of defaultDecorators) {
				this.addDecorator(decorator);
			}
		}
	}

	public addDecorator(decorator: IDecorator): void {
		CollectionUtil.addToMapSet(this.nodeTypeMap, decorator.nodeType, decorator);
	}

	public getDecoratorsForNodeType(type: DecoratorNodeType, parent?: IHandlerTreeNode): IDecorator[] {
		return Array.from(CollectionUtil.getSet(this.nodeTypeMap, type) || []);
	}
}