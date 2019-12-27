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
				type: 'regexp',
				optional: true,
			}
		]
	})
	public static ApiHeaderParamString(stringValidationRegex?: RegExp) {
		return HeaderParams.ApiHeaderParam((name, value) => {
			throw new Error('Not implemented');
		});
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
				type: "numberMin",
				optional: true,
			},
			{
				type: "numberMax",
				optional: true,
			}
		]
	})
	public static ApiHeaderParamNumber(numberMin?: number, numberMax?: number) {
		return HeaderParams.ApiHeaderParam((name, value) => {
			throw new Error('Not implemented');
		});
	}

	/**
	 * A query parameter.
	 * @param validator 
	 */
	public static ApiHeaderParam(): ParameterDecorator;
	public static ApiHeaderParam(validator?: ApiParamValidationFunction): ParameterDecorator;
	@HeaderParamDecorator({
		allowableTypes: ['string', 'number', 'date'],
		arguments: [
			{
				type: "validationFunc",
				optional: true,
			}
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