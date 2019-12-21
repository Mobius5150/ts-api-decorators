import { ManagedApiInternal } from "../apiManagement";
import { __ApiParamArgs, ApiParamValidationFunction } from '../apiManagement/InternalTypes';
import { ApiParamType } from "../apiManagement/ApiDefinition";
import { IBodyParamDecoratorDefinition } from "../transformer/ParamDecoratorTransformer";

export const bodyParamDecoratorKey = 'bodyParamDecorator';

export function BodyParamDecorator(d: IBodyParamDecoratorDefinition) {
	return (
		target: object,
		propertyKey: string,
		descriptor: TypedPropertyDescriptor<any>
	) => {
		descriptor.writable = false;
		descriptor.configurable = false;
		Reflect.defineMetadata(bodyParamDecoratorKey, d, target, propertyKey);
	}
}

export function GetBodyParamDecorator(param: string): IBodyParamDecoratorDefinition {
	return <IBodyParamDecoratorDefinition>Reflect.getMetadata(bodyParamDecoratorKey, BodyParams, param);
}

export abstract class BodyParams {
	/**
	 * Decorates a query parameter that should be validated with a regular expression.
	 * @param stringValidationRegex The regular expression to validate the input
	 */
	@BodyParamDecorator({
		allowableTypes: ['string'],
		arguments: [
			{
				type: 'regexp',
				optional: true,
			}
		]
	})
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
	@BodyParamDecorator({
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
	@BodyParamDecorator({
		allowableTypes: ['object', 'string', 'number', 'date'],
		arguments: [
			{
				type: "validationFunc",
				optional: true,
			}
		]
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

export const ApiBodyParam = BodyParams.ApiBodyParam;
export const ApiBodyParamString = BodyParams.ApiBodyParamString;
export const ApiBodyParamNumber = BodyParams.ApiBodyParamNumber;