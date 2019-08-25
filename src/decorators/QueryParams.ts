import { QueryParamDecorator } from "./DecoratorUtil";
import { ManagedApiInternal } from "../apiManagement";

export type ApiQueryParamValidationFunction = (name: string, value: string) => void;

export abstract class QueryParams {
	/**
	 * Decorates a query parameter that should be validated with a regular expression.
	 * @param stringValidationRegex The regular expression to validate the input
	 */
	@QueryParamDecorator({
		allowableTypes: ['string'],
		arguments: [
			{
				type: 'regexp',
				optional: true,
			}
		]
	})
	public static ApiQueryParamString(stringValidationRegex?: RegExp) {
		return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {

		}
	}

	/**
	 * Decorates a query parameter that should be cast to a number.
	 * @param numberMin The minimum value, undefined for no minimum.
	 * @param numberMax The maximum value, undefined for no maximum.
	 * @param numberDefault The default value, undefined will use the minimum value if defined, if not the maximum, if not then undefined.
	 */
	@QueryParamDecorator({
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
	public static ApiQueryParamNumber(numberMin?: number, numberMax?: number) {
		return QueryParams.ApiQueryParam((name, value) => {
			throw new Error('Not implemented');
		});
	}

	/**
	 * A query parameter.
	 * @param validator 
	 */
	public static ApiQueryParam(): ParameterDecorator;
	public static ApiQueryParam(validator?: ApiQueryParamValidationFunction): ParameterDecorator;
	@QueryParamDecorator({
		allowableTypes: ['string', 'number', 'date'],
		arguments: [
			{
				type: "validationFunc",
				optional: true,
			}
		]
	})
	public static ApiQueryParam(a?: any): ParameterDecorator {
		const args = <__ApiQueryParamArgs>a;
		return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
			ManagedApiInternal.AddApiHandlerParamMetadataToObject(
				{
					args,
					parameterIndex,
					propertyKey,
				},
				target.constructor);
		}
	}
}

export const ApiQueryParam = QueryParams.ApiQueryParam;
export const ApiQueryParamString = QueryParams.ApiQueryParamString;
export const ApiQueryParamNumber = QueryParams.ApiQueryParamNumber;

export interface __ApiQueryParamArgs {
	name: string;
	typedef: InternalTypeDefinition;
	optional?: boolean;
	initializer?: () => any;
	validationFunction?: ApiQueryParamValidationFunction;
}

export interface IntrinsicTypeDefinition {
	type: 'boolean' | 'any';
}

export interface IntrinsicTypeDefinitionString {
	type: 'string';
	validationRegex?: RegExp;
}

export interface IntrinsicTypeDefinitionNumber {
	type: 'number';
	minVal?: number;
	maxVal?: number;
}

export type InternalTypeDefinition =
	IntrinsicTypeDefinition
	| IntrinsicTypeDefinitionString
	| IntrinsicTypeDefinitionNumber
	| InternalObjectTypeDefinition
	| InternalUnionTypeDefinition
	| InternalIntersectionTypeDefinition
	| InternalArrayTypeDefinition;

export interface InternalObjectTypeDefinition {
	type: 'object';
	schema: object;
}

export interface InternalUnionTypeDefinition {
	type: 'union';
	types: InternalTypeDefinition[];
}

export interface InternalArrayTypeDefinition {
	type: 'array';
	elementType: InternalTypeDefinition;
}

// TODO: The intersection type will probably yield less-than optimal results or longer validation runtime. Should see if it can be collapased to the single resulting type
export interface InternalIntersectionTypeDefinition {
	type: 'intersection';
	types: InternalTypeDefinition[];
}