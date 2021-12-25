import { ManagedApiInternal } from "../apiManagement";
import { ApiParamValidationFunction, __ApiParamArgs, InternalTypeUtil } from "../apiManagement/InternalTypes";
import { ApiParamType } from "../apiManagement/ApiDefinition";
import { HandlerMethodParameterDecorator } from "../transformer/HandlerMethodParameterDecorator";
import { ApiDecorator, DecoratorParentNameDependency, ApiMethodDecoratorGetFunction } from "./DecoratorUtil";
import { BuiltinMetadata } from "../transformer/TransformerMetadata";
import { BuiltinArgumentExtractors } from "../transformer/BuiltinArgumentExtractors";
import { Api } from "./API";

abstract class PathParams {
	/**
	 * Decorates a path parameter that should be validated with a regular expression.
	 * @param stringValidationRegex The regular expression to validate the input
	 */
	public static ApiPathParamString(paramName?: string, stringValidationRegex?: RegExp);
	@ApiDecorator(HandlerMethodParameterDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		parameterType: ApiParamType.Path,
		parameterTypeRestrictions: [ InternalTypeUtil.TypeString  ],
		provider: BuiltinMetadata.BuiltinComponent,
		transformArgumentsToObject: true,
		arguments: [
			BuiltinArgumentExtractors.OptionalNameArgument,
			BuiltinArgumentExtractors.RegexpArgument,
		],
	})
	public static ApiPathParamString(a?: any): ParameterDecorator {
		return PathParams.ApiPathParam(a);
	}

	/**
	 * Decorates a path parameter that should be cast to a number.
	 * @param numberMin The minimum value, undefined for no minimum.
	 * @param numberMax The maximum value, undefined for no maximum.
	 * @param numberDefault The default value, undefined will use the minimum value if defined, if not the maximum, if not then undefined.
	 */
	public static ApiPathParamNumber(paramName?: string, numberMin?: number, numberMax?: number);
	@ApiDecorator(HandlerMethodParameterDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		parameterType: ApiParamType.Path,
		parameterTypeRestrictions: [ InternalTypeUtil.TypeNumber  ],
		provider: BuiltinMetadata.BuiltinComponent,
		transformArgumentsToObject: true,
		arguments: [
			BuiltinArgumentExtractors.OptionalNameArgument,
			BuiltinArgumentExtractors.NumberMinArgument,
			BuiltinArgumentExtractors.NumberMaxArgument,
		],
	})
	public static ApiPathParamNumber(a?: any): ParameterDecorator {
		return PathParams.ApiPathParam(a);
	}

	/**
	 * A path parameter.
	 * @param validator 
	 */
	public static ApiPathParam(paramName?: string): ParameterDecorator;
	public static ApiPathParam(paramName: string, validator?: ApiParamValidationFunction): ParameterDecorator;
	@ApiDecorator(HandlerMethodParameterDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		parameterType: ApiParamType.Path,
		parameterTypeRestrictions: [
			InternalTypeUtil.TypeNumber,
			InternalTypeUtil.TypeString,
			InternalTypeUtil.TypeDate,
			InternalTypeUtil.TypeBoolean,
			InternalTypeUtil.TypeEnum,
			
		],
		provider: BuiltinMetadata.BuiltinComponent,
		transformArgumentsToObject: true,
		arguments: [
			BuiltinArgumentExtractors.OptionalNameArgument,
			BuiltinArgumentExtractors.ValidationFunctionArgument,
		],
	})
	public static ApiPathParam(a?: any): ParameterDecorator {
		const args = <__ApiParamArgs>a;
		return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
			ManagedApiInternal.AddApiHandlerParamMetadataToObject(
				{
					args,
					parameterIndex,
					propertyKey,
					type: ApiParamType.Path,
				},
				target.constructor);
		}
	}
}

export const GetPathParamDecorator = ApiMethodDecoratorGetFunction<HandlerMethodParameterDecorator>(PathParams);

export const ApiPathParam = PathParams.ApiPathParam;
export const ApiPathParamString = PathParams.ApiPathParamString;
export const ApiPathParamNumber = PathParams.ApiPathParamNumber;