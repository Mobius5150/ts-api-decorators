import { IApiTransportTypeParamDefinition, ApiMethod } from "ts-api-decorators/dist/apiManagement/ApiDefinition";
import { Context } from "@azure/functions";
import { IHandlerTreeNodeHandler } from "ts-api-decorators/dist/transformer/HandlerTree";

export interface IBinding {
	name: string;
	type: string;
	direction: 'in' | 'out' | 'inout' | undefined;
}

export interface IHttpTriggerBinding extends IBinding {
	type: 'httpTrigger';
	authLevel?: 'admin' | 'anonymous' | 'function';
	name: string;
	route: string;
	methods: string[];
}

export interface IHttpOutputBinding extends IBinding {
	type: 'http';
	direction: 'out';
	name: string;
}

export type Binding = IHttpTriggerBinding | IHttpOutputBinding;


export interface IBindingTrigger<T extends IBinding = IBinding> {
	triggerType: string;
	triggerMethod: string;
	getTriggerForRoutes(routes: IHandlerTreeNodeHandler[]): T[];
}

export interface IBindingParam<T extends IBinding = IBinding> {
	paramTypeId: string;
	getBindingForParam(param: IApiTransportTypeParamDefinition, route: IHandlerTreeNodeHandler): T | undefined;
}