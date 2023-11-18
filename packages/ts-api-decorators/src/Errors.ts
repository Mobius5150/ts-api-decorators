import { ValidationError } from "jsonschema";
import { HttpError } from "./HttpError";
import { HttpBadRequestError } from "./GeneratedErrors";

export * from './HttpError';
export * from './GeneratedErrors';

export class HttpTransportConfigurationError extends HttpError {
    constructor(m: string = 'Internal Server Error') {
        super(m, 500, {});

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, HttpTransportConfigurationError.prototype);
    }
}

export class HttpRequiredQueryParamMissingError extends HttpBadRequestError {
    constructor(queryParamName: string) {
        super(`Missing required query parameter '${queryParamName}'`);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, HttpRequiredQueryParamMissingError.prototype);
    }
}

export class HttpRequiredPathParamMissingError extends HttpBadRequestError {
    constructor(pathParamName: string) {
        super(`Missing required path parameter '${pathParamName}'`);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, HttpRequiredPathParamMissingError.prototype);
    }
}

export class HttpRequiredHeaderParamMissingError extends HttpBadRequestError {
    constructor(headerParamName: string) {
        super(`Missing required header parameter '${headerParamName}'`);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, HttpRequiredHeaderParamMissingError.prototype);
    }
}

export class HttpRequiredBodyParamMissingError extends HttpBadRequestError {
    constructor() {
        super(`Missing request body`);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, HttpRequiredBodyParamMissingError.prototype);
    }
}

export class HttpRequiredTransportParamMissingError extends HttpBadRequestError {
    constructor(queryParamName: string) {
        super(`Missing required transport parameter '${queryParamName}'`);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, HttpRequiredTransportParamMissingError.prototype);
    }
}

export class HttpQueryParamInvalidTypeError extends HttpBadRequestError {
    constructor(queryParamName: string, expectedType: string) {
        super(`Invalid value for query parameter '${queryParamName}'. Must be a valid ${expectedType}.`);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, HttpQueryParamInvalidTypeError.prototype);
    }
}

export class HttpRegexParamInvalidTypeError extends HttpBadRequestError {
    constructor(paramName: string, regex: string) {
        super(`Invalid value for parameter '${paramName}'. Must match regular expression: ${regex}.`);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, HttpRegexParamInvalidTypeError.prototype);
    }
}

export class HttpNumberParamOutOfBoundsError extends HttpBadRequestError {
    constructor(paramName: string, minVal: number = Number.NEGATIVE_INFINITY, maxVal: number = Number.POSITIVE_INFINITY) {
        super(`Invalid value for parameter '${paramName}'. Value must be within [${minVal}, ${maxVal}] (inclusive)`);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, HttpNumberParamOutOfBoundsError.prototype);
    }
}

export class HttpEnumParamInvalidValueError extends HttpBadRequestError {
    constructor(paramName: string, values: any[]) {
        super(`Invalid value for parameter '${paramName}'. Value must be one of [${values.join(', ')}]`);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, HttpEnumParamInvalidValueError.prototype);
    }
}

export class HttpConstParamInvalidValueError extends HttpBadRequestError {
    constructor(paramName: string, value: any) {
        super(`Invalid value for const parameter '${paramName}'. Value must be '${value}'`);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, HttpConstParamInvalidValueError.prototype);
    }
}

export class HttpParamInvalidError extends HttpBadRequestError {
    constructor(paramName: string) {
        super(`Invalid value for parameter '${paramName}'.`);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, HttpParamInvalidError.prototype);
    }
}

export class HttpBodyParamInvalidTypeError extends HttpBadRequestError {
    constructor(expectedType: string) {
        super(`Invalid value for body. Must be a valid ${expectedType}.`);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, HttpBodyParamInvalidTypeError.prototype);
    }
}

export class HttpBodyParamValidationError extends HttpBadRequestError {
    constructor(validationError: ValidationError) {
        super(`Error request validating body: ` + validationError.toString());

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, HttpBodyParamValidationError.prototype);
    }
}