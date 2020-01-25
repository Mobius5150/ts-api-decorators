import { ManagedApiInternal } from "../apiManagement";
import { ApiParamValidationFunction, __ApiParamArgs, InternalTypeUtil } from "../apiManagement/InternalTypes";
import { ApiParamType } from "../apiManagement/ApiDefinition";
import { DecoratorParentNameDependency, ApiDecorator, ApiMethodDecoratorGetFunction } from "./DecoratorUtil";
import { Api } from "./API";
import { BuiltinMetadata } from "../transformer/TransformerMetadata";
import { BuiltinArgumentExtractors } from "../transformer/BuiltinArgumentExtractors";
import { HandlerMethodParameterDecorator } from "../transformer/HandlerMethodParameterDecorator";

abstract class HeaderParams {
	/**
	 * Decorates a query parameter that should be validated with a regular expression.
	 * @param stringValidationRegex The regular expression to validate the input
	 */
	public static ApiHeaderParamString(paramName?: string, stringValidationRegex?: RegExp)
	@ApiDecorator(HandlerMethodParameterDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		parameterType: ApiParamType.Header,
		parameterTypeRestrictions: [ InternalTypeUtil.TypeString ],
		provider: BuiltinMetadata.BuiltinComponent,
		transformArgumentsToObject: true,
		arguments: [
			BuiltinArgumentExtractors.OptionalNameArgument,
			BuiltinArgumentExtractors.RegexpArgument,
		],
	})
	public static ApiHeaderParamString(a?: any): ParameterDecorator {
		return this.ApiHeaderParam(a);
	}

	/**
	 * Decorates a query parameter that should be cast to a number.
	 * @param numberMin The minimum value, undefined for no minimum.
	 * @param numberMax The maximum value, undefined for no maximum.
	 * @param numberDefault The default value, undefined will use the minimum value if defined, if not the maximum, if not then undefined.
	 */
	public static ApiHeaderParamNumber(paramName?: string, numberMin?: number, numberMax?: number);
	@ApiDecorator(HandlerMethodParameterDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		parameterType: ApiParamType.Header,
		parameterTypeRestrictions: [ InternalTypeUtil.TypeNumber ],
		provider: BuiltinMetadata.BuiltinComponent,
		transformArgumentsToObject: true,
		arguments: [
			BuiltinArgumentExtractors.OptionalNameArgument,
			BuiltinArgumentExtractors.NumberMinArgument,
			BuiltinArgumentExtractors.NumberMaxArgument,
		],
	})
	public static ApiHeaderParamNumber(a?: any): ParameterDecorator {
		return this.ApiHeaderParam(a);
	}

	/**
	 * A query parameter.
	 * @param validator 
	 */
	public static ApiHeaderParam(paramName?: string): ParameterDecorator;
	public static ApiHeaderParam(paramName?: string, validator?: ApiParamValidationFunction): ParameterDecorator;
	@ApiDecorator(HandlerMethodParameterDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		parameterType: ApiParamType.Header,
		parameterTypeRestrictions: [
			InternalTypeUtil.TypeNumber,
			InternalTypeUtil.TypeString,
			InternalTypeUtil.TypeDate,
		],
		provider: BuiltinMetadata.BuiltinComponent,
		transformArgumentsToObject: true,
		arguments: [
			BuiltinArgumentExtractors.OptionalNameArgument,
			BuiltinArgumentExtractors.ValidationFunctionArgument,
		],
	})
	public static ApiHeaderParam(a?: any): ParameterDecorator {
		const args = <__ApiParamArgs>a;
		return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
			ManagedApiInternal.AddApiHandlerParamMetadataToObject(
				{
					args,
					parameterIndex,
					propertyKey,
					type: ApiParamType.Header,
				},
				target.constructor);
		}
	}
}

export const GetHeaderParamDecorator = ApiMethodDecoratorGetFunction<HandlerMethodParameterDecorator>(HeaderParams);

export const ApiHeaderParam = HeaderParams.ApiHeaderParam;
export const ApiHeaderParamString = HeaderParams.ApiHeaderParamString;
export const ApiHeaderParamNumber = HeaderParams.ApiHeaderParamNumber;