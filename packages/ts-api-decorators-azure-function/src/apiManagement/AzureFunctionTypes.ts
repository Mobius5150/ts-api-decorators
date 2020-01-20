import { Context } from "@azure/functions";

export interface IAzureFunctionResponse {
	status: number;
	body: string | object;
	headers?: {
		[header: string]: string;
	};
	isJson?: boolean;
}

export interface IAzureFunctionsTimer {
	Schedule: {
		AdjustForDST: boolean;
	};
	ScheduleStatus: {
		Last: Date;
		LastUpdated: Date;
		Next: Date;
	};
	IsPastDue?: boolean;
}

export type AzureFunctionHandlerFunc = (context: Context, ...args: any) => Promise<IAzureFunctionResponse | void>;
