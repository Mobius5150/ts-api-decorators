import { IApiTransportTypeParamDefinition } from "ts-api-decorators/dist/apiManagement/ApiDefinition";
import { IHandlerTreeNodeHandler, IHandlerTreeNodeHandlerModifier } from "ts-api-decorators/dist/transformer/HandlerTree";
import { AzFuncBinding } from "../../metadata/AzFuncBindings";

export interface IBinding {
	name: string;
	type: string;
	direction: 'in' | 'out' | 'inout' | undefined;
}

export interface IHttpTriggerBinding extends IBinding {
	type: AzFuncBinding.HttpTrigger;
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

export interface IBindingTrigger<T extends IBinding = IBinding> {
	triggerType: string;
	triggerMethod: string;
	getBindingForRoutes(routes: IHandlerTreeNodeHandler[]): T[];
}

export interface IBindingParam<T extends IBinding = IBinding> {
	paramTypeId: string;
	getBindingForParam?: (param: IApiTransportTypeParamDefinition, route: IHandlerTreeNodeHandler) => T[] | undefined;
}

export interface IBindingOutput<T extends IBinding = IBinding> {
	outputTypeId: string;
	getBindingForOutput?: (output: IHandlerTreeNodeHandlerModifier, route: IHandlerTreeNodeHandler) => T[] | undefined;
}