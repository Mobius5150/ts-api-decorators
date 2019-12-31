import { ManagedApiInternal } from "../apiManagement";
import { __ApiParamArgs } from "../apiManagement/InternalTypes";
import { ApiParamType } from "../apiManagement/ApiDefinition";
import { DependencyInitializationTime } from "../apiManagement/ApiDependency";
import { IParamDecoratorDefinition } from "../transformer/ParamDecoratorTransformer";

export const dependencyParamDecoratorKey = 'callbackParamDecorator';

export function DependencyParamDecorator(d: IParamDecoratorDefinition) {
	return (
		target: object,
		propertyKey: string,
		descriptor: TypedPropertyDescriptor<any>
	) => {
		descriptor.writable = false;
		descriptor.configurable = false;
		Reflect.defineMetadata(dependencyParamDecoratorKey, d, target, propertyKey);
	}
}

export function GetDependencyParamDecorator(param: string): IParamDecoratorDefinition {
	return <IParamDecoratorDefinition>Reflect.getMetadata(dependencyParamDecoratorKey, DependencyParams, param);
}

abstract class DependencyParams {
	public static readonly ConstructorKey = undefined;

	/**
	 * A dependency property
	 * @param validator 
	 */
	public static ApiInjectedDependency(scope?: string): PropertyDecorator;
	@DependencyParamDecorator({
		allowableTypes: ['any'],
		arguments: [
			{
				type: 'paramName',
				optional: true,
			}
		]
	})
	public static ApiInjectedDependency(a?: any): PropertyDecorator {
		const args = <__ApiParamArgs>a;
		return (target: Object, propertyKey: string) => {
			ManagedApiInternal.AddDependencyMetadataToObject(
				{
					propertyKey,
					dependency: args.typeref ? args.typeref : args.typedef,
					requirementTime: DependencyInitializationTime.OnUse,
				},
				target.constructor);
		}
	}

	public static ApiInjectedConstructor(): MethodDecorator;
	public static ApiInjectedConstructor(a?: any): MethodDecorator {
		return (target: Object, propertyKey: string) => {
		}
	}

	/**
	 * A dependency parameter
	 * @param validator 
	 */
	public static ApiInjectedDependencyParam(scope?: string): ParameterDecorator;
	@DependencyParamDecorator({
		allowableTypes: ['any'],
		arguments: [
			{
				type: 'paramName',
				optional: true,
			}
		]
	})
	public static ApiInjectedDependencyParam(a?: any): ParameterDecorator {
		const args = <__ApiParamArgs>a;
		return (target: Object, propertyKey: string, parameterIndex: number) => {
			if (propertyKey) {
				ManagedApiInternal.AddApiDependencyParamMetadataToObject(
					{
						parameterIndex,
						propertyKey,
						dependency: args.typeref ? args.typeref : args.typedef,
						requirementTime: propertyKey === DependencyParams.ConstructorKey
							? DependencyInitializationTime.OnConstruction
							: DependencyInitializationTime.OnUse,
					},
					target.constructor);
			} else {
				ManagedApiInternal.AddApiDependencyParamMetadataToObject(
					{
						parameterIndex,
						propertyKey,
						dependency: args.typeref ? args.typeref : args.typedef,
						requirementTime: propertyKey === DependencyParams.ConstructorKey
							? DependencyInitializationTime.OnConstruction
							: DependencyInitializationTime.OnUse,
					},
					target);
			}
		}
	}
}

export const ApiInjectedDependency = DependencyParams.ApiInjectedDependency;
export const ApiInjectedConstructor = DependencyParams.ApiInjectedConstructor;
export const ApiInjectedDependencyParam = DependencyParams.ApiInjectedDependencyParam;