import { IBinding } from "../../../generators/Bindings/Bindings";
import { AzFuncBinding } from "../../../metadata/AzFuncBindings";

export interface ITimerTriggerBinding extends IBinding {
	type: AzFuncBinding.TimerTrigger;
	direction: 'in';
	name: 'timer';
	schedule: string;
	runOnStartup?: boolean;
	useMonitor?: boolean;
}