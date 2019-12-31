import { ManagedApiInternal } from "../apiManagement";
import { ApiParamValidationFunction, __ApiParamArgs } from "../apiManagement/InternalTypes";
import { ApiParamType } from "../apiManagement/ApiDefinition";
import { IParamDecoratorDefinition } from "../transformer/ParamDecoratorTransformer";

export const pathParamDecoratorKey = 'pathParamDecorator';

export function PathParamDecorator(d: IParamDecoratorDefinition) {
	return (
		target: object,
		propertyKey: string,
		descriptor: TypedPropertyDescriptor<any>
	) => {
		descriptor.writable = false;
		descriptor.configurable = false;
		Reflect.defineMetadata(pathParamDecoratorKey, d, target, propertyKey);
	}
}

export function GetPathParamDecorator(param: string): IParamDecoratorDefinition {
	return <IParamDecoratorDefinition>Reflect.getMetadata(pathParamDecoratorKey, PathParams, param);
}

abstract class PathParams {
	/**
	 * Decorates a path parameter that should be validated with a regular expression.
	 * @param stringValidationRegex The regular expression to validate the input
	 */
	public static ApiPathParamString(paramName?: string, stringValidationRegex?: RegExp);
	@PathParamDecorator({
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
	public static ApiPathParamString(a?: any): ParameterDecorator {
		return this.ApiPathParam(a);
	}

	/**
	 * Decorates a path parameter that should be cast to a number.
	 * @param numberMin The minimum value, undefined for no minimum.
	 * @param numberMax The maximum value, undefined for no maximum.
	 * @param numberDefault The default value, undefined will use the minimum value if defined, if not the maximum, if not then undefined.
	 */
	public static ApiPathParamNumber(paramName?: string, numberMin?: number, numberMax?: number);
	@PathParamDecorator({
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
	public static ApiPathParamNumber(a?: any): ParameterDecorator {
		return this.ApiPathParam(a);
	}

	/**
	 * A path parameter.
	 * @param validator 
	 */
	public static ApiPathParam(paramName?: string): ParameterDecorator;
	public static ApiPathParam(paramName: string, validator?: ApiParamValidationFunction): ParameterDecorator;
	@PathParamDecorator({
		allowableTypes: ['string', 'number', 'date', 'boolean'],
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

export const ApiPathParam = PathParams.ApiPathParam;
export const ApiPathParamString = PathParams.ApiPathParamString;
export const ApiPathParamNumber = PathParams.ApiPathParamNumber;