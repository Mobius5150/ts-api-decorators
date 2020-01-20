import { ManagedApiInternal } from "../apiManagement";
import { __ApiParamArgs, ApiParamValidationFunction, InternalTypeUtil } from '../apiManagement/InternalTypes';
import { ApiParamType } from "../apiManagement/ApiDefinition";
import { IParamDecoratorDefinition } from "../transformer/ParamDecoratorTransformer";
import { ApiDecorator, DecoratorParentNameDependency, ApiMethodDecoratorGetFunction } from "./DecoratorUtil";
import { HandlerMethodParameterDecorator } from "../transformer/treeTransformer/HandlerMethodParameterDecorator";
import { BuiltinArgumentExtractors } from "../transformer/treeTransformer/BuiltinArgumentExtractors";
import { BuiltinMetadata } from "../transformer/TransformerMetadata";
import { Api } from ".";

abstract class BodyParams {
	/**
	 * Decorates a query parameter that should be validated with a regular expression.
	 * @param stringValidationRegex The regular expression to validate the input
	 */
	@ApiDecorator(new HandlerMethodParameterDecorator({
		magicFunctionName: BodyParams.ApiBodyParamString.name,
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		parameterType: ApiParamType.Body,
		parameterTypeRestrictions: [ InternalTypeUtil.TypeString ],
		provider: BuiltinMetadata.BuiltinComponent,
		arguments: [
			BuiltinArgumentExtractors.RegexpArgument,
		],
	}))
	public static ApiBodyParamString(stringValidationRegex?: RegExp) {
		return BodyParams.ApiBodyParam((name, value) => {
			throw new Error('Not implemented');
		});
	}

	/**
	 * Decorates a query parameter that should be cast to a number.
	 * @param numberMin The minimum value, undefined for no minimum.
	 * @param numberMax The maximum value, undefined for no maximum.
	 * @param numberDefault The default value, undefined will use the minimum value if defined, if not the maximum, if not then undefined.
	 */
	@ApiDecorator(new HandlerMethodParameterDecorator({
		magicFunctionName: BodyParams.ApiBodyParamNumber.name,
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		parameterType: ApiParamType.Body,
		parameterTypeRestrictions: [ InternalTypeUtil.TypeNumber ],
		provider: BuiltinMetadata.BuiltinComponent,
		arguments: [
			BuiltinArgumentExtractors.NumberMinArgument,
			BuiltinArgumentExtractors.NumberMaxArgument,
		],
	}))
	public static ApiBodyParamNumber(numberMin?: number, numberMax?: number) {
		return BodyParams.ApiBodyParam((name, value) => {
			throw new Error('Not implemented');
		});
	}

	/**
	 * A query parameter.
	 * @param validator 
	 */
	public static ApiBodyParam(): ParameterDecorator;
	public static ApiBodyParam(validator?: ApiParamValidationFunction): ParameterDecorator;
	@ApiDecorator(new HandlerMethodParameterDecorator({
		magicFunctionName: BodyParams.ApiBodyParam.name,
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
		arguments: [
			BuiltinArgumentExtractors.ValidationFunctionArgument,
		],
	}))
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