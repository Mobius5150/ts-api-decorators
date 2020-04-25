import { ManagedApiInternal } from "../apiManagement";
import { __ApiParamArgs, ApiParamValidationFunction, InternalTypeUtil } from '../apiManagement/InternalTypes';
import { ApiParamType } from "../apiManagement/ApiDefinition";
import { ApiDecorator, DecoratorParentNameDependency, ApiMethodDecoratorGetFunction } from "./DecoratorUtil";
import { HandlerMethodParameterDecorator } from "../transformer/HandlerMethodParameterDecorator";
import { BuiltinArgumentExtractors } from "../transformer/BuiltinArgumentExtractors";
import { BuiltinMetadata } from "../transformer/TransformerMetadata";
import { Api } from "./API";

abstract class BodyParams {
	/**
	 * Decorates a query parameter that should be validated with a regular expression.
	 * @param stringValidationRegex The regular expression to validate the input
	 */
	public static ApiBodyParamString(stringValidationRegex?: RegExp);
	@ApiDecorator(HandlerMethodParameterDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		parameterType: ApiParamType.Body,
		parameterTypeRestrictions: [ InternalTypeUtil.TypeString ],
		provider: BuiltinMetadata.BuiltinComponent,
		transformArgumentsToObject: true,
		arguments: [
			BuiltinArgumentExtractors.RegexpArgument,
		],
	})
	public static ApiBodyParamString(a?: any) {
		return this.ApiBodyParam(a);
	}

	/**
	 * Decorates a query parameter that should be cast to a number.
	 * @param numberMin The minimum value, undefined for no minimum.
	 * @param numberMax The maximum value, undefined for no maximum.
	 * @param numberDefault The default value, undefined will use the minimum value if defined, if not the maximum, if not then undefined.
	 */
	public static ApiBodyParamNumber(numberMin?: number, numberMax?: number);
	@ApiDecorator(HandlerMethodParameterDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		parameterType: ApiParamType.Body,
		parameterTypeRestrictions: [ InternalTypeUtil.TypeNumber ],
		provider: BuiltinMetadata.BuiltinComponent,
		transformArgumentsToObject: true,
		arguments: [
			BuiltinArgumentExtractors.NumberMinArgument,
			BuiltinArgumentExtractors.NumberMaxArgument,
		],
	})
	public static ApiBodyParamNumber(a?: any) {
		return this.ApiBodyParam(a);
	}

	/**
	 * A query parameter.
	 * @param validator 
	 */
	public static ApiBodyParam(): ParameterDecorator;
	public static ApiBodyParam(validator?: ApiParamValidationFunction): ParameterDecorator;
	@ApiDecorator(HandlerMethodParameterDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		parameterType: ApiParamType.Body,
		parameterTypeRestrictions: [
			InternalTypeUtil.TypeNumber,
			InternalTypeUtil.TypeString,
			InternalTypeUtil.TypeDate,
			InternalTypeUtil.TypeAnyObject,
		],
		provider: BuiltinMetadata.BuiltinComponent,
		transformArgumentsToObject: true,
		arguments: [
			BuiltinArgumentExtractors.ValidationFunctionArgument,
		],
	})
	public static ApiBodyParam(a?: any): ParameterDecorator {
		const args = <__ApiParamArgs>a;
		return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
			ManagedApiInternal.AddApiHandlerParamMetadataToObject(
				{
					args,
					parameterIndex,
					propertyKey,
					type: ApiParamType.Body,
				},
				target.constructor);
		}
	}
}

export const GetBodyParamDecorator = ApiMethodDecoratorGetFunction<HandlerMethodParameterDecorator>(BodyParams);

export const ApiBodyParam = BodyParams.ApiBodyParam;
export const ApiBodyParamString = BodyParams.ApiBodyParamString;
export const ApiBodyParamNumber = BodyParams.ApiBodyParamNumber;