import { ManagedApiInternal, Api, ApiMethodDecoratorReturnType } from "ts-api-decorators";
import { ApiParamType } from "ts-api-decorators/dist/apiManagement/ApiDefinition";
import { __ApiParamArgs, InternalTypeUtil } from "ts-api-decorators/dist/apiManagement/InternalTypes";
import { ApiDecorator, DecoratorParentNameDependency, ApiMethodDecoratorGetFunction, DecoratorPeerDependency } from "ts-api-decorators/dist/decorators/DecoratorUtil";
import { HandlerMethodParameterDecorator } from "ts-api-decorators/dist/transformer/HandlerMethodParameterDecorator";
import { ExpressMetadata } from "../metadata/ExpressMetadata";
import { HandlerMethodModifierDecorator } from "ts-api-decorators/dist/transformer/HandlerMethodModifierDecorator";
import * as Express from 'express';
import { ExpressArgumentExtractors } from "../metadata/ExpressArgumentExtractors";
import { ExpressMiddlewareArgument } from "../apiManagement/ApiTypes";

abstract class ExpressParams {
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
		transportTypeId: ExpressMetadata.TransportTypeRequestParam,
		skipOutputTypeDefinitions: true,
		transformArgumentsToObject: false,
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
					transportTypeId: ExpressMetadata.TransportTypeRequestParam,
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
		transportTypeId: ExpressMetadata.TransportTypeResponseParam,
		skipOutputTypeDefinitions: true,
		transformArgumentsToObject: false,
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
					transportTypeId: ExpressMetadata.TransportTypeResponseParam,
				},
				target.constructor);
		}
	}

	public static ExpressApiRequestUserParam(): ParameterDecorator;
	@ApiDecorator(HandlerMethodParameterDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		parameterType: ApiParamType.Transport,
		parameterTypeRestrictions: [
			InternalTypeUtil.TypeAny,
		],
		provider: ExpressMetadata.Component,
		arguments: [],
		transportTypeId: ExpressMetadata.TransportTypeRequestUserParam,
		skipOutputTypeDefinitions: true,
		transformArgumentsToObject: true,
	})
	public static ExpressApiRequestUserParam(a?: any): ParameterDecorator {
		return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
			const args = <__ApiParamArgs>a;
			ManagedApiInternal.AddApiHandlerParamMetadataToObject(
				{
					args,
					parameterIndex,
					propertyKey,
					type: ApiParamType.Transport,
					transportTypeId: ExpressMetadata.TransportTypeRequestUserParam,
				},
				target.constructor);
		}
	}
}

class ExpressModifiers {
	/**
	 * Adds in standard request middleware ahead of execution of the request handler.
	 * @param middleware The middleware function to add
	 * @param wrapPromiseForErrors If `middleware` is a Promise-like function, `true` will cause errors thrown to be handled gracefully.
	 */
	public static ExpressApiMiddleware(middleware: Express.Handler, wrapPromiseForErrors?: boolean): ApiMethodDecoratorReturnType<any>;
	@ApiDecorator(HandlerMethodModifierDecorator, {
		indexTs: __filename,
		dependencies: [
			DecoratorParentNameDependency(Api.name),
			// TODO peer dependency
		],
		provider: ExpressMetadata.Component,
		arguments: [
			ExpressArgumentExtractors.MiddlewareArgument,
			ExpressArgumentExtractors.OptionalWrapPromiseArgument,
		],
		transformArgumentsToObject: false,
	})
	public static ExpressApiMiddleware(middleware: Express.Handler, wrapPromise: boolean = false): ApiMethodDecoratorReturnType<any> {
		return (
			target: object,
			propertyKey: string,
			descriptor: TypedPropertyDescriptor<any>
		) => {
			ManagedApiInternal.AddApiModifierMetadataToObject(
				{
					propertyKey,
					arguments: <ExpressMiddlewareArgument>{
						middleware,
						wrapPromise,
					},
					metadata: ExpressMetadata.MiddlewareArgument,
				}, target.constructor);
		}
	}
}

export const GetExpressApiModifierDecorator = ApiMethodDecoratorGetFunction<HandlerMethodModifierDecorator>(ExpressModifiers);
export const GetExpressApiParamDecorator = ApiMethodDecoratorGetFunction<HandlerMethodParameterDecorator>(ExpressParams);

export const ExpressApiRequestParam = ExpressParams.ExpressApiRequestParam;
export const ExpressApiRequestUserParam = ExpressParams.ExpressApiRequestUserParam;
export const ExpressApiResponseParam = ExpressParams.ExpressApiResponseParam;
export const ExpressApiMiddleware = ExpressModifiers.ExpressApiMiddleware;