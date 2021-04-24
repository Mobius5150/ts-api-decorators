import { IBindingTrigger, IHttpTriggerBinding } from "./Bindings";
import { ApiMethod, ManagedApi, IApiInvocationParams, ApiStdHeaderName, parseApiMimeType } from "ts-api-decorators";
import { AzureFunctionParams, IAzureFunctionManagedApiContext } from "../..";
import { Context } from "@azure/functions";
import { trimLeft } from "../../Util/TrimLeft";
import { AzFuncBinding, AzFuncBindingNameReturn } from "../../metadata/AzFuncBindings";

export class HttpBindingTriggerFactory {
	public static GetBindingForMethod(method: ApiMethod): IBindingTrigger {
		return {
			triggerMethod: method,
			triggerType: AzFuncBinding.HttpTrigger,
			getBindingForRoutes: routes => ([
				// Input trigger binding
				{
					type: AzFuncBinding.HttpTrigger,
					direction: 'in',
					name: AzureFunctionParams.TransportTypeRequestParam,
					route: HttpBindingTriggerFactory.RewriteRouteForAzureFunction(routes[0].route),
					methods: routes.map(r => r.apiMethod.toLowerCase()),
					// TODO: authLevel
				},

				// Output binding
				{
					type: 'http',
					direction: 'out',
					name: AzFuncBindingNameReturn,
				}
			])
		};
	}

	private static GetMethodForRequestContext(context: Context): ApiMethod {
		switch (context.req.method.toUpperCase()) {
			case ApiMethod.GET:
				return ApiMethod.GET;
			case ApiMethod.DELETE:
				return ApiMethod.DELETE;
			case ApiMethod.POST:
				return ApiMethod.POST;
			case ApiMethod.PUT:
				return ApiMethod.PUT;

			default:
				throw new Error(`Unknown http request method: ${context.req.method}`);
		}
	}

	public static GetInvocationParams(context: Context): { method: ApiMethod, invocationParams: IApiInvocationParams<IAzureFunctionManagedApiContext> } {
		if (!context.req) {
			throw new Error('Context does not have http req');
		}

		const method = this.GetMethodForRequestContext(context);
		const contentType = this.getHeader(context.req.headers, ApiStdHeaderName.ContentType);
		const contentLength = this.getHeader(context.req.headers, ApiStdHeaderName.ContentLength);
		return {
			method,
			invocationParams: {
				queryParams: context.req.query,
				pathParams: context.req.params,
				headers: context.req.headers,
				bodyContents: (
					(typeof contentType !== 'undefined' && Number(contentLength) > 0)
						?
						{
							contentsStream: context.req.body,
							// TODO: Add text encoding?
							readStreamToStringAsync: () => context.req.rawBody,
							readStreamToStringCb: (cb: (err: any, str: string) => void) => cb(null, context.req.rawBody),
							streamContentsMimeRaw: contentType,
							streamContentsMimeType: parseApiMimeType(contentType),
						}
						: undefined
				),
				transportParams: {
					context,
				},
			}
		};
	}

	private static getHeader(headers: { [key: string]: string; }, headerName: string): string {
		headerName = headerName.toLowerCase();
		return headers[headerName];
	}

	public static RewriteRouteForAzureFunction(route: string): string {
		return trimLeft(
			ManagedApi.GetRouteTokens(route)
				.map(t => {
					if (typeof t === 'string') {
						return t;
					}

					let outStr = t.prefix ? t.prefix : '';
					if (t.modifier && t.modifier !== '?') {
						console.warn('Unhandled modifier: ' + t.modifier);
					}
					outStr += `{${t.name}:regex(${t.pattern})${t.modifier ? t.modifier : ''}}`;
					if (t.suffix) {
						outStr += t.suffix;
					}
					return outStr;
				})
				.join('')
			, '/');
	}
}