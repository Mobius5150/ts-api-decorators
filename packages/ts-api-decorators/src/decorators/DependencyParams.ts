import { ManagedApiInternal } from "../apiManagement";
import { __ApiParamArgs } from "../apiManagement/InternalTypes";
import { ApiParamType } from "../apiManagement/ApiDefinition";
import { DependencyInitializationTime } from "../apiManagement/ApiDependency";
import { ApiDecorator, ApiMethodDecoratorGetFunction } from "./DecoratorUtil";
import { BuiltinMetadata } from "../transformer/TransformerMetadata";
import { HandlerMethodParameterDecorator } from "../transformer/HandlerMethodParameterDecorator";
import { BuiltinArgumentExtractors } from "../transformer/BuiltinArgumentExtractors";
import { ClassPropertyDecorator } from "../transformer/ClassPropertyDecorator";
import { DependencyClassDecorator } from "../transformer/DependencyClassDecorator";
import { ClassConstructor } from "../Util/ClassConstructors";

abstract class DependencyParams {
	public static readonly ConstructorKey = undefined;
	static ApiCallbackParam: any;

	@ApiDecorator(DependencyClassDecorator, {
		indexTs: __filename,
		dependencies: [],
		provider: BuiltinMetadata.BuiltinComponent,
		arguments: [],
	})
	public static ApiDependency<T extends ClassConstructor>(constructor: T) {
		ManagedApiInternal.RegisterApi(constructor);
	}

	/**
	 * A dependency property
	 * @param validator 
	 */
	public static ApiInjectedDependency(scope?: string): PropertyDecorator;
	@ApiDecorator(ClassPropertyDecorator, {
		indexTs: __filename,
		dependencies: [],
		provider: BuiltinMetadata.BuiltinComponent,
		transformArgumentsToObject: true,
		arguments: [
			BuiltinArgumentExtractors.DependencyScopeArgument,
		],
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

	/**
	 * A dependency parameter
	 * @param validator 
	 */
	public static ApiInjectedDependencyParam(scope?: string): ParameterDecorator;
	@ApiDecorator(HandlerMethodParameterDecorator, {
		indexTs: __filename,
		dependencies: [],
		parameterType: ApiParamType.Dependency,
		provider: BuiltinMetadata.BuiltinComponent,
		transformArgumentsToObject: true,
		arguments: [
			BuiltinArgumentExtractors.DependencyScopeArgument,
		],
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

				ManagedApiInternal.AddApiHandlerParamMetadataToObject(
					{
						args,
						parameterIndex,
						propertyKey,
						type: ApiParamType.Dependency,
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

export const GetDependencyParamDecorator = ApiMethodDecoratorGetFunction(DependencyParams);

export const ApiDependency = DependencyParams.ApiDependency;
export const ApiInjectedDependency = DependencyParams.ApiInjectedDependency;
export const ApiInjectedDependencyParam = DependencyParams.ApiInjectedDependencyParam;