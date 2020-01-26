import { ManagedApiInternal, Api, ApiMethodDecoratorReturnType } from "ts-api-decorators";
import { ApiParamType, ApiMethodReturnType } from "ts-api-decorators/dist/apiManagement/ApiDefinition";
import { __ApiParamArgs, InternalTypeUtil } from "ts-api-decorators/dist/apiManagement/InternalTypes";
import { ApiDecorator, DecoratorParentNameDependency, ApiMethodDecoratorGetFunction } from "ts-api-decorators/dist/decorators/DecoratorUtil";
import { HandlerMethodParameterDecorator } from "ts-api-decorators/dist/transformer/HandlerMethodParameterDecorator";
import { HandlerMethodDecorator } from "ts-api-decorators/dist/transformer/HandlerMethodDecorator";
import { AzFuncMetadata } from "../../../metadata/AzFuncMetadata";
import { AzFuncBinding } from "../../../metadata/AzFuncBindings";
import { TimerArgumentExtractors } from "./ArgumentExtractors";
import { BuiltinMetadata } from "ts-api-decorators/dist/transformer/TransformerMetadata";

abstract class TimerTriggerMethodDecorators {
	public static AzFuncTimerTrigger<T extends ApiMethodReturnType>(schedule: string, runOnStartup?: boolean, useMonitor?: boolean): ApiMethodDecoratorReturnType<T>;
	@ApiDecorator(HandlerMethodDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		provider: AzFuncMetadata.Component,
		arguments: [
			TimerArgumentExtractors.ScheduleArgument,
			TimerArgumentExtractors.RunOnStartupArgument,
			TimerArgumentExtractors.UseMonitorArgument,
		],
		metadata: [
			{
				...BuiltinMetadata.Route,
				value: AzFuncBinding.TimerTrigger,
			},
			...AzFuncMetadata.ApiMethodMetadataForBinding(AzFuncBinding.TimerTrigger),
		],
	})
	public static AzFuncTimerTrigger<T extends ApiMethodReturnType>(): ApiMethodDecoratorReturnType<T> {
		return (
			target: object,
			propertyKey: string,
			descriptor: TypedPropertyDescriptor<(...args: any[]) => T>
		) => {
			ManagedApiInternal.AddApiMetadataToObject(
				{
					method: <any>AzFuncBinding.TimerTrigger,
					route: AzFuncBinding.TimerTrigger,
					handlerKey: propertyKey,
					handler: descriptor.value,
				},
				target.constructor);
		}
	}
}

abstract class TimerTriggerParams {
	public static readonly TransportTypeTimerParam = 'timer';

	public static AzFuncTimerParam(): ParameterDecorator;
	@ApiDecorator(HandlerMethodParameterDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(TimerTriggerMethodDecorators.AzFuncTimerTrigger.name) ],
		parameterType: ApiParamType.Transport,
		parameterTypeRestrictions: [
			InternalTypeUtil.TypeAnyObject,
		],
		provider: AzFuncMetadata.Component,
		arguments: [],
		transportTypeId: TimerTriggerParams.TransportTypeTimerParam,
	})
	public static AzFuncTimerParam(a?: any): ParameterDecorator {
		return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
			const args = <__ApiParamArgs>a;
			ManagedApiInternal.AddApiHandlerParamMetadataToObject(
				{
					args,
					parameterIndex,
					propertyKey,
					type: ApiParamType.Transport,
					transportTypeId: TimerTriggerParams.TransportTypeTimerParam,
				},
				target.constructor);
		}
	}
}

export const AzFuncTimerMethodDecorator = ApiMethodDecoratorGetFunction<HandlerMethodDecorator>(TimerTriggerMethodDecorators);
export const AzFuncTimerParamDecorator = ApiMethodDecoratorGetFunction<HandlerMethodParameterDecorator>(TimerTriggerParams);

export const AzFuncTimerTrigger = TimerTriggerMethodDecorators.AzFuncTimerTrigger;
export const AzFuncTimerParam = TimerTriggerParams.AzFuncTimerParam;