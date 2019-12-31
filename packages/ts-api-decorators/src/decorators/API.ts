import { ManagedApiInternal } from "../apiManagement/ManagedApiInternal";
import { ApiMethod, ApiMethodFunction, ApiMethodCallbackFunction, IApiDefinition, ApiMethodReturnType } from "../apiManagement/ApiDefinition";
import 'reflect-metadata';
import { InternalTypeDefinition } from "../apiManagement/InternalTypes";
import { IDecorationFunctionTransformInfoBase } from "../transformer/DecoratorTransformer";

const apiMethodDecoratorKey = 'bodyParamDecorator';

export type ClassConstructor<C = {}> = { new(...args: any[]): C };
export type ClassConstructor0<C = {}> = { new(): C };
export type ClassConstructor1<T1, C = {}> = { new(a1: T1): C };
export type ClassConstructor2<T1, T2, C = {}> = { new(a1: T1, a2: T2): C };
export type ClassConstructor3<T1, T2, T3, C = {}> = { new(a1: T1, a2: T2, a3: T3): C };
export type ClassConstructor4<T1, T2, T3, T4, C = {}> = { new(a1: T1, a2: T2, a3: T3, a4: T4): C };
export type ClassConstructor5<T1, T2, T3, T4, T5, C = {}> = { new(a1: T1, a2: T2, a3: T3, a4: T4, a5: T5): C };
export type ClassConstructor6<T1, T2, T3, T4, T5, T6, C = {}> = { new(a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6): C };
export type ClassConstructor7<T1, T2, T3, T4, T5, T6, T7, C = {}> = { new(a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7): C };
export type ClassConstructor8<T1, T2, T3, T4, T5, T6, T7, T8, C = {}> = { new(a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7, a8: T8): C };
export type ClassConstructor9<T1, T2, T3, T4, T5, T6, T7, T8, T9, C = {}> = { new(a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, a7: T7, a8: T8, a9: T9): C };

export type ApiGetMethodReturnType<T, K = (...args: any[]) => T> = (
	target: object,
	propertyKey: string,
	descriptor: TypedPropertyDescriptor<K>
) => void;

interface IApiMethodDecoratorDefinitionBase {
	apiDecoratorMethod: ApiMethod;
	arguments: IApiMethodDecoratorFunctionArg[];
}

export interface IApiMethodDecoratorDefinition extends IApiMethodDecoratorDefinitionBase, IDecorationFunctionTransformInfoBase {
}

export interface IApiMethodDecoratorFunctionArg {
	type: 'route' | 'returnSchema';
	optional?: boolean;
	transformedParameter?: boolean;
}

function ApiMethodDecorator(d: IApiMethodDecoratorDefinitionBase) {
	return (
		target: object,
		propertyKey: string,
		descriptor: TypedPropertyDescriptor<any>
	) => {
		descriptor.writable = false;
		descriptor.configurable = false;
		Reflect.defineMetadata(apiMethodDecoratorKey, <IApiMethodDecoratorDefinition>{
			...d,
			magicFunctionName: propertyKey,
		}, target, propertyKey);
	}
}

export function GetApiMethodDecorator(param: string): IApiMethodDecoratorDefinition {
	return <IApiMethodDecoratorDefinition>Reflect.getMetadata(apiMethodDecoratorKey, ApiMethodDecorators, param);
}

export function Api<T extends ClassConstructor>(constructor: T) {
	ManagedApiInternal.RegisterApi(constructor);
}

abstract class ApiMethodDecorators {
	public static ApiGetMethod<T extends string>(route: string): ApiGetMethodReturnType<T>;
	public static ApiGetMethod<T extends void, K extends (string | object)>(route: string): ApiGetMethodReturnType<T, (callback: ApiMethodCallbackFunction<K>, ...args: any[]) => T>;
	public static ApiGetMethod<T extends object>(route: string): ApiGetMethodReturnType<T>;
	public static ApiGetMethod<T extends Promise<string>>(route: string): ApiGetMethodReturnType<T>;
	public static ApiGetMethod<T extends Promise<object>>(route: string): ApiGetMethodReturnType<T>;
	@ApiMethodDecorator({
		apiDecoratorMethod: ApiMethod.GET,
		arguments: [
			{
				type: 'route',
			},
			{
				type: 'returnSchema',
				optional: true,
				transformedParameter: true,
			},
		]
	})
	public static ApiGetMethod<T extends ApiMethodReturnType>(route: string, returnType?: InternalTypeDefinition): ApiGetMethodReturnType<T> {
		return (
			target: object,
			propertyKey: string,
			descriptor: TypedPropertyDescriptor<(...args: any[]) => T>
		) => {
			ManagedApiInternal.AddApiMetadataToObject(
				ApiMethodDecorators.wrapApiMethod(ApiMethod.GET, route, propertyKey, descriptor, returnType),
				target.constructor);
		}
	}

