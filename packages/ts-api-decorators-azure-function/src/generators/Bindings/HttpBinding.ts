import { IBindingTrigger, IHttpTriggerBinding } from "./Bindings";
import { ApiMethod, ManagedApi } from "ts-api-decorators";
import { IExtractedApiDefinitionWithMetadata } from "ts-api-decorators/dist/transformer/ExtractionTransformer";
import { AzureFunctionParams } from "../..";

export  class HttpBindingTriggerFactory {
	public static GetBindingForMethod(method: ApiMethod): IBindingTrigger {
		return {
			methodType: method,
			getTriggerForRoute: route => ([
				// Input trigger binding
				{
					type: 'httpTrigger',
					direction: 'in',
					name: AzureFunctionParams.TransportTypeRequestParam,
					route: HttpBindingTriggerFactory.RewriteRouteForAzureFunction(route.route),
					methods: [ route.method.toLowerCase() ],
					// TODO: authLevel
				},

				// Outupt binding
				{
					type: 'http',
					direction: 'out',
					name: AzureFunctionParams.TransportTypeResponseParam,
				}
			]),
		};
	}

	public static RewriteRouteForAzureFunction(route: string): string {
		return ManagedApi.GetRouteTokens(route)
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
			.join('');
	}
}