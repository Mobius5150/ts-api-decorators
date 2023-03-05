import 'reflect-metadata';
import { ManagedApiInternal } from "../apiManagement/ManagedApiInternal";
import { ApiMethod, ApiMethodFunction, ApiMethodCallbackFunction, IApiDefinition, ApiMethodReturnType } from "../apiManagement/ApiDefinition";
import { InternalTypeDefinition } from "../apiManagement/InternalTypes";
import { ApiMethodDecoratorGetFunction, ApiDecorator, DecoratorParentNameDependency } from "./DecoratorUtil";
import { HandlerMethodDecorator } from "../transformer/HandlerMethodDecorator";
import { BuiltinMetadata } from "../transformer/TransformerMetadata";
import { BuiltinArgumentExtractors } from "../transformer/BuiltinArgumentExtractors";
import { ClassDecorator } from "../transformer/ClassDecorator";
import { HandlerCollectionDecorator } from '../transformer/HandlerCollectionDecorator';
import { ClassConstructor } from '../Util/ClassConstructors';
import { DefaultApiResponseCode } from '../Constants';

export type ApiMethodDecoratorReturnType<T, K = (...args: any[]) => T> = (
	target: object,
	propertyKey: string,
	descriptor: TypedPropertyDescriptor<K>
) => void;

abstract class ApiClassDecorators {
	@ApiDecorator(HandlerCollectionDecorator, {
		indexTs: __filename,
		dependencies: [],
		provider: BuiltinMetadata.BuiltinComponent,
		arguments: [],
		isCallExpression: false,
	})
	public static Api<T extends ClassConstructor>(constructor: T) {
		ManagedApiInternal.RegisterApi(constructor);
	}
}

export const Api = ApiClassDecorators.Api;

