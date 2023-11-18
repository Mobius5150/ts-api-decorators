import {
	ManagedApi as BaseManagedApi,
	IApiHandlerInstance,
	ApiMethod,
	ApiHeadersDict,
	IApiInvocationParams,
	IApiInvocationResult,
	ManagedApiInternal,
	HttpError
} from 'ts-api-decorators';
import { AzureFunctionHandlerFunc, IAzureFunctionsTimer } from "./AzureFunctionTypes";
import { HttpBindingTriggerFactory } from "../generators/Bindings/HttpBinding";
import { AzFuncBinding, AzFuncBindingNameReturn } from "../metadata/AzFuncBindings";
import { TimerBindingTriggerFactory } from "../generators/Bindings/TimerBinding";
import { BlobStorageBindingTriggerFactory } from "../generators/Bindings/BlobStorageBinding";
import { IAzureStorageBlobProperties } from "../decorators";
import { IApiProcessor } from "ts-api-decorators/dist/apiManagement/ApiProcessing/ApiProcessing";
import { getMetadataValueByDescriptor } from "ts-api-decorators/dist/transformer/TransformerMetadata";
import { AzFuncArgumentExtractors } from "../decorators/ArgumentExtractors";
import { InvocationContext as Context, InvocationContext } from '@azure/functions';

export function registerApiProcessorsOnHandler(handlerMethod: object, processors: IApiProcessor<IApiInvocationParams<IAzureFunctionManagedApiContext> | IApiInvocationResult>[]): void {
	ManagedApiInternal.AddApiProcessorsToObject(processors, handlerMethod);
}

export interface IAzureFunctionManagedApiContext {
	
	context: Context;
	timer?: IAzureFunctionsTimer;
	inputBlob?: Buffer;
	inputBlobProps?: IAzureStorageBlobProperties;
}

export interface IAzureFunctionTriggerDescriptor {
	triggerType: string,
	route: string,
	methods: string[],
}

export class ManagedApi extends BaseManagedApi<IAzureFunctionManagedApiContext> {
	private static readonly SINGLETON_KEY = Symbol.for("MB.ts-api-decorators-azure-function.ManagedApi");
	private initialized: boolean = false;
	private handlers: Map<ApiMethod, Map<string, IApiHandlerInstance<IAzureFunctionManagedApiContext>>>;

	private constructor() {
		super(true);
	}

	private static GetSingleton(): ManagedApi {
		const globalSymbols = Object.getOwnPropertySymbols(global);
		const keyDefined = (globalSymbols.indexOf(ManagedApi.SINGLETON_KEY) > -1);
		if (!keyDefined) {
			global[ManagedApi.SINGLETON_KEY] = {
				managedApi: new ManagedApi(),
			};
		}

		return global[ManagedApi.SINGLETON_KEY].managedApi;
	}
	
	public static AzureTrigger(descr: IAzureFunctionTriggerDescriptor): AzureFunctionHandlerFunc {
		const singleton = ManagedApi.GetSingleton();
		return async (context: Context): Promise<void> => {
			try {
				if (!singleton.initialized) {
					await singleton.init();
				}

				const {method, invocationParams} = singleton.resolveInvocationParamsForContext(descr.triggerType, context);
				if (!descr.methods.find(m => m === method)) {
					throw new Error(`Invalid method for handler: ${method}`);
				}
				
				const handler = singleton.getHandler(method, descr.route);
				const result = await handler.wrappedHandler(invocationParams);
				if (!context && result.statusCode >= 300) {
					// TODO: Need to handle error responses in non-http functions
					if (typeof result.body === 'string') {
						throw new HttpError(result.body, result.statusCode);
					}

					throw new HttpError('Unknown Error', result.statusCode);
				}

				for (const bindingDef of context.bindingDefinitions) {
					if (bindingDef.direction !== 'out') {
						continue;
					}

					let assignValue = result.body;
					if (bindingDef.name === AzFuncBindingNameReturn) {
						assignValue = result.body
					} else if (typeof result.body[bindingDef.name] === 'undefined') {
						throw new Error(`Could not find output binding ${bindingDef.name} of type ${bindingDef.type} on result`);
					} else {
						assignValue = result.body[bindingDef.name];
					}

					if (bindingDef.type === 'http') {
						context.res = {
							status: result.statusCode,
							body: assignValue,
							headers: this.getHeadersObject(result.headers),
						};
					} else {
						context.bindings[bindingDef.name] = assignValue;
					}
				}
			} catch (e) {
				const response = {
					status: 500,
					body: { message: 'Internal server error' }
				};
	
				if (e.statusCode) {
					response.status = e.statusCode;
				}
	
				if (e.message) {
					response.body.message = e.message;
				}
	
				if (response.status === 500) {
					debugger;
				}
	
				context.res = response;
			}
		};
	}

	static getHeadersObject(headers: ApiHeadersDict): { [header: string]: string; } {
		if (!headers) {
			return {};
		}

		const responseHeaders: { [header: string]: string } = {};
		for (const header in Object.keys(headers)) {
			const origHeader = headers[header];
			if (typeof origHeader === 'string') {
				responseHeaders[header] = origHeader;
			} else if (Array.isArray(origHeader)) {
				responseHeaders[header] = origHeader.join(', ');
			} else {
				throw new Error('Could not serialize response headers');
			}
		}

		return responseHeaders;
	}
	
	private getHandler(method: ApiMethod, route: string) {
		if (!this.handlers.has(method)) {
			throw new Error(`Could not find handler with API method: ${method}`);
		}

		const methodGroup = this.handlers.get(method);
		if (!methodGroup.has(route)) {
			throw new Error(`Could not find handler for route: ${route}`);
		}

		return methodGroup.get(route);
	}
	
	private resolveInvocationParamsForContext(triggerType: string, context: Context): { method: ApiMethod, invocationParams: IApiInvocationParams<IAzureFunctionManagedApiContext> } {
		switch (triggerType) {
			case AzFuncBinding.HttpTrigger:
				return HttpBindingTriggerFactory.GetInvocationParams(context);

			case AzFuncBinding.TimerTrigger:
				return TimerBindingTriggerFactory.GetInvocationParams(context);

			case AzFuncBinding.BlobTrigger:
				return BlobStorageBindingTriggerFactory.GetInvocationParams(context);

			default:
				throw new Error(`Unknown Azure trigger type: ${triggerType}`);
		}
	}

	private async init(): Promise<void> {
		this.handlers = this.initHandlers();
		this.initialized = true;
	}

	private getHandlerWrapper(instance: IApiHandlerInstance<IAzureFunctionManagedApiContext>) {
		throw new Error('Method Not Implemented');
	}

	public setHeader(name: string, value: string): void {
		throw new Error('Method Not Implemented');
	}
}