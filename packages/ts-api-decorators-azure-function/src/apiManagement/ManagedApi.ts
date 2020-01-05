import {
	ManagedApi as BaseManagedApi,
	IApiHandlerInstance,
	ApiMethod,
	readStreamToStringUtil,
	readStreamToStringUtilCb,
	parseApiMimeType,
	ApiStdHeaderName,
	ClassConstructor,
	ApiHeadersDict,
	ApiParamsDict
} from 'ts-api-decorators';

export interface IAzureFunctionManagedApiContext {
}

export class ManagedApi extends BaseManagedApi<IAzureFunctionManagedApiContext> {
	public init(): void {
		throw new Error('Method Not Implemented');
		// const handlers = this.initHandlers();

		// // TODO: Options?
		// const router = Express.Router();
		// for (const handlerMethod of handlers) {
		// 	const routes = handlerMethod[1];
		// 	for (const route of routes) {
		// 		switch (handlerMethod[0]) {
		// 			case ApiMethod.GET:
		// 				router.get(route[0], this.getHandlerWrapper(route[1]));
		// 				break;

		// 			case ApiMethod.POST:
		// 				router.post(route[0], this.getHandlerWrapper(route[1]));
		// 				break;

		// 			case ApiMethod.PUT:
		// 				router.put(route[0], this.getHandlerWrapper(route[1]));
		// 				break;

		// 			case ApiMethod.DELETE:
		// 				router.delete(route[0], this.getHandlerWrapper(route[1]));
		// 				break;
		// 		}
		// 	}
		// }

		// return router;
	}

	private getHandlerWrapper(instance: IApiHandlerInstance<IAzureFunctionManagedApiContext>) {
		throw new Error('Method Not Implemented');
	}

	public setHeader(name: string, value: string): void {
		throw new Error('Method Not Implemented');
	}
}