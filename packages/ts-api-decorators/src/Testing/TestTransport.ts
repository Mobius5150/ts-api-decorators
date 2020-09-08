import { ManagedApi as BaseManagedApi, IApiHandlerInstance, ApiMethod, ApiHeadersDict, ApiParamsDict, IApiInvocationResult, IApiBodyContents } from '..';
import { CollectionUtil } from '../Util/CollectionUtil';
import * as p2r from 'path-to-regexp';
import { StreamCoercionMode } from '../Util/StreamCoercer';

export interface ITestManagedApiContext {
}

export interface IApiCallInterface {
	invokeApiCall(method: ApiMethod, route: string, params: ITestApiInvocationParams): Promise<IApiInvocationResult>;
	getHandlerInstance(method: ApiMethod, route: string): {matchResult: p2r.Match<ApiParamsDict>, instance: IApiHandlerInstance<ITestManagedApiContext>};
}

export interface ITestApiInvocationParams {
	queryParams: ApiParamsDict;
	headers: ApiHeadersDict;
	bodyContents?: Partial<IApiBodyContents>;
	transportParams: ITestManagedApiContext;
}

interface ITestHandler extends IApiHandlerInstance<ITestManagedApiContext> {
	matchFunc: p2r.MatchFunction<ApiParamsDict>;
	route: string;
}

type TestHandlerMap = Map<ApiMethod, Set<ITestHandler>>;

export class TestManagedApi extends BaseManagedApi<ITestManagedApiContext> implements IApiCallInterface {
	private handlers: TestHandlerMap = new Map();

	public init(): IApiCallInterface {
		const handlers = this.initHandlers();
		for (const [method, routes] of handlers) {
			for (const [route,instance] of routes) {
				CollectionUtil.addToMapSet(
					this.handlers,
					method,
					{
						route,
						matchFunc: p2r.match(route),
						...instance,
					},
				);
			}
		}

		return this;
	}

	public async invokeApiCall(method: ApiMethod, route: string, params: ITestApiInvocationParams): Promise<IApiInvocationResult> {
		const result = this.getHandlerInstance(method, route);
		if (!result) {
			return this.getResponse(404);
		}

		return result.instance.wrappedHandler({
			...params,
			pathParams: result.matchResult.params,
			bodyContents: (
				params.bodyContents
				?
					{
						contentsStream: this.underfinedOrNull(params.bodyContents.contentsStream),
						readStreamToStringAsync: this.underfinedOrNull(params.bodyContents.readStreamToStringAsync),
						readStreamToStringCb: this.underfinedOrNull(params.bodyContents.readStreamToStringCb),
						streamContentsMimeRaw: this.underfinedOrNull(params.bodyContents.streamContentsMimeRaw),
						streamContentsMimeType: this.underfinedOrNull(params.bodyContents.streamContentsMimeType),
						parsedBody: params.bodyContents.parsedBody,
					}
				: undefined
			),
		});
	}

	private underfinedOrNull<T>(val: T | undefined): T | null {
		return typeof val === 'undefined' ? null : val;
	}

	public getHandlerInstance(method: ApiMethod, route: string): { matchResult: p2r.MatchResult<ApiParamsDict>; instance: IApiHandlerInstance<ITestManagedApiContext>; } | undefined {
		if (!this.handlers.has(method)) {
			return;
		}

		for (const instance of this.handlers.get(method)) {
			let matchResult = instance.matchFunc(route);
			if (!matchResult) {
				continue;
			}

			return { matchResult, instance };
		}
	}

	private getResponse(code: number, description: string = ''): IApiInvocationResult | PromiseLike<IApiInvocationResult> {
		return {
			streamMode: StreamCoercionMode.None,
			statusCode: code,
			body: description,
			headers: {},
		};
	}

	public setHeader(name: string, value: string): void {
		throw new Error('NotImplemented');
	}
}