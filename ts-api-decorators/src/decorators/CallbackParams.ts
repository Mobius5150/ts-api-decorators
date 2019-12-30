import { ManagedApiInternal } from "../apiManagement";
import { __ApiParamArgs } from "../apiManagement/InternalTypes";
import { ApiParamType } from "../apiManagement/ApiDefinition";

export const callbackParamDecoratorKey = 'callbackParamDecorator';

export interface ICallbackParamDecoratorDefinition {
	allowableTypes: ('function')[];
}

export function CallbackParamDecorator(d: ICallbackParamDecoratorDefinition) {
	return (
		target: object,
		propertyKey: string,
		descriptor: TypedPropertyDescriptor<any>
	) => {
		descriptor.writable = false;
		descriptor.configurable = false;
		Reflect.defineMetadata(callbackParamDecoratorKey, d, target, propertyKey);
	}
}

export function GetCallbackParamDecorator(param: string): ICallbackParamDecoratorDefinition {
	return <ICallbackParamDecoratorDefinition>Reflect.getMetadata(callbackParamDecoratorKey, CallbackParams, param);
}

abstract class CallbackParams {
	/**
	 * A callback parameter.
	 * @param validator 
	 */
	public static ApiCallbackParam(): ParameterDecorator;
	public static ApiCallbackParam(a?: any): ParameterDecorator {
		const args = <__ApiParamArgs>a;
		return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
			ManagedApiInternal.AddApiHandlerParamMetadataToObject(
				{
					args,
					parameterIndex,
					propertyKey,
					type: ApiParamType.Callback
				},
				target.constructor);
		}
	}
}

export const ApiCallbackParam = CallbackParams.ApiCallbackParam;