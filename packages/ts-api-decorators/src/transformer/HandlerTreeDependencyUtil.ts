import { IDecoratorDependency, DecoratorDependencyLocation, DecoratorDependencyType } from "./DecoratorDefinition";
import { IHandlerTreeNode, isDecoratorNode } from "./HandlerTree";

export abstract class HandlerTreeDependencyUtil {
	public static CheckParentNodeDependencySatisfied(dependency: IDecoratorDependency, parent?: IHandlerTreeNode): boolean {
		if (dependency.location !== DecoratorDependencyLocation.Parent) {
			throw new Error('Not a parent dependency');
		}

		do {
			if (!parent) {
				return false;
			}

			if (this.CheckDependency(dependency, parent)) {
				return true;
			}
		} while (parent = parent.parent);

		return false;
	}

	private static CheckDependency(dependency: IDecoratorDependency, node: IHandlerTreeNode) {
		if (!isDecoratorNode(node)) {
			return false;
		}
		
		switch (dependency.type) {
			case DecoratorDependencyType.NameDependency:
				return node.decorator.magicFunctionName === dependency.dependency;

			case DecoratorDependencyType.ProviderDependency:
				return node.decorator.provider === dependency.dependency;

			default:
				throw new Error(`Unknown dependency type: ${dependency.type}`);
		}
	}

	public static CheckPeerNodeDependencySatisfied(dependency: IDecoratorDependency, node: IHandlerTreeNode): boolean {
		if (dependency.location !== DecoratorDependencyLocation.Peer) {
			throw new Error('Not a peer dependency');
		}

		if (node.parent) {
			return !!node.parent.children.find(c => this.CheckDependency(dependency, c));
		}

		return false;
	}
}