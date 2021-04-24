import { IMetadataDescriptor, IMetadataType, BuiltinMetadata, ITransformerMetadata } from "ts-api-decorators/dist/transformer/TransformerMetadata";
import { IAzureFunctionExtensionDefinition, AzFuncExtension } from "./AzFuncExtension";
import { AzFuncBinding } from "./AzFuncBindings";
import { __ApiParamArgs } from "ts-api-decorators/dist/apiManagement/InternalTypes";

export interface IAzFunctionArgs extends __ApiParamArgs {
	azfextensionbundle?: string;
	azftimerschedule?: string;
	azftimerrunonstartup?: string;
	azftimerusermonitor?: string;
	azfblobstorconn?: string;
	azfbindingoutfield?: string;
	azfbindingoutput?: string;
}

export interface IAzFunctionMetadataDescriptor extends IMetadataDescriptor {
	key?: keyof IAzFunctionArgs;
}

export abstract class AzFuncMetadata {
	public static readonly Component = 'ts-api-decorators-azure-function';
	
	public static readonly ExtensionBundle: IAzFunctionMetadataDescriptor = {
		type: IMetadataType.Plugin,
		component: AzFuncMetadata.Component,
		key: 'azfextensionbundle',
	}

	public static readonly TimerSchedule: IAzFunctionMetadataDescriptor = {
		type: IMetadataType.Plugin,
		component: AzFuncMetadata.Component,
		key: 'azftimerschedule',
	}

	public static readonly TimerRunOnStartup: IAzFunctionMetadataDescriptor = {
		type: IMetadataType.Plugin,
		component: AzFuncMetadata.Component,
		key: 'azftimerrunonstartup',
	}

	public static readonly TimerUseMonitor: IAzFunctionMetadataDescriptor = {
		type: IMetadataType.Plugin,
		component: AzFuncMetadata.Component,
		key: 'azftimerusermonitor',
	}

	public static readonly BlobStorageConnection: IAzFunctionMetadataDescriptor = {
		type: IMetadataType.Plugin,
		component: AzFuncMetadata.Component,
		key: 'azfblobstorconn',
	}

	public static readonly OutField: IAzFunctionMetadataDescriptor = {
		type: IMetadataType.Plugin,
		component: AzFuncMetadata.Component,
		key: 'azfbindingoutfield',
	}

	public static readonly Output: IAzFunctionMetadataDescriptor = {
		type: IMetadataType.Plugin,
		component: AzFuncMetadata.Component,
		key: 'azfbindingoutput',
	}

	public static OutputMetadata(transportTypeId: string): ITransformerMetadata {
		return {
			...AzFuncMetadata.Output,
			value: transportTypeId,
		};
	}

	public static ExtensionBundleMetadata(extension: IAzureFunctionExtensionDefinition): ITransformerMetadata[] {
		return [
			{
				...AzFuncMetadata.ExtensionBundle,
				value: extension.id,
			}
		];
	}

	public static ApiMethodMetadataForBinding(binding: AzFuncBinding): ITransformerMetadata[] {
		if (!AzFuncExtension.IsTriggerTypeBinding(binding)) {
			throw new Error(`Cannot get API method for non-trigger-type binding: ${binding}`);
		}

		return [
			{
				...BuiltinMetadata.ApiMethod,
				value: binding,
			},
			{
				...BuiltinMetadata.ApiMethodType,
				value: binding,
			},
		];
	}
}