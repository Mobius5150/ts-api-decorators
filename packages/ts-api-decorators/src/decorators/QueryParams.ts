import { ManagedApiInternal } from "../apiManagement";
import { ApiParamValidationFunction, __ApiParamArgs, InternalTypeUtil } from "../apiManagement/InternalTypes";
import { ApiParamType } from "../apiManagement/ApiDefinition";
import { ApiDecorator, DecoratorParentNameDependency, ApiMethodDecoratorGetFunction } from "./DecoratorUtil";
import { HandlerMethodParameterDecorator } from "../transformer/HandlerMethodParameterDecorator";
import { Api } from "./API";
import { BuiltinMetadata } from "../transformer/TransformerMetadata";
import { BuiltinArgumentExtractors } from "../transformer/BuiltinArgumentExtractors";

abstract class QueryParams {
	/**
	 * Decorates a query parameter that should be validated with a regular expression.
	 * @param stringValidationRegex The regular expression to validate the input
	 */
	public static ApiQueryParamString(paramName?: string, stringValidationRegex?: RegExp);
	@ApiDecorator(HandlerMethodParameterDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		parameterType: ApiParamType.Query,
		parameterTypeRestrictions: [ InternalTypeUtil.TypeString ],
		provider: BuiltinMetadata.BuiltinComponent,
		transformArgumentsToObject: true,
		arguments: [
			BuiltinArgumentExtractors.OptionalNameArgument,
			BuiltinArgumentExtractors.RegexpArgument
		],
	})
	public static ApiQueryParamString(a?: any): ParameterDecorator {
		return QueryParams.ApiQueryParam(a);
	}

	/**
	 * Decorates a query parameter that should be cast to a number.
	 * @param numberMin The minimum value, undefined for no minimum.
	 * @param numberMax The maximum value, undefined for no maximum.
	 */
	public static ApiQueryParamNumber(paramName?: string, numberMin?: number, numberMax?: number);
	@ApiDecorator(HandlerMethodParameterDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		parameterType: ApiParamType.Query,
		parameterTypeRestrictions: [ InternalTypeUtil.TypeNumber ],
		provider: BuiltinMetadata.BuiltinComponent,
		transformArgumentsToObject: true,
		arguments: [
			BuiltinArgumentExtractors.OptionalNameArgument,
			BuiltinArgumentExtractors.NumberMinArgument,
			BuiltinArgumentExtractors.NumberMaxArgument,
		],
	})
	public static ApiQueryParamNumber(a?: any): ParameterDecorator {
		return QueryParams.ApiQueryParam(a);
	}

	/**
	 * A query parameter.
	 * @param validator 
	 */
	public static ApiQueryParam(paramName?: string): ParameterDecorator;
	public static ApiQueryParam(paramName: string, validator?: ApiParamValidationFunction): ParameterDecorator;
	@ApiDecorator(HandlerMethodParameterDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		parameterType: ApiParamType.Query,
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
	public static ApiQueryParam(a?: any): ParameterDecorator {
		const args = <__ApiParamArgs>a;
		return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
			ManagedApiInternal.AddApiHandlerParamMetadataToObject(
				{
					args,
					parameterIndex,
					propertyKey,
					type: ApiParamType.Query
				},
				target.constructor);
		}
	}
}

export const GetQueryParamDecorator = ApiMethodDecoratorGetFunction<HandlerMethodParameterDecorator>(QueryParams);

export const ApiQueryParam = QueryParams.ApiQueryParam;
export const ApiQueryParamString = QueryParams.ApiQueryParamString;
export const ApiQueryParamNumber = QueryParams.ApiQueryParamNumber;