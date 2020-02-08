import { ManagedApiInternal, Api, ApiMethodDecoratorReturnType } from "ts-api-decorators";
import { ApiParamType, ApiMethodReturnType } from "ts-api-decorators/dist/apiManagement/ApiDefinition";
import { __ApiParamArgs, InternalTypeUtil } from "ts-api-decorators/dist/apiManagement/InternalTypes";
import { ApiDecorator, DecoratorParentNameDependency, ApiMethodDecoratorGetFunction } from "ts-api-decorators/dist/decorators/DecoratorUtil";
import { HandlerMethodParameterDecorator } from "ts-api-decorators/dist/transformer/HandlerMethodParameterDecorator";
import { HandlerMethodDecorator } from "ts-api-decorators/dist/transformer/HandlerMethodDecorator";
import { AzFuncMetadata } from "../../../metadata/AzFuncMetadata";
import { AzFuncBinding } from "../../../metadata/AzFuncBindings";
import { BlobStorageArgumentExtractors } from "./ArgumentExtractors";
import { BuiltinMetadata } from "ts-api-decorators/dist/transformer/TransformerMetadata";
import { AzFuncExtension } from "../../../metadata/AzFuncExtension";
import { IHandlerTreeNode, IHandlerTreeNodeParameter } from "ts-api-decorators/dist/transformer/HandlerTree";

abstract class BlobStorageMethodDecorators {
	/**
	 * Azure Functions Blob Trigger
	 * @param path The container to monitor. May be a blob name pattern.
	 * @param connection The name of an app setting that contains the Storage connection string to use for this binding. If the app setting name begins with "AzureWebJobs", you can specify only the remainder of the name here. For example, if you set connection to "MyStorage", the Functions runtime looks for an app setting that is named "MyStorage." If you leave connection empty, the Functions runtime uses the default Storage connection string in the app setting that is named AzureWebJobsStorage.
	 */
	public static AzFuncBlob<T extends ApiMethodReturnType>(path: string, connection?: string): ApiMethodDecoratorReturnType<T>;
	@ApiDecorator(HandlerMethodDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		provider: AzFuncMetadata.Component,
		arguments: [
			BlobStorageArgumentExtractors.PathArgument,
			BlobStorageArgumentExtractors.ConnectionArgument,
		],
		metadata: [
			...AzFuncMetadata.ExtensionBundleMetadata(AzFuncExtension.AzureStorage),
			...AzFuncMetadata.ApiMethodMetadataForBinding(AzFuncBinding.BlobTrigger),
		],
	})
	public static AzFuncBlob<T extends ApiMethodReturnType>(path: string, connection?: string): ApiMethodDecoratorReturnType<T> {
		return (
			target: object,
			propertyKey: string,
			descriptor: TypedPropertyDescriptor<(...args: any[]) => T>
		) => {
			ManagedApiInternal.AddApiMetadataToObject(
				{
					method: <any>AzFuncBinding.BlobTrigger,
					route: (connection || '') + path,
					handlerKey: propertyKey,
					handler: descriptor.value,
				},
				target.constructor);
		}
	}
}

export abstract class BlobStorageParams {
	public static readonly TransportTypeBlobInputParam = 'inputBlob';
	public static readonly TransportTypeBlobInputPropsParam = 'inputBlobProps';
	public static readonly TransportTypeBlobOutputParam = 'outputblob';

	public static AzFuncBlobParam(): ParameterDecorator;
	public static AzFuncBlobParam(path: string, connection?: string): ParameterDecorator;
	@ApiDecorator(HandlerMethodParameterDecorator, {
		indexTs: __filename,
		// TODO: If called with the argument-less overlaod then this must be called under `BlobStorageMethodDecorators.AzFuncBlob.name`,
		// but if using the (path, connection) overload then it doesn't have that dependency
		dependencies: [
			(node: IHandlerTreeNodeParameter) => {
				// TODO: how to get the argument count here?
				if (false /* if args.length === 0 */) {
					return [
						DecoratorParentNameDependency(BlobStorageMethodDecorators.AzFuncBlob.name)
					];
				}
			},
		],
		parameterType: ApiParamType.Transport,
		parameterTypeRestrictions: [
			InternalTypeUtil.TypeBuffer,
		],
		provider: AzFuncMetadata.Component,
		arguments: [
			{ ...BlobStorageArgumentExtractors.PathArgument, optional: true, },
			BlobStorageArgumentExtractors.ConnectionArgument,
		],
		transportTypeId: BlobStorageParams.TransportTypeBlobInputParam,
		transformArgumentsToObject: true,
	})
	public static AzFuncBlobParam(a?: any): ParameterDecorator {
		return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
			const args = <__ApiParamArgs>a;
			ManagedApiInternal.AddApiHandlerParamMetadataToObject(
				{
					args,
					parameterIndex,
					propertyKey,
					type: ApiParamType.Transport,
					transportTypeId: BlobStorageParams.TransportTypeBlobInputParam,
				},
				target.constructor);
		}
	}

	public static AzFuncBlobPropertiesParam(): ParameterDecorator;
	// public static AzFuncBlobPropertiesParam(path: string, connection?: string): ParameterDecorator;
	@ApiDecorator(HandlerMethodParameterDecorator, {
		indexTs: __filename,
		// TODO: If called with the argument-less overlaod then this must be called under `BlobStorageMethodDecorators.AzFuncBlob.name`,
		// but if using the (path, connection) overload then it doesn't have that dependency
		dependencies: [
			(node: IHandlerTreeNodeParameter) => {
				// TODO: how to get the argument count here?
				if (false /* if args.length === 0 */) {
					return [
						DecoratorParentNameDependency(BlobStorageMethodDecorators.AzFuncBlob.name)
					];
				}
			},
		],
		parameterType: ApiParamType.Transport,
		parameterTypeRestrictions: [
			InternalTypeUtil.TypeAnyObject,
		],
		provider: AzFuncMetadata.Component,
		arguments: [
			{ ...BlobStorageArgumentExtractors.PathArgument, optional: true, },
			BlobStorageArgumentExtractors.ConnectionArgument,
		],
		transportTypeId: BlobStorageParams.TransportTypeBlobInputPropsParam,
		transformArgumentsToObject: true,
	})
	public static AzFuncBlobPropertiesParam(a?: any): ParameterDecorator {
		return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
			const args = <__ApiParamArgs>a;
			ManagedApiInternal.AddApiHandlerParamMetadataToObject(
				{
					args,
					parameterIndex,
					propertyKey,
					type: ApiParamType.Transport,
					transportTypeId: BlobStorageParams.TransportTypeBlobInputPropsParam,
				},
				target.constructor);
		}
	}
}

export const AzFuncBlobMethodDecorator = ApiMethodDecoratorGetFunction<HandlerMethodDecorator>(BlobStorageMethodDecorators);
export const AzFuncBlobParamDecorator = ApiMethodDecoratorGetFunction<HandlerMethodParameterDecorator>(BlobStorageParams);

export const AzFuncBlob = BlobStorageMethodDecorators.AzFuncBlob;
export const AzFuncBlobParam = BlobStorageParams.AzFuncBlobParam;
export const AzFuncBlobPropertiesParam = BlobStorageParams.AzFuncBlobPropertiesParam;