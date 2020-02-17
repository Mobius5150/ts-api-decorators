import { OptionalAsyncFunc1 } from "../../Util/Func";
import { IApiInvocationParams, IApiInvocationResult } from "../ManagedApi";

export enum ApiProcessorTime {
	StagePreInvoke = 'preinvoke',
	StagePostInvoke = 'postinvoke',
}

export enum ApiProcessorScope {
	ScopeGlobal = 'global',
	ScopeClass = 'class',
}

export interface IApiProcessor<ProcessorParam extends object> {
	stage: ApiProcessorTime;
	processor: OptionalAsyncFunc1<ProcessorParam, ProcessorParam>;
}

export interface IApiPreProcessor<T extends object = {}> extends IApiProcessor<IApiInvocationParams<T>> {
	stage: ApiProcessorTime.StagePreInvoke;
}

export interface IApiPostProcessor extends IApiProcessor<IApiInvocationResult> {
	stage: ApiProcessorTime.StagePostInvoke;
}

export interface IApiGlobalProcessor {
	stage: ApiProcessorTime;
	scope: ApiProcessorScope;
	handler: (IApiPreProcessor | IApiPostProcessor)['processor'];
	handlerKey: string | symbol;
}