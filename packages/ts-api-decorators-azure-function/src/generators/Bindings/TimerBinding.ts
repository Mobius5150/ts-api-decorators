import { IBindingTrigger, IBindingParam } from "./Bindings";
import { ApiMethod, IApiInvocationParams } from "ts-api-decorators";
import { IAzureFunctionManagedApiContext } from "../..";
import { Context } from "@azure/functions";
import { AzFuncBinding } from "../../metadata/AzFuncBindings";
import { IHandlerTreeNodeHandler } from "ts-api-decorators/dist/transformer/HandlerTree";
import { getMetadataValueByDescriptor } from "ts-api-decorators/dist/transformer/TransformerMetadata";
import { AzFuncMetadata } from "../../metadata/AzFuncMetadata";
import { ITimerTriggerBinding } from "../../decorators/ExtensionDecorators/TimerTrigger/TimerTriggerBinding";

export class TimerBindingTriggerFactory {
	public static GetBinding(): IBindingTrigger {
		return {
			triggerMethod: AzFuncBinding.TimerTrigger,
			triggerType: AzFuncBinding.TimerTrigger,
			getBindingForRoutes: routes => ([
				<ITimerTriggerBinding>{
					type: AzFuncBinding.TimerTrigger,
					direction: 'in',
					name: 'timer',
					...TimerBindingTriggerFactory.getTriggerParamsForRoutes(routes),
				},
			])
		};
	}

	public static GetParamBinding(): IBindingParam {
		return {
			paramTypeId: 'timer',
		}
	}

	private static getTriggerParamsForRoutes(routes: IHandlerTreeNodeHandler[]): {schedule: string; runOnStartup?: boolean; useMonitor?: boolean;} {
		let schedule: string;
		let runOnStartup: boolean;
		let useMonitor: boolean;
		for (const route of routes) {
			const s = getMetadataValueByDescriptor(route.metadata, AzFuncMetadata.TimerSchedule);
			if (s) {
				if (schedule) {
					throw new Error('Can only declare one schedule per timer');
				}

				schedule = s;
			}

			const r = getMetadataValueByDescriptor(route.metadata, AzFuncMetadata.TimerRunOnStartup);
			if (typeof r !== 'undefined') {
				if (typeof runOnStartup !== 'undefined') {
					throw new Error('Can only declare value for runOnStartup per timer');
				}

				runOnStartup = r;
			}

			const u = getMetadataValueByDescriptor(route.metadata, AzFuncMetadata.TimerUseMonitor);
			if (typeof u !== 'undefined') {
				if (typeof useMonitor !== 'undefined') {
					throw new Error('Can only declare value for useMonitor per timer');
				}

				useMonitor = u;
			}
		}

		const result: Partial<ITimerTriggerBinding> & { schedule: string } = {
			schedule,
		};

		if (typeof runOnStartup !== 'undefined') {
			result.runOnStartup = runOnStartup;
		}

		if (typeof useMonitor !== 'undefined') {
			result.useMonitor = useMonitor;
		}

		return result;
	}

	public static GetInvocationParams(context: Context): { method: ApiMethod, invocationParams: IApiInvocationParams<IAzureFunctionManagedApiContext> } {
		if (!context.bindings.timer) {
			throw new Error('Context does not have http req');
		}

		return {
			method: <any>AzFuncBinding.TimerTrigger,
			invocationParams: {
				queryParams: {},
				pathParams: {},
				headers: {},
				transportParams: {
					context,
					timer: context.bindings.timer,
				},
			}
		};
	}
}