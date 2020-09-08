import { __ApiParamArgs, InternalTypeDefinition } from "./InternalTypes";
import { ApiProcessorTime, IApiPreProcessor, IApiPostProcessor } from "./ApiProcessing/ApiProcessing";
import { IMetadataDescriptor } from "../transformer/TransformerMetadata";

export const enum ApiMethod {
	GET = 'GET',
	POST = 'POST',
	PUT = 'PUT',
	DELETE = 'DELETE',
	// TODO: Other methods
}

export const enum ApiParamType {
	Body,
	RawBody,
	Query,
	Path,
	Header,
	Callback,
	Transport,
	Dependency,
	Out,
	Custom,
}

export const enum ApiRawBodyParamType {
	Stream,
	String,
}

export type ApiMethodReturnTypePrimitives = void | string | object;

export type ApiMethodReturnType = ApiMethodReturnTypePrimitives | Promise<ApiMethodReturnTypePrimitives>;

export type ApiMethodFunction = (...args: any[]) => ApiMethodReturnType;

export type PromiseRejectionTypes = undefined | null | string | Error;

export type ApiMethodCallbackFunction<T> = (err: PromiseRejectionTypes, result?: T) => void;

export interface IApiProcessors<T extends object> {
	[ApiProcessorTime.StagePreInvoke]: IApiPreProcessor<T>[];
	[ApiProcessorTime.StagePostInvoke]: IApiPostProcessor[];
}

export interface IApiHandlerIdentifier {
	method: ApiMethod;
	route: string;
}

export interface IApiDefinitionBase extends IApiHandlerIdentifier {
	handlerKey: string | symbol;
	returnType?: InternalTypeDefinition;
}

export interface IApiDefinition extends IApiDefinitionBase {
	handler: ApiMethodFunction;
}

export interface IApiDefinitionWithProcessors<TransportType extends object> extends IApiDefinition {
	processors: IApiProcessors<TransportType>;
}

interface IApiParamDefinitionBase {
	args: __ApiParamArgs;
	propertyKey: string | symbol;
	parameterIndex: number;
}

export interface IApiParamDefinitionCommon extends IApiParamDefinitionBase {
	type: ApiParamType.Body | ApiParamType.Query | ApiParamType.Path | ApiParamType.Header | ApiParamType.Callback | ApiParamType.Dependency;
}

export interface IApiRawBodyParamDefinition extends IApiParamDefinitionBase {
	type: ApiParamType.RawBody;
	bodyType: ApiRawBodyParamType;
	mimeType?: string;
}

export interface IApiTransportTypeParamDefinition extends IApiParamDefinitionBase {
	type: ApiParamType.Transport;
	transportTypeId: string;
}

export interface IApiOutTypeParamDefinition extends IApiParamDefinitionBase {
	type: ApiParamType.Out;
	overrideOutput: boolean;
}

export interface IApiCustomTypeParamDefinition extends IApiParamDefinitionBase {
	type: ApiParamType.Custom;
	paramId: string;
}

export type IApiParamDefinition = IApiParamDefinitionCommon | IApiTransportTypeParamDefinition | IApiCustomTypeParamDefinition | IApiRawBodyParamDefinition | IApiOutTypeParamDefinition;

export interface IApiModifierDefinition<T = object> {
	propertyKey: string | symbol;
	metadata: IMetadataDescriptor;
	arguments: T;
}