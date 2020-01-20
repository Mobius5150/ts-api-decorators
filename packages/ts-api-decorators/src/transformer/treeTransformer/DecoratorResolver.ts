import * as ts from 'typescript';
import { IDecorator, DecoratorNodeType } from "./Decorator";
import { CollectionUtil } from "../../Util/CollectionUtil";
import { IHandlerTreeNode } from './HandlerTree';
import { DecoratorDependencyLocation } from './DecoratorDefinition';
import { HandlerTreeDependencyUtil } from './HandlerTreeDependencyUtil';

export class DecoratorResolver {
	private nodeTypeMap = new Map<DecoratorNodeType, Set<IDecorator>>();

	public addDecorator(decorator: IDecorator): void {
		CollectionUtil.addToMapSet(this.nodeTypeMap, decorator.nodeType, decorator);
	}

	public getDecoratorsForNodeType(type: DecoratorNodeType, parent?: IHandlerTreeNode): IDecorator[] {
		return Array.from(CollectionUtil.getSet(this.nodeTypeMap, type));
	}

	public getRootNodeTypes(): DecoratorNodeType[] {
		const nodeTypes: DecoratorNodeType[] = [];
		for (const [type, decorators] of this.nodeTypeMap) {
			for (const decorator of decorators) {
				if (!this.hasParentDependency(decorator)) {
					nodeTypes.push(type);
					break;
				}
			}
		}

		return nodeTypes;
	}
	
	private hasParentDependency(decorator: IDecorator<ts.Node>): boolean {
		return !!decorator.dependencies.find(d => d.location === DecoratorDependencyLocation.Parent);
	}
}