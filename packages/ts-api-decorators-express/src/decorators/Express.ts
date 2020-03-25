import { ManagedApiInternal, Api } from "ts-api-decorators";
import { ApiParamType } from "ts-api-decorators/dist/apiManagement/ApiDefinition";
import { ApplicationRequestHandler } from "express-serve-static-core";
import { __ApiParamArgs, InternalTypeUtil } from "ts-api-decorators/dist/apiManagement/InternalTypes";
import { ApiDecorator, DecoratorParentNameDependency } from "ts-api-decorators/dist/decorators/DecoratorUtil";
import { HandlerMethodParameterDecorator } from "ts-api-decorators/dist/transformer/HandlerMethodParameterDecorator";
import { ExpressMetadata } from "../metadata/ExpressMetadata";

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

export abstract class ExpressParams {
	public static readonly TransportTypeRequestParam = 'express.request';
	public static readonly TransportTypeResponseParam = 'express.response';

	public static ExpressApiRequestParam(): ParameterDecorator;
	@ApiDecorator(HandlerMethodParameterDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		parameterType: ApiParamType.Transport,
		parameterTypeRestrictions: [
			InternalTypeUtil.TypeAnyObject,
		],
		provider: ExpressMetadata.Component,
		arguments: [],
		transportTypeId: ExpressParams.TransportTypeRequestParam,
	})
	public static ExpressApiRequestParam(a?: any): ParameterDecorator {
		return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
			const args = <__ApiParamArgs>a;
			ManagedApiInternal.AddApiHandlerParamMetadataToObject(
				{
					args,
					parameterIndex,
					propertyKey,
					type: ApiParamType.Transport,
					transportTypeId: ExpressParams.TransportTypeRequestParam,
				},
				target.constructor);
		}
	}

	public static ExpressApiResponseParam(): ParameterDecorator;
	@ApiDecorator(HandlerMethodParameterDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		parameterType: ApiParamType.Transport,
		parameterTypeRestrictions: [
			InternalTypeUtil.TypeAnyObject,
		],
		provider: ExpressMetadata.Component,
		arguments: [],
		transportTypeId: ExpressParams.TransportTypeResponseParam,
	})
	public static ExpressApiResponseParam(a?: any): ParameterDecorator {
		return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
			const args = <__ApiParamArgs>a;
			ManagedApiInternal.AddApiHandlerParamMetadataToObject(
				{
					args,
					parameterIndex,
					propertyKey,
					type: ApiParamType.Transport,
					transportTypeId: ExpressParams.TransportTypeResponseParam,
				},
				target.constructor);
		}
	}
}

export const ExpressApiRequestParam = ExpressParams.ExpressApiRequestParam;
export const ExpressApiResponseParam = ExpressParams.ExpressApiResponseParam;