import { ValidationError } from "jsonschema";

export class HttpError<T extends object = {}> extends Error {
    public responseBody: { message: string } & T;

    constructor(m: string, public readonly statusCode: number, bodyContents: T) {
        super(m);
        this.responseBody = {
            message: m,
            ...bodyContents,
        };

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, HttpError.prototype);
    }
}

export class HttpNotFoundError extends HttpError {
    constructor(m: string = 'Resource not found') {
        super(m, 404, {});

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, HttpNotFoundError.prototype);
    }
}

export class HttpBadRequestError extends HttpError {
    constructor(m: string = 'Bad request') {
        super(m, 400, {});

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, HttpBadRequestError.prototype);
    }
}

export class HttpRequiredQueryParamMissingError extends HttpBadRequestError {
    constructor(queryParamName: string) {
        super(`Missing required query parameter '${queryParamName}'`);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, HttpRequiredQueryParamMissingError.prototype);
    }
}

export class HttpRequiredBodyParamMissingError extends HttpBadRequestError {
    constructor() {
        super(`Missing request body`);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, HttpRequiredBodyParamMissingError.prototype);
    }
}

export class HttpQueryParamInvalidTypeError extends HttpBadRequestError {
    constructor(queryParamName: string, expectedType: string) {
        super(`Invalid value for query parameter '${queryParamName}'. Must be a valid ${expectedType}.`);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, HttpQueryParamInvalidTypeError.prototype);
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