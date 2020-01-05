import { ApiGetMethodReturnType, ManagedApiInternal } from "ts-api-decorators";
import { ApiMethodReturnType, ApiParamType } from "ts-api-decorators/dist/apiManagement/ApiDefinition";
import { __ApiParamArgs } from "ts-api-decorators/dist/apiManagement/InternalTypes";

export abstract class AzureFunctionParams {
	public static readonly TransportTypeRequestParam = 'request';
	public static readonly TransportTypeResponseParam = 'response';

	public static AzFuncApiRequestParam(): ParameterDecorator;
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

export const AzFuncApiRequestParam = AzureFunctionParams.AzFuncApiRequestParam;
export const AzFuncApiResponseParam = AzureFunctionParams.AzFuncApiResponseParam;