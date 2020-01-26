import { IApiTransportTypeParamDefinition } from "ts-api-decorators/dist/apiManagement/ApiDefinition";
import { IHandlerTreeNodeHandler } from "ts-api-decorators/dist/transformer/HandlerTree";
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

export interface ITimerTriggerBinding extends IBinding {
	type: AzFuncBinding.TimerTrigger;
	direction: 'in';
	name: 'timer';
	schedule: string;
	runOnStartup?: boolean;
	useMonitor?: boolean;
}

export type Binding =
	IHttpTriggerBinding
	| IHttpOutputBinding
	| ITimerTriggerBinding
;

export interface IBindingTrigger<T extends IBinding = IBinding> {
	triggerType: string;
	triggerMethod: string;
	getTriggerForRoutes(routes: IHandlerTreeNodeHandler[]): T[];
}

export interface IBindingParam<T extends IBinding = IBinding> {
	paramTypeId: string;
	getBindingForParam(param: IApiTransportTypeParamDefinition, route: IHandlerTreeNodeHandler): T | undefined;
}