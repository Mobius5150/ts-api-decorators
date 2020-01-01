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
	Header,
	Callback,
	Transport,
	Dependency,
}

export type ApiMethodReturnTypePrimitives = void | string | object;

export type ApiMethodReturnType = ApiMethodReturnTypePrimitives | Promise<ApiMethodReturnTypePrimitives>;

export type ApiMethodFunction = (...args: any[]) => ApiMethodReturnType;

export type PromiseRejectionTypes = undefined | null | string | Error;

export type ApiMethodCallbackFunction<T> = (err: PromiseRejectionTypes, result?: T) => void;

export interface IApiDefinitionBase {
	method: ApiMethod;
	route: string;
	handlerKey: string | symbol;
	returnType?: InternalTypeDefinition;
}

export interface IApiDefinition extends IApiDefinitionBase {
	handler: ApiMethodFunction;
}

interface IApiParamDefinitionBase {
	args: __ApiParamArgs;
	propertyKey: string | symbol;
	parameterIndex: number;
}

export interface IApiParamDefinitionCommon extends IApiParamDefinitionBase {
	type: ApiParamType.Body | ApiParamType.Query | ApiParamType.Path | ApiParamType.Header | ApiParamType.Callback | ApiParamType.Dependency;
}

export interface IApiTransportTypeParamDefinition extends IApiParamDefinitionBase {
	type: ApiParamType.Transport;
	transportTypeId: string;
}

export type IApiParamDefinition = IApiParamDefinitionCommon | IApiTransportTypeParamDefinition;