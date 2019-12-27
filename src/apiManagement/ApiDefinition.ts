import { __ApiParamArgs, InternalTypeDefinition } from "./InternalTypes";

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
	Path,
}

export type ApiMethodReturnTypePrimitives = void | string | object;

export type ApiMethodReturnType = ApiMethodReturnTypePrimitives | Promise<ApiMethodReturnTypePrimitives>;

export type ApiMethodFunction = (...args: any[]) => ApiMethodReturnType;

export type ApiMethodCallbackFunction<T> = (err: any, result: T) => void;

export interface IApiDefinitionBase {
	method: ApiMethod;
	route: string;
	handlerKey: string | symbol;
	returnType?: InternalTypeDefinition;
}

export interface IApiDefinition extends IApiDefinitionBase {
	handler: ApiMethodFunction;
}

export interface IApiParamDefinition {
	args: __ApiParamArgs;
	propertyKey: string | symbol;
	parameterIndex: number;
	type: ApiParamType;
}