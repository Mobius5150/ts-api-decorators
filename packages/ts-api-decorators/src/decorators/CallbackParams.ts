import { ManagedApiInternal } from "../apiManagement";
import { __ApiParamArgs, InternalTypeUtil } from "../apiManagement/InternalTypes";
import { ApiParamType } from "../apiManagement/ApiDefinition";
import { ApiDecorator, DecoratorParentNameDependency } from "./DecoratorUtil";
import { HandlerMethodParameterDecorator } from "../transformer/HandlerMethodParameterDecorator";
import { BuiltinMetadata } from "../transformer/TransformerMetadata";
import { Api } from "./API";

abstract class CallbackParams {
	/**
	 * A callback parameter.
	 * @param validator 
	 */
	public static ApiCallbackParam(): ParameterDecorator;
	@ApiDecorator(HandlerMethodParameterDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		parameterType: ApiParamType.Body,
		parameterTypeRestrictions: [ InternalTypeUtil.TypeAnyFunction ],
		provider: BuiltinMetadata.BuiltinComponent,
		arguments: [],
	})
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