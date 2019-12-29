import { ManagedApi as BaseManagedApi, IApiHandlerInstance, ApiMethod, readStreamToStringUtil, readStreamToStringUtilCb, parseApiMimeType, ApiStdHeaderName, ClassConstructor, ApiHeadersDict } from 'ts-api-decorators';
import * as Express from 'express';

export interface IExpressManagedApiContext {
	'express.request': Express.Request;
	'express.response': Express.Response;
}

export class ManagedApi {
	private api: BaseManagedApi<IExpressManagedApiContext>;

	public constructor(
		useGlobal?: boolean,
	) {
		this.api = new BaseManagedApi(useGlobal);
	}

	public addHandlerClass(constructor: ClassConstructor) {
		this.api.addHandlerClass(constructor);
	}

	public init(): Express.Router {
		const handlers = this.api.initHandlers();

		// TODO: Options?
		const router = Express.Router();
		for (const handlerMethod of handlers) {
			const routes = handlerMethod[1];
			for (const route of routes) {
				switch (handlerMethod[0]) {
					case ApiMethod.GET:
						router.get(route[0], this.getHandlerWrapper(route[1]));
						break;

					case ApiMethod.POST:
						router.post(route[0], this.getHandlerWrapper(route[1]));
						break;

					case ApiMethod.PUT:
						router.put(route[0], this.getHandlerWrapper(route[1]));
						break;

					case ApiMethod.DELETE:
						router.delete(route[0], this.getHandlerWrapper(route[1]));
						break;
				}
			}
		}

		return router;
	}
	
	private getHandlerWrapper(instance: IApiHandlerInstance<IExpressManagedApiContext>) {
		return (req: Express.Request, res: Express.Response, next: Function) => {
			const contentType = req.header(ApiStdHeaderName.ContentType);
			const contentLength = req.header(ApiStdHeaderName.ContentLength);
			// TODO: Need to properly parse the body based on the content length
			instance.wrappedHandler({
				queryParams: this.getRequestQueryParams(req),
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
			})
				.then(result => {
					res.status(result.statusCode).send(result.body);
				})
				.catch(e => {
					next(e)
				});
		};
	}
	
	private getRequestHeaderParams(req: Express.Request): ApiHeadersDict {
		// Headers must be returned with keys lowercased, but the express framework does this already
		return req.headers;
	}

	private getRequestQueryParams(req: Express.Request): { [param: string]: string; } {
		const queryParams: { [param: string]: string; } = {};
		for (const query in req.query) {
			const queryVal = req.query[query];
			if (typeof queryVal !== 'string') {
				throw new Error('Unsupported query parameter type');
			}

			queryParams[query] = queryVal;
		}

		return queryParams;
	}

	public getHeader(name: string): string[] | undefined {
		const context = this.api.getExecutionContextInvocationParams();
		const headers = context.transportParams['express.request'].header(name);
		if (typeof headers === 'string') {
			return [headers];
		}

		return headers;
	}

	public setHeader(name: string, value: string): void {
		const context = this.api.getExecutionContextInvocationParams();
		context.transportParams['express.response'].header(name, value);
	}
}