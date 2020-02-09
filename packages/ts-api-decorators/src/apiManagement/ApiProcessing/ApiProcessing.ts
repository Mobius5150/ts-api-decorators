import { OptionalAsyncFunc1 } from "../../Util/Func";
import { IApiInvocationParams, IApiInvocationResult } from "../ManagedApi";

export enum ApiProcessorTime {
	StagePreInvoke = 'preinvoke',
	StagePostInvoke = 'postinvoke',
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