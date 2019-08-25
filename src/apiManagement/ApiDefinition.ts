import { __ApiQueryParamArgs } from "../decorators/QueryParams";

export const enum ApiMethod {
	GET = 'GET',
	POST = 'POST',
	PUT = 'PUT',
	DELETE = 'DELETE',
	// TODO: Other methods
}

export type ApiMethodReturnTypePrimitives = void | string | object;

export type ApiMethodReturnType = ApiMethodReturnTypePrimitives | Promise<ApiMethodReturnTypePrimitives>;

export type ApiMethodFunction = (...args: any[]) => ApiMethodReturnType;

export type ApiMethodCallbackFunction<T> = (err: any, result: T) => void;

export interface IApiDefinition {
	method: ApiMethod;
	route: string;
	handler: ApiMethodFunction;
	handlerKey: string | symbol;
}

export interface IApiParamDefinition {
	args: __ApiQueryParamArgs;
	propertyKey: string | symbol;
	parameterIndex: number;
}