abstract class ApiMethodDecorators {
	public static ApiGetMethod<T extends string>(route: string, responseCodes?: number[]): ApiMethodDecoratorReturnType<T | Promise<T>>;
	public static ApiGetMethod<T extends void, K extends (string | object)>(route: string, responseCodes?: number[]): ApiMethodDecoratorReturnType<T, (callback: ApiMethodCallbackFunction<K>, ...args: any[]) => T>;
	public static ApiGetMethod<T extends object>(route: string, responseCodes?: number[]): ApiMethodDecoratorReturnType<T | Promise<T>>;
	public static ApiGetMethod<T extends void>(route: string, responseCodes?: number[]): ApiMethodDecoratorReturnType<void | Promise<void>>;
	@ApiDecorator(HandlerMethodDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		provider: BuiltinMetadata.BuiltinComponent,
		arguments: [
			BuiltinArgumentExtractors.RouteArgument,
			BuiltinArgumentExtractors.ResponseCodesArgument,
			BuiltinArgumentExtractors.ReturnSchemaArgument,
		],
		metadata: [
			BuiltinMetadata.ApiMethodWithValue(ApiMethod.GET),
			BuiltinMetadata.ApiMethodTypeHttp,
		],
	})
	public static ApiGetMethod<T extends ApiMethodReturnType>(route: string, responseCodes?: number[], returnType?: InternalTypeDefinition): ApiMethodDecoratorReturnType<T> {
		return (
			target: object,
			propertyKey: string,
			descriptor: TypedPropertyDescriptor<(...args: any[]) => T>
		) => {
			ManagedApiInternal.AddApiMetadataToObject(
				ApiMethodDecorators.wrapApiMethod(ApiMethod.GET, route, propertyKey, descriptor, responseCodes, returnType),
				target.constructor);
		}
	}

	public static ApiPostMethod<T extends string>(route: string, responseCodes?: number[]): ApiMethodDecoratorReturnType<T | Promise<T>>;
	public static ApiPostMethod<T extends void, K extends (string | object)>(route: string, responseCodes?: number[]): ApiMethodDecoratorReturnType<T, (callback: ApiMethodCallbackFunction<K>, ...args: any[]) => T>;
	public static ApiPostMethod<T extends object>(route: string, responseCodes?: number[]): ApiMethodDecoratorReturnType<T | Promise<T>>;
	public static ApiPostMethod<T extends void>(route: string, responseCodes?: number[]): ApiMethodDecoratorReturnType<void | Promise<void>>;
	@ApiDecorator(HandlerMethodDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		provider: BuiltinMetadata.BuiltinComponent,
		arguments: [
			BuiltinArgumentExtractors.RouteArgument,
			BuiltinArgumentExtractors.ResponseCodesArgument,
			BuiltinArgumentExtractors.ReturnSchemaArgument,
		],
		metadata: [
			BuiltinMetadata.ApiMethodWithValue(ApiMethod.POST),
			BuiltinMetadata.ApiMethodTypeHttp,
		],
	})
	public static ApiPostMethod<T extends ApiMethodReturnType>(route: string, responseCodes?: number[], returnType?: InternalTypeDefinition) {
		return (
			target: object,
			propertyKey: string,
			descriptor: TypedPropertyDescriptor<(...args: any[]) => T>
		) => {
			ManagedApiInternal.AddApiMetadataToObject(
				ApiMethodDecorators.wrapApiMethod(ApiMethod.POST, route, propertyKey, descriptor, responseCodes, returnType),
				target.constructor);
		}
	}

	public static ApiPutMethod<T extends string>(route: string, responseCodes?: number[]): ApiMethodDecoratorReturnType<T | Promise<T>>;
	public static ApiPutMethod<T extends void, K extends (string | object)>(route: string, responseCodes?: number[]): ApiMethodDecoratorReturnType<T, (callback: ApiMethodCallbackFunction<K>, ...args: any[]) => T>;
	public static ApiPutMethod<T extends object>(route: string, responseCodes?: number[]): ApiMethodDecoratorReturnType<T | Promise<T>>;
	public static ApiPutMethod<T extends void>(route: string, responseCodes?: number[]): ApiMethodDecoratorReturnType<void | Promise<void>>;
	@ApiDecorator(HandlerMethodDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		provider: BuiltinMetadata.BuiltinComponent,
		arguments: [
			BuiltinArgumentExtractors.RouteArgument,
			BuiltinArgumentExtractors.ResponseCodesArgument,
			BuiltinArgumentExtractors.ReturnSchemaArgument,
		],
		metadata: [
			BuiltinMetadata.ApiMethodWithValue(ApiMethod.PUT),
			BuiltinMetadata.ApiMethodTypeHttp,
		],
	})
	public static ApiPutMethod<T extends ApiMethodReturnType>(route: string, responseCodes?: number[], returnType?: InternalTypeDefinition) {
		return (
			target: object,
			propertyKey: string,
			descriptor: TypedPropertyDescriptor<(...args: any[]) => T>
		) => {
			ManagedApiInternal.AddApiMetadataToObject(
				ApiMethodDecorators.wrapApiMethod(ApiMethod.PUT, route, propertyKey, descriptor, responseCodes, returnType),
				target.constructor);
		}
	}

	public static ApiDeleteMethod<T extends string>(route: string, responseCodes?: number[]): ApiMethodDecoratorReturnType<T | Promise<T>>;
	public static ApiDeleteMethod<T extends void, K extends (string | object)>(route: string, responseCodes?: number[]): ApiMethodDecoratorReturnType<T, (callback: ApiMethodCallbackFunction<K>, ...args: any[]) => T>;
	public static ApiDeleteMethod<T extends object>(route: string, responseCodes?: number[]): ApiMethodDecoratorReturnType<T | Promise<T>>;
	public static ApiDeleteMethod<T extends void>(route: string, responseCodes?: number[]): ApiMethodDecoratorReturnType<void | Promise<void>>;
	@ApiDecorator(HandlerMethodDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		provider: BuiltinMetadata.BuiltinComponent,
		arguments: [
			BuiltinArgumentExtractors.RouteArgument,
			BuiltinArgumentExtractors.ResponseCodesArgument,
			BuiltinArgumentExtractors.ReturnSchemaArgument,
		],
		metadata: [
			BuiltinMetadata.ApiMethodWithValue(ApiMethod.DELETE),
			BuiltinMetadata.ApiMethodTypeHttp,
		],
	})
	public static ApiDeleteMethod<T extends ApiMethodReturnType>(route: string, responseCodes?: number[], returnType?: InternalTypeDefinition) {
		return (
			target: object,
			propertyKey: string,
			descriptor: TypedPropertyDescriptor<(...args: any[]) => T>
		) => {
			ManagedApiInternal.AddApiMetadataToObject(
				ApiMethodDecorators.wrapApiMethod(ApiMethod.DELETE, route, propertyKey, descriptor, responseCodes, returnType),
				target.constructor);
		}
	}

	private static wrapApiMethod<T extends ApiMethodFunction>(method: ApiMethod, route: string, handlerKey: string | symbol, descriptor: TypedPropertyDescriptor<T>, responseCodes?: number[], returnType?: InternalTypeDefinition): IApiDefinition {
		return {
			method,
			route,
			handlerKey,
			handler: descriptor.value,
			returnType,
			responseCodes: this.toResponseCodesArray(responseCodes),
		}
	}

	private static toResponseCodesArray(responseCodes?: number[]): number[] {
		if (typeof responseCodes === 'number') {
			return [responseCodes];
		}

		if (!responseCodes || !Array.isArray(responseCodes) || responseCodes.length === 0) {
			return [ DefaultApiResponseCode ];
		}

		return responseCodes;
	}
}

export const GetApiDecorator = ApiMethodDecoratorGetFunction<ClassDecorator>(ApiClassDecorators);
export const GetApiMethodDecorator = ApiMethodDecoratorGetFunction<HandlerMethodDecorator>(ApiMethodDecorators);

export const ApiGetMethod = ApiMethodDecorators.ApiGetMethod;
export const ApiPutMethod = ApiMethodDecorators.ApiPutMethod;
export const ApiPostMethod = ApiMethodDecorators.ApiPostMethod;
export const ApiDeleteMethod = ApiMethodDecorators.ApiDeleteMethod;