	public static ApiPostMethod<T extends string>(route: string): ApiGetMethodReturnType<T>;
	public static ApiPostMethod<T extends void, K extends (string | object)>(route: string): ApiGetMethodReturnType<T, (callback: ApiMethodCallbackFunction<K>, ...args: any[]) => T>;
	public static ApiPostMethod<T extends object>(route: string): ApiGetMethodReturnType<T>;
	public static ApiPostMethod<T extends Promise<string>>(route: string): ApiGetMethodReturnType<T>;
	public static ApiPostMethod<T extends Promise<object>>(route: string): ApiGetMethodReturnType<T>;
	@ApiMethodDecorator({
		apiDecoratorMethod: ApiMethod.POST,
		arguments: [
			{
				type: 'route',
			},
			{
				type: 'returnSchema',
				optional: true,
				transformedParameter: true,
			},
		]
	})
	public static ApiPostMethod<T extends ApiMethodReturnType>(route: string, returnType?: InternalTypeDefinition) {
		return (
			target: object,
			propertyKey: string,
			descriptor: TypedPropertyDescriptor<(...args: any[]) => T>
		) => {
			ManagedApiInternal.AddApiMetadataToObject(
				ApiMethodDecorators.wrapApiMethod(ApiMethod.POST, route, propertyKey, descriptor, returnType),
				target.constructor);
		}
	}

	public static ApiPutMethod<T extends string>(route: string): ApiGetMethodReturnType<T>;
	public static ApiPutMethod<T extends void, K extends (string | object)>(route: string): ApiGetMethodReturnType<T, (callback: ApiMethodCallbackFunction<K>, ...args: any[]) => T>;
	public static ApiPutMethod<T extends object>(route: string): ApiGetMethodReturnType<T>;
	public static ApiPutMethod<T extends Promise<string>>(route: string): ApiGetMethodReturnType<T>;
	public static ApiPutMethod<T extends Promise<object>>(route: string): ApiGetMethodReturnType<T>;
	@ApiMethodDecorator({
		apiDecoratorMethod: ApiMethod.PUT,
		arguments: [
			{
				type: 'route',
			},
			{
				type: 'returnSchema',
				optional: true,
				transformedParameter: true,
			},
		]
	})
	public static ApiPutMethod<T extends ApiMethodReturnType>(route: string, returnType?: InternalTypeDefinition) {
		return (
			target: object,
			propertyKey: string,
			descriptor: TypedPropertyDescriptor<(...args: any[]) => T>
		) => {
			ManagedApiInternal.AddApiMetadataToObject(
				ApiMethodDecorators.wrapApiMethod(ApiMethod.PUT, route, propertyKey, descriptor, returnType),
				target.constructor);
		}
	}

	public static ApiDeleteMethod<T extends string>(route: string): ApiGetMethodReturnType<T>;
	public static ApiDeleteMethod<T extends void, K extends (string | object)>(route: string): ApiGetMethodReturnType<T, (callback: ApiMethodCallbackFunction<K>, ...args: any[]) => T>;
	public static ApiDeleteMethod<T extends object>(route: string): ApiGetMethodReturnType<T>;
	public static ApiDeleteMethod<T extends Promise<string>>(route: string): ApiGetMethodReturnType<T>;
	public static ApiDeleteMethod<T extends Promise<object>>(route: string): ApiGetMethodReturnType<T>;
	@ApiMethodDecorator({
		apiDecoratorMethod: ApiMethod.DELETE,
		arguments: [
			{
				type: 'route',
			},
			{
				type: 'returnSchema',
				optional: true,
				transformedParameter: true,
			},
		]
	})
	public static ApiDeleteMethod<T extends ApiMethodReturnType>(route: string, returnType?: InternalTypeDefinition) {
		return (
			target: object,
			propertyKey: string,
			descriptor: TypedPropertyDescriptor<(...args: any[]) => T>
		) => {
			ManagedApiInternal.AddApiMetadataToObject(
				ApiMethodDecorators.wrapApiMethod(ApiMethod.DELETE, route, propertyKey, descriptor, returnType),
				target.constructor);
		}
	}

	private static wrapApiMethod<T extends ApiMethodFunction>(method: ApiMethod, route: string, handlerKey: string | symbol, descriptor: TypedPropertyDescriptor<T>, returnType?: InternalTypeDefinition): IApiDefinition {
		return {
			method,
			route,
			handlerKey,
			handler: descriptor.value,
			returnType,
		}
	}
}

export const ApiGetMethod = ApiMethodDecorators.ApiGetMethod;
export const ApiPutMethod = ApiMethodDecorators.ApiPutMethod;
export const ApiPostMethod = ApiMethodDecorators.ApiPostMethod;
export const ApiDeleteMethod = ApiMethodDecorators.ApiDeleteMethod;