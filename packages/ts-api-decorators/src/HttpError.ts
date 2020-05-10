export class HttpError<T extends object = {}> extends Error {
    public responseBody: {
        message: string;
    } & T;
    constructor(m: string, public readonly statusCode: number, bodyContents: T = <T>{}) {
        super(m);
        this.responseBody = {
            message: m,
            ...bodyContents,
        };
        // Set the prototype explicitly.
        Object.setPrototypeOf(this, HttpError.prototype);
    }
}
