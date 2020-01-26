import { AzFuncBinding } from "./AzFuncBindings";

export interface IAzureFunctionExtensionInformation {
	id: string;
	version: string;
}

export interface IAzureFunctionExtensionDefinition extends IAzureFunctionExtensionInformation {
	name?: string;
	bindings?: AzFuncBinding[];
}

export abstract class AzFuncExtension {
	public static GetExtensionForId(idStr: string): IAzureFunctionExtensionDefinition | undefined {
		const extension = AzFuncExtension._Extensions.find(s => s.id === idStr);
		if (!extension) {
			throw new Error(`No extension with id: '${idStr}'`);
		}

		return extension;
	}

	public static GetExtensionForBinding(binding: AzFuncBinding): IAzureFunctionExtensionDefinition | undefined {
		const extension = AzFuncExtension._Extensions.find(s => s.bindings && !!s.bindings.find(b => b === binding));
		if (!extension) {
			if (AzFuncExtension._BuiltinBindings.find(b => b === binding)) {
				return undefined;
			}

			throw new Error(`No binding with id: '${binding}'`);
		}

		return extension;
	}

	public static IsTriggerTypeBinding(binding: AzFuncBinding): boolean {
		return !!AzFuncExtension._TriggerBindings.find(b => b === binding);
	}

	public static readonly ExtensionBundle: IAzureFunctionExtensionDefinition = {
		"id": "Microsoft.Azure.Functions.ExtensionBundle",
        "version": "1.0",
	};

	public static readonly AzureStorage: IAzureFunctionExtensionDefinition = {
		"id": "Microsoft.Azure.WebJobs.Extensions.Storage",
        "version": "3.0.10",
        "name": "AzureStorage",
        "bindings": [
			AzFuncBinding.BlobTrigger,
			AzFuncBinding.Queue,
			AzFuncBinding.QueueTrigger,
			AzFuncBinding.Table,
        ]
	};

	public static readonly ServiceBus: IAzureFunctionExtensionDefinition = {
		"id": "Microsoft.Azure.WebJobs.Extensions.ServiceBus",
        "version": "3.2.0",
        "name": "ServiceBus",
        "bindings": [
			AzFuncBinding.ServiceBusTrigger,
			AzFuncBinding.ServiceBus,
        ]
	};

	public static readonly EventHubs: IAzureFunctionExtensionDefinition = {
		"id": "Microsoft.Azure.WebJobs.Extensions.EventHubs",
        "version": "3.0.6",
        "name": "EventHubs",
        "bindings": [
			AzFuncBinding.EventHubTrigger,
			AzFuncBinding.EventHub,
        ]
	};

	public static readonly SendGrid: IAzureFunctionExtensionDefinition = {
		"id": "Microsoft.Azure.WebJobs.Extensions.SendGrid",
        "version": "3.0.0",
        "name": "SendGrid",
        "bindings": [
            AzFuncBinding.SendGrid,
        ]
	};

	public static readonly DurableTask: IAzureFunctionExtensionDefinition = {
		"id": "Microsoft.Azure.WebJobs.Extensions.DurableTask",
        "version": "1.8.3",
        "name": "DurableTask",
        "bindings": [
			AzFuncBinding.ActivityTrigger,
			AzFuncBinding.OrchestionTrigger,
			AzFuncBinding.OrchestrationClient,
        ]
	};

	public static readonly EventGrid: IAzureFunctionExtensionDefinition = {
		"id": "Microsoft.Azure.WebJobs.Extensions.EventGrid",
        "version": "2.1.0",
        "name": "EventGrid",
        "bindings": [
			AzFuncBinding.EventGridTrigger,
        ]
	};

	public static readonly CosmosDB: IAzureFunctionExtensionDefinition = {
		"id": "Microsoft.Azure.WebJobs.Extensions.CosmosDB",
        "version": "3.0.5",
        "name": "CosmosDB",
        "bindings": [
			AzFuncBinding.CosmosDBTrigger,
			AzFuncBinding.CosmosDB,
        ]
	};
	
	public static readonly Twilio: IAzureFunctionExtensionDefinition = {
		"id": "Microsoft.Azure.WebJobs.Extensions.Twilio",
        "version": "3.0.0",
        "name": "Twilio",
        "bindings": [
            AzFuncBinding.TwilioSms,
        ]
	};

	public static readonly SignalRService: IAzureFunctionExtensionDefinition = {
		"id": "Microsoft.Azure.WebJobs.Extensions.SignalRService",
        "version": "1.0.0",
        "name": "SignalR",
        "bindings": [
			AzFuncBinding.SignalR,
			AzFuncBinding.SignalRConnectionInfo,
        ]
	};

	private static readonly _Extensions = [
		AzFuncExtension.ExtensionBundle,
		AzFuncExtension.AzureStorage,
		AzFuncExtension.ServiceBus,
		AzFuncExtension.EventHubs,
		AzFuncExtension.SendGrid,
		AzFuncExtension.DurableTask,
		AzFuncExtension.EventGrid,
		AzFuncExtension.CosmosDB,
		AzFuncExtension.Twilio,
		AzFuncExtension.SignalRService,
	];

	private static readonly _BuiltinBindings: AzFuncBinding[] = [
		AzFuncBinding.HttpTrigger,
		AzFuncBinding.Http,
		AzFuncBinding.TimerTrigger,
	];

	private static readonly _TriggerBindings: AzFuncBinding[] = [
		AzFuncBinding.HttpTrigger,
		AzFuncBinding.TimerTrigger,
		AzFuncBinding.BlobTrigger,
		AzFuncBinding.QueueTrigger,
		AzFuncBinding.ServiceBusTrigger,
		AzFuncBinding.EventHubTrigger,
		AzFuncBinding.ActivityTrigger,
		AzFuncBinding.OrchestionTrigger,
		AzFuncBinding.EventGridTrigger,
		AzFuncBinding.CosmosDBTrigger,
	];
}