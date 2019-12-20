import { __ApiParamArgs } from "./InternalTypes";

export const enum ApiMethod {
	GET = 'GET',
	POST = 'POST',
	PUT = 'PUT',
	DELETE = 'DELETE',
	// TODO: Other methods
}

export const enum ApiParamType {
	Body,
	Query,
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
	args: __ApiParamArgs;
	propertyKey: string | symbol;
	parameterIndex: number;
	type: ApiParamType;
}