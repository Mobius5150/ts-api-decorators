export type ApiQueryParamValidationFunction = (name: string, value: string) => void;

/**
 * Decorates a query parameter that should be validated with a regular expression.
 * @param stringValidationRegex The regular expression to validate the input
 */
export function ApiQueryParamString(stringValidationRegex: RegExp) {
	return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {

	}
}

/**
 * Decorates a query parameter that should be cast to a number.
 * @param numberMin The minimum value, undefined for no minimum.
 * @param numberMax The maximum value, undefined for no maximum.
 * @param numberDefault The default value, undefined will use the minimum value if defined, if not the maximum, if not then undefined.
 */
export function ApiQueryParamNumber(numberMin?: number, numberMax?: number, numberDefault?: number) {
	return ApiQueryParam((name, value) => {
		throw new Error('Not implemented');
	});
}

/**
 * A query parameter.
 * @param validator 
 */
export function ApiQueryParam(validator?: ApiQueryParamValidationFunction) {
	return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {

	}
}