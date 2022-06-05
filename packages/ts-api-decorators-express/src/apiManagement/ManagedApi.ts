import {
	ManagedApi as BaseManagedApi,
	IApiHandlerInstance,
	ApiMethod,
	readStreamToStringUtil,
	readStreamToStringUtilCb,
	parseApiMimeType,
	ApiStdHeaderName,
	ApiHeadersDict,
	ApiParamsDict,
	ManagedApiInternal,
	IApiInvocationResult,
	IApiInvocationParams
} from 'ts-api-decorators';
import * as Express from 'express';
import { ExpressMiddlewareArgument } from './ApiTypes';
import { ExpressMetadata } from '../metadata/ExpressMetadata';
import * as stream from 'stream';
import { StreamCoercionMode, StreamCoercer } from 'ts-api-decorators/dist/Util/StreamCoercer';
import { promisifyEvent } from 'ts-api-decorators/dist/Util/PromiseEvent';
import { IApiParamDefinition } from 'ts-api-decorators/dist/apiManagement/ApiDefinition';

export interface IExpressManagedApiContext {
	'express.request': Express.Request;
	'express.response': Express.Response;
}

export class ManagedApi extends BaseManagedApi<IExpressManagedApiContext> {
	private pipeStreams: boolean = true;

	public passErrorsToExpress(pass: boolean): void {
		this.handleErrors = !pass;
	}

	public coerceStreamsMode(mode: StreamCoercionMode): void {
		this.streamCoercionMode = mode;
	}
	
	public init(): Express.Router {
		const handlers = this.initHandlers();

		// TODO: Options?
		const router = Express.Router();
		for (const handlerMethod of handlers) {
			const routes = handlerMethod[1];
			for (const route of routes) {
				const middlewares = this.getMiddlewareForRoute(route);
				switch (handlerMethod[0]) {
					case ApiMethod.GET:
						router.get(route[0], ...middlewares, this.getHandlerWrapper(route[1]));
						break;

					case ApiMethod.POST:
						router.post(route[0], ...middlewares, this.getHandlerWrapper(route[1]));
						break;

					case ApiMethod.PUT:
						router.put(route[0], ...middlewares, this.getHandlerWrapper(route[1]));
						break;

					case ApiMethod.DELETE:
						router.delete(route[0], ...middlewares, this.getHandlerWrapper(route[1]));
						break;
				}
			}
		}

		return router;
	}

	private getMiddlewareForRoute(route: [string, IApiHandlerInstance<IExpressManagedApiContext>]) {
		const instance = this;
		return ManagedApiInternal.GetApiModifierDefinitionsOnObject<ExpressMiddlewareArgument>(route[1].parent.constructor, route[1].handlerKey)
			.map(d => {
				if (d.arguments.wrapPromise) {
					return async function (req: Express.Request, res: Express.Response, next: Express.NextFunction) {
						try {
							await d.arguments.middleware.apply(this, arguments);
						} catch (e) {
							try {
								instance.expressResultHandler(res, instance.getErrorResponseForException(e));
							} catch (e2) {
								next(e2);
							}
						}
					}
				}
				
				return d.arguments.middleware;
			});
	}

	private getHandlerWrapper(instance: IApiHandlerInstance<IExpressManagedApiContext>) {
		return (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
			try {
				const contentType = req.header(ApiStdHeaderName.ContentType);
				const contentLength = req.header(ApiStdHeaderName.ContentLength);
				const invocationParams = {
					queryParams: this.getRequestQueryParams(req),
					pathParams: this.getRequestPathParams(req),
					headers: this.getRequestHeaderParams(req),
					bodyContents: (
						(typeof contentType !== 'undefined' && Number(contentLength) > 0)
							?
							{
								contentsStream: req,
								// TODO: Add text encoding?
								readStreamToStringAsync: readStreamToStringUtil(req),
								readStreamToStringCb: readStreamToStringUtilCb(req),
								streamContentsMimeRaw: contentType,
								streamContentsMimeType: parseApiMimeType(contentType),
							}
							: undefined
					),
					transportParams: {
						[ExpressMetadata.TransportTypeRequestParam]: req,
						[ExpressMetadata.TransportTypeResponseParam]: res,
						[ExpressMetadata.TransportTypeRequestUserParam]: (<any>req)?.user,
					},
				};

				// TODO: Need to properly parse the body based on the content length
				instance.wrappedHandler(invocationParams)
					.then(result => this.expressResultHandler(res, result))
					.catch(e => {
						next(e);
					});
			} catch (e) {
				next(e);
			}
		};
	}

	protected getStreamForOutput(def: IApiParamDefinition, invocationParams: IApiInvocationParams<IExpressManagedApiContext>): stream.Writable {
		// Return express.response which implements stream.Writable and saves some intermediary streams
		return invocationParams.transportParams['express.response'];
	}

	public setResponseStatus(status: number): void {
		super.setResponseStatus(status);
		this.getExecutionContext().invocationParams.transportParams['express.response'].status(status);
	}

	private async expressResultHandler(res: Express.Response, result: IApiInvocationResult): Promise<void> {
		if (!res.writableEnded) {
			if (result.streamMode !== StreamCoercionMode.None) {
				res.status(result.statusCode);

				if (res !== result.body) {
					const pipeBody = StreamCoercer.CoerceWith(result.body, result.streamMode);
					let error: any;
					pipeBody.on('error', function (e) {
						error = e;
					});
					
					let finishPromise = promisifyEvent(pipeBody, 'end');
					pipeBody.pipe(res, { end: true, });
					await finishPromise;
					if (error) {
						throw error;
					}
				}
			} else if (result.body) {
				res.status(result.statusCode).send(result.body);
			} else {
				res.sendStatus(result.statusCode);
			}
		}
	}

	private getRequestHeaderParams(req: Express.Request): ApiHeadersDict {
		// Headers must be returned with keys lowercased, but the express framework does this already
		return req.headers;
	}

	private getRequestQueryParams(req: Express.Request): ApiParamsDict {
		const queryParams: ApiParamsDict = {};
		for (const query in req.query) {
			const queryVal = req.query[query];
			if (typeof queryVal !== 'string') {
				throw new Error('Unsupported query parameter type');
			}

			queryParams[query] = queryVal;
		}

		return queryParams;
	}

	private getRequestPathParams(req: Express.Request): ApiParamsDict {
		const pathParams: ApiParamsDict = {};
		for (const param in req.params) {
			const paramVal = req.params[param];
			switch (typeof paramVal) {
				case 'string':
					pathParams[param] = paramVal;
					break;

				case 'undefined':
					break;

				default:
					throw new Error('Unsupported path parameter type');
			}
		}

		return pathParams;
	}

	public setHeader(name: string, value: string): void {
		const context = this.getExecutionContext();
		context.result.headers[name] = value;
		context.invocationParams.transportParams['express.response'].header(name, value);
	}

	/**
	 * Sets the value of a header in the current response
	 * @param name The name of the header to set. Case insensitive.
	 * @param value The value of the header to set
	 */
	public static setHeader(name: string, value: string): void {
		const context = this.getExecutionContext();
		context.result.headers[name] = value;
		context.invocationParams.transportParams['express.response'].header(name, value);
	}

	/**
	 * Sets the HTTP status code for the response
	 * @param status The HTTP status code to return in the request
	 */
	 public static setResponseStatus(status: number): void {
		const context = this.getExecutionContext();
		context.result.statusCode = status;
	}
}