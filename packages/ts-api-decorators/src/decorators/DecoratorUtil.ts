import { IDecorator } from "../transformer/treeTransformer/Decorator";
import { AbstractClassConstructor } from "./API";
import { DecoratorDependencyLocation, IDecoratorDependency, DecoratorDependencyType } from "../transformer/treeTransformer/DecoratorDefinition";

const apiDecoratorKey = 'apidecorator';
export function ApiDecorator<D extends IDecorator>(d: D) {
	return (
		target: object,
		propertyKey: string,
		descriptor: TypedPropertyDescriptor<any>
	) => {
		descriptor.writable = false;
		descriptor.configurable = false;
		Reflect.defineMetadata(apiDecoratorKey, d, target, propertyKey);
	}
}

export function ApiMethodDecoratorGetFunction<D extends IDecorator>(baseClass: AbstractClassConstructor) {
	return (param: string): D => {
		return <D>Reflect.getMetadata(apiDecoratorKey, baseClass, param);
	}
}

export function DecoratorParentDependency(type: DecoratorDependencyType, value: string): IDecoratorDependency {
	return {
		type,
		dependency: value,
		location: DecoratorDependencyLocation.Parent,
	}
}

export function DecoratorParentNameDependency(value: string): IDecoratorDependency {
	return {
		type: DecoratorDependencyType.NameDependency,
		dependency: value,
		location: DecoratorDependencyLocation.Parent,
	}
}

export function DecoratorParentProviderDependency(value: string): IDecoratorDependency {
	return {
		type: DecoratorDependencyType.ProviderDependency,
		dependency: value,
		location: DecoratorDependencyLocation.Parent,
	}
}

export function DecoratorPeerDependency(type: DecoratorDependencyType, value: string): IDecoratorDependency {
	return {
		type,
		dependency: value,
		location: DecoratorDependencyLocation.Peer,
	}
}