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
	ManagedApiInternal
} from 'ts-api-decorators';
import * as Express from 'express';
import { ExpressMiddlewareArgument } from './ApiTypes';

export interface IExpressManagedApiContext {
	'express.request': Express.Request;
	'express.response': Express.Response;
}

export class ManagedApi extends BaseManagedApi<IExpressManagedApiContext> {
	public init(): Express.Router {
		const handlers = this.initHandlers();

		// TODO: Options?
		const router = Express.Router();
		for (const handlerMethod of handlers) {
			const routes = handlerMethod[1];
			for (const route of routes) {
				const middlewares = 
					ManagedApiInternal.GetApiModifierDefinitionsOnObject<ExpressMiddlewareArgument>(
						route[1].parent.constructor, route[1].handlerKey)
						.map(d => d.arguments.middleware);

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

	private getHandlerWrapper(instance: IApiHandlerInstance<IExpressManagedApiContext>) {
		return (req: Express.Request, res: Express.Response, next: Function) => {
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
						'express.request': req,
						'express.response': res,
					},
				};

				// TODO: Need to properly parse the body based on the content length
				instance.wrappedHandler(invocationParams)
					.then(result => {
						if (!res.writableEnded) {
							if (result.body) {
								res.status(result.statusCode).send(result.body);
							} else {
								res.sendStatus(result.statusCode);
							}
						}

						this.clearInvocationParams(invocationParams);
					})
					.catch(e => {
						this.clearInvocationParams(invocationParams);
						next(e);
					});
			} catch (e) {
				next(e);
			}
		};
	}

	private clearInvocationParams(invocationParams: object): void {
		const keys = Object.keys(invocationParams);
		for (const key of keys) {
			delete invocationParams[key];
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
		const context = this.getExecutionContextInvocationParams();
		context.transportParams['express.response'].header(name, value);
	}
}