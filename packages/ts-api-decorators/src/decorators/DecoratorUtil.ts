import { IDecorator } from "../transformer/Decorator";
import { AbstractClassConstructor,  ClassConstructor1 } from "../Util/ClassConstructors";
import { DecoratorDependencyLocation, IDecoratorDependency, DecoratorDependencyType, IDecoratorDefinitionBase } from "../transformer/DecoratorDefinition";

const apiDecoratorKey = 'apidecorator';
export function ApiDecorator<Def extends Omit<IDecoratorDefinitionBase, 'decoratorType'>, Dec extends IDecorator = IDecorator>(c: ClassConstructor1<Def, Dec>, d: Omit<Def, 'magicFunctionName'>) {
	return (
		target: object,
		propertyKey: string,
		descriptor: TypedPropertyDescriptor<any>
	) => {
		descriptor.writable = false;
		descriptor.configurable = false;
		Reflect.defineMetadata(apiDecoratorKey, new c(<Def>{
			...d,
			magicFunctionName: propertyKey,
		}), target, propertyKey);
	}
}

export function ApiMethodDecoratorGetFunction<D extends IDecorator>(baseClass: AbstractClassConstructor) {
	return (param: string | Function): D => {
		return <D>Reflect.getMetadata(apiDecoratorKey, baseClass, typeof param === 'function' ? param.name : param);
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