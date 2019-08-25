import { ApiGetMethodReturnType } from "ts-api-decorators";
import { ApiMethodReturnType } from "ts-api-decorators/dist/apiManagement/ApiDefinition";
import { ApplicationRequestHandler } from "express-serve-static-core";

export function ApiExpressMiddleware(...handlers: ApplicationRequestHandler<Express.Application>[]) {
	return (
		target: object,
		propertyKey: string,
		descriptor: TypedPropertyDescriptor<(...args: any[]) => any>
	) => {
		// TODO: This decorator will allow users to specify express middleware to execute before a handler
		throw new Error('Not implemented');
	}
}