import { IBindingTrigger, IBindingParam, IBindingOutput } from "./Bindings";
import { ApiMethod, IApiInvocationParams, ApiParamsDict } from "ts-api-decorators";
import { IAzureFunctionManagedApiContext } from "../..";
import { Context } from "@azure/functions";
import { AzFuncBinding } from "../../metadata/AzFuncBindings";
import { IHandlerTreeNodeHandler } from "ts-api-decorators/dist/transformer/HandlerTree";
import { getMetadataValueByDescriptor, BuiltinMetadata } from "ts-api-decorators/dist/transformer/TransformerMetadata";
import { AzFuncMetadata } from "../../metadata/AzFuncMetadata";
import { IBlobTriggerBinding, IBlobInputBinding, IBlobOutputBinding } from "../../decorators/ExtensionDecorators/BlobStorage/BlobStorageBinding";
import { BlobStorageParams } from "../../decorators/ExtensionDecorators/BlobStorage/BlobStorageTrigger";

export class BlobStorageBindingTriggerFactory {
	public static GetTriggerBinding(): IBindingTrigger {
		return {
			triggerMethod: AzFuncBinding.BlobTrigger,
			triggerType: AzFuncBinding.BlobTrigger,
			getBindingForRoutes: routes => ([
				<IBlobTriggerBinding>{
					type: AzFuncBinding.BlobTrigger,
					direction: 'in',
					name: 'blobTrigger',
					...BlobStorageBindingTriggerFactory.getTriggerParamsForRoutes(routes),
				},
			])
		};
	}

	private static getTriggerParamsForRoutes(routes: IHandlerTreeNodeHandler[]): { path: string, connection?: string } {
		let path: string;
		let connection: string;
		for (const route of routes) {
			const p = getMetadataValueByDescriptor(route.metadata, BuiltinMetadata.Route);
			if (p) {
				if (path) {
					throw new Error('Can only declare one path per blob');
				}

				path = p;
			}

			const c = getMetadataValueByDescriptor(route.metadata, AzFuncMetadata.BlobStorageConnection);
			if (typeof c !== 'undefined') {
				if (typeof connection !== 'undefined') {
					throw new Error('Can only declare one connection per blob');
				}

				connection = c;
			}
		}

		const result: Partial<IBlobTriggerBinding> & { path: string } = {
			path,
		};

		if (typeof connection !== 'undefined') {
			result.connection = connection;
		}

		return result;
	}

	public static GetInvocationParams(context: Context): { method: ApiMethod, invocationParams: IApiInvocationParams<IAzureFunctionManagedApiContext> } {
		if (!context.bindings.blobTrigger) {
			throw new Error('Context does not have http req');
		}

		return {
			method: <any>AzFuncBinding.BlobTrigger,
			invocationParams: {
				queryParams: {},
				// TODO: Path params from the blob path once we figure out what's inside context.bindings.blobTrigger
				pathParams: this.GetPathParamsFromBlobBindingData(context.bindingData),
				headers: {},
				transportParams: {
					context,
					[BlobStorageParams.TransportTypeBlobInputParam]: context.bindings.blobTrigger,
					[BlobStorageParams.TransportTypeBlobInputPropsParam]: context.bindingData.properties,
				},
			}
		};
	}

	private static GetPathParamsFromBlobBindingData(bindingData: { [key: string]: any; }): ApiParamsDict {
		const skipNames = [
			'$request',
			'metadata',
			'properties',
			'sys'
		];

		const params: { [key: string]: any; } = {};
		for (const param of Object.keys(bindingData)) {
			if (skipNames.indexOf(param) !== -1 || typeof bindingData[param] !== 'string') {
				continue;
			}

			params[param] = bindingData[param];
		}

		return params;
	}
}

export class BlobStorageBindingParamFactory {
	public static GetParamBindings(): IBindingParam[] {
		return [
			{
				paramTypeId: BlobStorageParams.TransportTypeBlobInputParam,
				getBindingForParam: (param, route) => {
					if (!getMetadataValueByDescriptor(route.children[param.parameterIndex].metadata, BuiltinMetadata.Route)) {
						return [];
					}

					return [
						<IBlobInputBinding>{
							type: AzFuncBinding.Blob,
							direction: 'in',
							name: `${BlobStorageParams.TransportTypeBlobInputParam}-${typeof param.propertyKey === 'string' ? param.propertyKey : param.parameterIndex}`,
							...BlobStorageBindingParamFactory.getTriggerParamsForRoutes(route),
						},
					];
				},
			},
			{
				paramTypeId: BlobStorageParams.TransportTypeBlobInputPropsParam,
				getBindingForParam: (param, route) => {
					if (!getMetadataValueByDescriptor(route.children[param.parameterIndex].metadata, BuiltinMetadata.Route)) {
						return [];
					}

					throw new Error('Blob Props with Path Not Implemented');
				},
			},
		];
	}

	private static getTriggerParamsForRoutes(route: IHandlerTreeNodeHandler): { path: string, connection?: string } {
		let path: string;
		let connection: string;
		const p = getMetadataValueByDescriptor(route.metadata, BuiltinMetadata.Route);
		if (p) {
			path = p;
		}

		const c = getMetadataValueByDescriptor(route.metadata, AzFuncMetadata.BlobStorageConnection);
		if (typeof c !== 'undefined') {
			connection = c;
		}

		const result: Partial<IBlobInputBinding> & { path: string } = {
			path,
		};

		if (typeof connection !== 'undefined') {
			result.connection = connection;
		}

		return result;
	}
}

export class BlobStorageOutputBindingFactory {
	public static GetOutputBindings(): IBindingOutput[] {
		return [
			{
				outputTypeId: BlobStorageParams.TransportTypeBlobOutputParam,
				getBindingForOutput: (output, route) => {
					const name = getMetadataValueByDescriptor<string>(output.metadata, AzFuncMetadata.Output);
					if (!name) {
						throw new Error('Output binding must have a name');
					}

					const path = getMetadataValueByDescriptor<string>(output.metadata, BuiltinMetadata.Route);
					const connection = getMetadataValueByDescriptor<string>(output.metadata, AzFuncMetadata.BlobStorageConnection);
					return [
						<IBlobOutputBinding>{
							type: AzFuncBinding.Blob,
							direction: 'out',
							name,
							path,
							connection,
						},
					];
				},
			},
		];
	}
}