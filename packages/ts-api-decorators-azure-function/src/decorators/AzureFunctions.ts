import { ManagedApiInternal, Api } from "ts-api-decorators";
import { ApiParamType } from "ts-api-decorators/dist/apiManagement/ApiDefinition";
import { __ApiParamArgs, InternalTypeUtil } from "ts-api-decorators/dist/apiManagement/InternalTypes";
import { ApiDecorator, DecoratorParentNameDependency, ApiMethodDecoratorGetFunction } from "ts-api-decorators/dist/decorators/DecoratorUtil";
import { HandlerMethodParameterDecorator } from "ts-api-decorators/dist/transformer/HandlerMethodParameterDecorator";
import { AzFuncMetadata } from "../metadata/AzFuncMetadata";

export abstract class AzureFunctionParams {
	public static readonly TransportTypeRequestParam = 'request';
	public static readonly TransportTypeResponseParam = 'response';

	public static AzFuncApiRequestParam(): ParameterDecorator;
	@ApiDecorator(HandlerMethodParameterDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		parameterType: ApiParamType.Transport,
		parameterTypeRestrictions: [
			InternalTypeUtil.TypeAnyObject,
		],
		provider: AzFuncMetadata.Component,
		arguments: [],
		transportTypeId: AzureFunctionParams.TransportTypeRequestParam,
	})
	public static AzFuncApiRequestParam(a?: any): ParameterDecorator {
		return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
			const args = <__ApiParamArgs>a;
			ManagedApiInternal.AddApiHandlerParamMetadataToObject(
				{
					args,
					parameterIndex,
					propertyKey,
					type: ApiParamType.Transport,
					transportTypeId: AzureFunctionParams.TransportTypeRequestParam,
				},
				target.constructor);
		}
	}

	public static AzFuncApiResponseParam(): ParameterDecorator;
	@ApiDecorator(HandlerMethodParameterDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		parameterType: ApiParamType.Transport,
		parameterTypeRestrictions: [
			InternalTypeUtil.TypeAnyObject,
		],
		provider: AzFuncMetadata.Component,
		arguments: [],
		transportTypeId: AzureFunctionParams.TransportTypeResponseParam
	})
	public static AzFuncApiResponseParam(a?: any): ParameterDecorator {
		return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
			const args = <__ApiParamArgs>a;
			ManagedApiInternal.AddApiHandlerParamMetadataToObject(
				{
					args,
					parameterIndex,
					propertyKey,
					type: ApiParamType.Transport,
					transportTypeId: AzureFunctionParams.TransportTypeResponseParam,
				},
				target.constructor);
		}
	}
}

export const AzFuncParamDecorator = ApiMethodDecoratorGetFunction<HandlerMethodParameterDecorator>(AzureFunctionParams);

export const AzFuncApiRequestParam = AzureFunctionParams.AzFuncApiRequestParam;
export const AzFuncApiResponseParam = AzureFunctionParams.AzFuncApiResponseParam;