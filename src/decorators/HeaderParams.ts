import { ManagedApiInternal } from "../apiManagement";
import { ApiParamValidationFunction, __ApiParamArgs } from "../apiManagement/InternalTypes";
import { ApiParamType } from "../apiManagement/ApiDefinition";
import { IQueryParamDecoratorDefinition } from "../transformer/ParamDecoratorTransformer";

export const headerParamDecoratorKey = 'headerParamDecorator';

export function HeaderParamDecorator(d: IQueryParamDecoratorDefinition) {
	return (
		target: object,
		propertyKey: string,
		descriptor: TypedPropertyDescriptor<any>
	) => {
		descriptor.writable = false;
		descriptor.configurable = false;
		Reflect.defineMetadata(headerParamDecoratorKey, d, target, propertyKey);
	}
}

export function GetHeaderParamDecorator(param: string): IQueryParamDecoratorDefinition {
	return <IQueryParamDecoratorDefinition>Reflect.getMetadata(headerParamDecoratorKey, HeaderParams, param);
}

abstract class HeaderParams {
	/**
	 * Decorates a query parameter that should be validated with a regular expression.
	 * @param stringValidationRegex The regular expression to validate the input
	 */
	@HeaderParamDecorator({
		allowableTypes: ['string'],
		arguments: [
			{
				type: "paramName",
				optional: true,
			},
			{
				type: 'regexp',
				optional: true,
			}
		]
	})
	public static ApiHeaderParamString(paramName?: string, stringValidationRegex?: RegExp) {
		throw new Error('Not implemented');
	}

	/**
	 * Decorates a query parameter that should be cast to a number.
	 * @param numberMin The minimum value, undefined for no minimum.
	 * @param numberMax The maximum value, undefined for no maximum.
	 * @param numberDefault The default value, undefined will use the minimum value if defined, if not the maximum, if not then undefined.
	 */
	@HeaderParamDecorator({
		allowableTypes: ['number'],
		arguments: [
			{
				type: "paramName",
				optional: true,
			},
			{
				type: "numberMin",
				optional: true,
			},
			{
				type: "numberMax",
				optional: true,
			}
		]
	})
	public static ApiHeaderParamNumber(paramName?: string, numberMin?: number, numberMax?: number) {
		throw new Error('Not implemented');
	}

	/**
	 * A query parameter.
	 * @param validator 
	 */
	public static ApiHeaderParam(paramName?: string): ParameterDecorator;
	public static ApiHeaderParam(paramName?: string, validator?: ApiParamValidationFunction): ParameterDecorator;
	@HeaderParamDecorator({
		allowableTypes: ['string', 'number', 'date'],
		arguments: [
			{
				type: "paramName",
				optional: true,
			},
			{
				type: "validationFunc",
				optional: true,
			},
		]
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

export const ApiHeaderParam = HeaderParams.ApiHeaderParam;
export const ApiHeaderParamString = HeaderParams.ApiHeaderParamString;
export const ApiHeaderParamNumber = HeaderParams.ApiHeaderParamNumber;