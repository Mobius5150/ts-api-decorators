import { ManagedApi as BaseManagedApi, IApiHandlerInstance, ApiMethod, readStreamToStringUtil, readStreamToStringUtilCb, parseApiMimeType, ApiStdHeaderName } from 'ts-api-decorators';
import * as Express from 'express';

export interface IExpressManagedApiContext {
	req: Express.Request;
	res: Express.Response;
}

export class ManagedApi {
	private api: BaseManagedApi<IExpressManagedApiContext> = new BaseManagedApi();

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
				bodyContents: (
				!!req.body
					? {
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
					req,
					res,
				},
			})
				.then(result => {
					res.status(result.statusCode).send(result.body);
				})
				.catch(e => next(e));
		};
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
		const headers = context.transportParams.req.header(name);
		if (typeof headers === 'string') {
			return [headers];
		}

		return headers;
	}

	public setHeader(name: string, value: string): void {
		const context = this.api.getExecutionContextInvocationParams();
		context.transportParams.res.header(name, value);
	}
}