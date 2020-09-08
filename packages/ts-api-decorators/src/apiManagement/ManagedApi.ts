import { ManagedApiInternal, IApiClassDefinition } from "./ManagedApiInternal";
import { IApiDefinition, ApiMethod, IApiParamDefinition, ApiParamType, IApiTransportTypeParamDefinition, IApiDefinitionWithProcessors, IApiProcessors, ApiRawBodyParamType } from "./ApiDefinition";
import { createNamespace, getNamespace, Namespace } from 'cls-hooked';
import { HttpRequiredQueryParamMissingError, HttpQueryParamInvalidTypeError, HttpRequiredBodyParamMissingError, HttpBodyParamInvalidTypeError, HttpBodyParamValidationError, HttpRequiredTransportParamMissingError, HttpRequiredHeaderParamMissingError, HttpRegexParamInvalidTypeError, HttpParamInvalidError, HttpNumberParamOutOfBoundsError, HttpRequiredPathParamMissingError, HttpEnumParamInvalidValueError, HttpTransportConfigurationError, HttpUnsupportedMediaTypeError } from "../Errors";
import { HttpError } from "../HttpError";
import { Readable } from "stream";
import { ApiMimeType } from "./MimeTypes";
import { __ApiParamArgs } from "./InternalTypes";
import { Validator as JsonSchemaValidator } from 'jsonschema';
import { PromiseCallbackHelper } from "./CallbackPromiseHelper";
import * as p2r from 'path-to-regexp';
import { ApiDependencyCollection, ApiDependency } from "./ApiDependency";
import { ClassConstructor } from "../Util/ClassConstructors";
import { ApiProcessorTime } from "./ApiProcessing/ApiProcessing";
import { Func, OptionalAsyncFunc1 } from "../Util/Func";
import { StreamCoercionMode, StreamCoercer } from "../Util/StreamCoercer";
import { StreamIntermediary } from "../Util/StreamIntermediary";

export type ApiParamsDict = { [param: string]: string };
export type ApiHeadersDict = { [paramNameLowercase: string]: string | string[] };
export type ManagedApiPreInvokeHandlerType<TransportParamsType extends object> = OptionalAsyncFunc1<IApiInvocationContext<TransportParamsType>, IApiInvocationContext<TransportParamsType> | undefined>;
export type ManagedApiPostInvokeHandlerType<TransportParamsType extends object> = OptionalAsyncFunc1<IApiInvocationContextPostInvoke<TransportParamsType>, IApiInvocationResult | undefined>;

export interface IApiBodyContents {
	contentsStream: Readable;
	streamContentsMimeType: ApiMimeType;
	streamContentsMimeRaw: string;
	readStreamToStringAsync: () => Promise<string>;
	readStreamToStringCb: (cb: (err: any, contents?: string) => void) => void;
	parsedBody?: any;
	contentsString?: string;
}

export interface IApiInvocationParams<TransportParamsType extends object = {}> {
	queryParams: ApiParamsDict;
	pathParams: ApiParamsDict;
	headers: ApiHeadersDict;
	bodyContents?: IApiBodyContents;
	transportParams: TransportParamsType;
}

export interface IApiInvocationResult {
	streamMode: StreamCoercionMode;
	statusCode: number;
	body: string | object;
	headers: ApiHeadersDict;
}

export interface IApiInvocationContext<TransportParamsType extends object = {}> {
	apiDefinition: IApiDefinitionWithProcessors<TransportParamsType>;
	invocationParams: IApiInvocationParams<TransportParamsType>;
}

export interface IApiInvocationContextPostInvoke<TransportParamsType extends object = {}> extends IApiInvocationContext<TransportParamsType>{
	result: IApiInvocationResult;
}

export type WrappedApiHandler<TransportParamsType extends object> = (params: IApiInvocationParams<TransportParamsType>) => Promise<IApiInvocationResult>;

export interface RouteTokenKey {
	name: string | number;
	prefix: string;
	suffix: string;
	pattern: string;
	modifier: string;
}

export type RouteToken = string | RouteTokenKey;

export interface IApiHandlerInstance<TransportParamsType extends object> extends IApiDefinition {
	parent: object;
	wrappedHandler: WrappedApiHandler<TransportParamsType>;
	handlerArgs: IApiParamDefinition[];
	routeTokens: RouteToken[];
}

export abstract class ManagedApi<TransportParamsType extends object> {
	private static readonly ClsNamespace = 'ManagedApiNamespace';
	private static readonly ContextNamespace = 'context';
	public readonly HookHandlerPreInvoke = 'handler-preinvoke';
	public readonly HookHandlerPostInvoke = 'handler-postinvoke';

	private static apis = [];
	private static namespace: Namespace;

	private readonly jsonValidator: JsonSchemaValidator;

	private classes: IApiClassDefinition[];

	private readonly dependencies = new ApiDependencyCollection();

	protected readonly hooks: Map<string, Func[]> = new Map();

	protected handleErrors: boolean = true;

	protected streamCoercionMode: StreamCoercionMode = StreamCoercionMode.Any;

	public constructor(
		private readonly useGlobal: boolean = false
	) {
		if (!ManagedApi.namespace) {
			ManagedApi.namespace = getNamespace(ManagedApi.ClsNamespace);

			if (!ManagedApi.namespace) {
				ManagedApi.namespace = createNamespace(ManagedApi.ClsNamespace);
			}
		}
		
		this.classes = [];

		this.jsonValidator = new JsonSchemaValidator();

		this.addHook('handler-postinvoke', (h) => this.hook_checkStreamCoercionMode(h));
	}

	public addHandlerClass(constructor: ClassConstructor) {
		if (this.useGlobal) {
			throw new Error('addHandlerClass may only be used if ManagedApi is initialized with `useGlobal` = false');
		}

		this.dependencies.registerDependency(
			ApiDependency.WithConstructor(constructor));

		this.classes.push({
			constructor,
			handlers: ManagedApiInternal.GetHandlersForConstructor(constructor),
		});
	}

	/**
	 * Iniitalizes all API factories
	 * 
	 * TODO: Move to a helper class
	 */
	protected initHandlers() {
		if (this.useGlobal) {
			// Get the list of registered classes
			const globalClasses = ManagedApiInternal.GetRegisteredApiClassDefinitions()
				// Only get the ones that have handlers defined on them
				.filter(c => c.handlers.size > 0)

			for (const c of globalClasses) {
				this.dependencies.registerDependency(
					ApiDependency.WithConstructor(c.constructor));

				this.classes.push(c);
			}
		}

		// Initialize each class and build a master map of all API handlers
		const handlers = new Map<ApiMethod, Map<string, IApiHandlerInstance<TransportParamsType>>>();
		for (const handlerClass of this.classes) {
			const instance = this.instanstiateHandlerClass(handlerClass);
			for (const [handlerMethod, handlerMap] of handlerClass.handlers) {
				if (!handlers.has(handlerMethod)) {
					handlers.set(handlerMethod, new Map<string, IApiHandlerInstance<TransportParamsType>>());
				}

				const handlerMethodCollection = handlers.get(handlerMethod);
				for (const [route, definition] of handlerMap) {
					if (handlerMethodCollection.has(route)) {
						throw ManagedApiInternal.ErrorMultipleApiDefinition(handlerMethod, route);
					}

					const routeTokens = ManagedApi.GetRouteTokens(route);
					const handlerArgs = ManagedApiInternal.GetApiHandlerParams(handlerClass.constructor, definition.handlerKey);
					handlerMethodCollection.set(route, {
						parent: instance,
						wrappedHandler: this.getWrappedHandler({
							...definition,
							processors: ManagedApiInternal.GetApiHandlerProcessors(definition.handler),
						}, handlerArgs, instance),
						handlerArgs,
						routeTokens,
						...definition
					});
				}
			}
		}

		return handlers;
	}
	
	public static GetRouteTokens(route: string) {
		return p2r.parse(route);
	}

	private getWrappedHandler(def: IApiDefinitionWithProcessors<TransportParamsType>, handlerArgs: IApiParamDefinition[], instance: object): WrappedApiHandler<TransportParamsType> {
		return (invocationParams) => {
			return ManagedApi.namespace.runPromise(async () => {
				try {
					const context: IApiInvocationContextPostInvoke<TransportParamsType> = {
						...await this.preProcessInvocationParams({
							apiDefinition: def,
							invocationParams,
						}, def.processors),
						result: {
							statusCode: 200,
							body: null,
							headers: {},
							streamMode: StreamCoercionMode.None,
						}
					};
					ManagedApi.namespace.set(ManagedApi.ContextNamespace, context);
					context.result.body = await this.invokeHandler(def, handlerArgs, instance, context.invocationParams);
					const {result} = await this.postProcessInvocationResult(context, def.processors);
					return result;
				} catch (e) {
					return this.getErrorResponseForException(e);
				} finally {
					ManagedApi.namespace.set(ManagedApi.ContextNamespace, null);
				}
			});
		};
	}

	protected getErrorResponseForException(e: any): IApiInvocationResult {
		if (this.handleErrors) {
			if (this.isHttpErrorLike(e)) {
				return {
					streamMode: StreamCoercionMode.None,
					statusCode: e.statusCode || e.code,
					body: e.message,
					headers: {},
				};
			} else {
				return {
					streamMode: StreamCoercionMode.None,
					statusCode: 500,
					body: '',
					headers: {},
				}
			}
		} else {
			throw e;
		}
	}

	protected async preProcessInvocationParams(context: IApiInvocationContext<TransportParamsType>, processors: IApiProcessors<TransportParamsType>): Promise<IApiInvocationContext<TransportParamsType>> {
		for (const processor of processors[ApiProcessorTime.StagePreInvoke]) {
			context.invocationParams = await processor.processor(context.invocationParams);
		}

		if (this.hooks.has(this.HookHandlerPreInvoke)) {
			const handlers = <ManagedApiPreInvokeHandlerType<TransportParamsType>[]>this.hooks.get(this.HookHandlerPreInvoke);
			for (const handler of handlers) {
				const result = await handler(context);
				if (typeof result === 'object') {
					context = result;
				}
			}
		}

		return context;
	}

	protected async postProcessInvocationResult(context: IApiInvocationContextPostInvoke<TransportParamsType>, processors: IApiProcessors<TransportParamsType>): Promise<IApiInvocationContextPostInvoke<TransportParamsType>> {
		for (const processor of processors[ApiProcessorTime.StagePostInvoke]) {
			context.result = await processor.processor(context.result);
		}

		if (this.hooks.has(this.HookHandlerPostInvoke)) {
			const handlers = <ManagedApiPostInvokeHandlerType<TransportParamsType>[]>this.hooks.get(this.HookHandlerPostInvoke);
			for (const handler of handlers) {
				const result = await handler(context);

				if (typeof result === 'object') {
					context.result = result;
				}
			}
		}

		return context;
	}

	protected isHttpErrorLike(e: any) {
		return e instanceof HttpError || (typeof e === 'object' && (e.statusCode || e.code) && e.message);
	}

	public getExecutionContext(): IApiInvocationContextPostInvoke<TransportParamsType> {
		return ManagedApi.namespace.get(ManagedApi.ContextNamespace);
	}

	private async invokeHandler(def: IApiDefinition, handlerArgs: IApiParamDefinition[], instance: object, invocationParams: IApiInvocationParams<TransportParamsType>) {
		// Resolve handler arguments
		let useCallback: PromiseCallbackHelper<any>;
		let output: any = null, overrideOutput = false;
		const args = await Promise.all(handlerArgs.map(async (def) => {
			// Callback arg is special
			if (def.type === ApiParamType.Callback) {
				if (useCallback) {
					throw new Error('Only a single callback parameter may be defined on a handler');
				}
	
				useCallback = new PromiseCallbackHelper();
				return await useCallback.getCallbackFunc();
			}

			// Parse the contents of the argument and validate
			const parsed = await this.getHandlerArg(def, invocationParams);
			if (def.type === ApiParamType.Out && def.overrideOutput) {
				if (overrideOutput) {
					throw new Error('Cannot override output in multiple args');
				}

				overrideOutput = true;
				output = parsed;
			}

			if (!def.args) {
				return parsed;
			}

			this.validateEnumParam(def.args, parsed);
			if (def.args.validationFunc) {
				this.applyValidationFunction(def.args, parsed);
			}
			if (def.args.regexp) {
				this.validateRegExpParam(def.args, parsed);
			}
			if (def.args.typedef?.type === 'number') {
				this.validateNumberParam(def.args, parsed);
			}
			if (def.args.validationFunc) {
				try {
					def.args.validationFunc(def.args.name, parsed);
				} catch (e) {
					if (this.isHttpErrorLike(e)) {
						throw e;
					} else {
						throw new HttpParamInvalidError(def.args.name);
					}
				}
			}
			return parsed;
		}));

		let executionResult: any;
		if (useCallback) {
			executionResult = await useCallback.execute(() => def.handler.apply(instance, args));
		} else {
			executionResult = await def.handler.apply(instance, args);
		}

		if (overrideOutput) {
			executionResult = await output;
		}

		return executionResult;
	}
	
	private applyValidationFunction({name, validationFunc}: __ApiParamArgs, parsed: any) {
		if (validationFunc) {
			validationFunc(name, parsed);
		}
	}
	
	protected validateNumberParam({typedef, name, numberMin, numberMax}: __ApiParamArgs, parsed: any) {
		if (typedef?.type === 'number') {
			if (
				(typeof numberMin === 'number' && parsed < numberMin)
				|| (typeof numberMax === 'number' && parsed > numberMax)
			) {
				throw new HttpNumberParamOutOfBoundsError(name, numberMin, numberMax);
			}
		}
	}

	protected validateEnumParam({typedef, name}: __ApiParamArgs, parsed: any) {
		if (typedef?.type === 'number' || typedef?.type === 'string' || typedef?.type === 'enum') {
			if (typedef.schema && typedef.schema.enum && (<Array<string>>typedef.schema.enum).indexOf(parsed) === -1) {
				throw new HttpEnumParamInvalidValueError(name, typedef.schema.enum)
			}
		}
	}

	protected validateRegExpParam(args: __ApiParamArgs, parsed: any) {
		if (args.regexp) {
			let regexp: RegExp;
			if (typeof args.regexp === 'function') {
				regexp = args.regexp(args.name);
			} else {
				regexp = args.regexp;
			}

			if (!regexp.test(parsed)) {
				throw new HttpRegexParamInvalidTypeError(args.name, regexp.source);
			}
		}
	}
	
	private async getHandlerArg(def: IApiParamDefinition, invocationParams: IApiInvocationParams<TransportParamsType>) {
		const {args} = def;
		if (def.type === ApiParamType.Query) {
			const isDefined = typeof invocationParams.queryParams[args.name] === 'string';
			if (!isDefined && args.typedef.type !== 'boolean') {
				// Query param not defined
				if (args.initializer) {
					return args.initializer();
				} else if (args.optional) {
					// This arg was optional
					return undefined;
				} else {
					// Arg was required, throw
					throw new HttpRequiredQueryParamMissingError(args.name);
				}
			}

			// Arg was defined, process it
			return this.getApiParam(args, isDefined, invocationParams.queryParams[args.name]);
		} else if (def.type === ApiParamType.Path) {
			const isDefined = typeof invocationParams.pathParams[args.name] === 'string';
			if (!isDefined && args.typedef.type !== 'boolean') {
				// Path param not defined
				if (args.initializer) {
					return args.initializer();
				} else if (args.optional) {
					// This arg was optional
					return undefined;
				} else {
					// Arg was required, throw
					throw new HttpRequiredPathParamMissingError(args.name);
				}
			}

			// Arg was defined, process it
			return this.getApiParam(args, isDefined, invocationParams.pathParams[args.name]);
		} else if (def.type === ApiParamType.Header) {
			const headerName = args.name.toLowerCase();
			const isDefined = typeof invocationParams.headers[headerName] === 'string';
			if (!isDefined && args.typedef.type !== 'boolean') {
				// Query param not defined
				if (args.initializer) {
					return args.initializer();
				} else if (args.optional) {
					// This arg was optional
					return undefined;
				} else {
					// Arg was required, throw
					throw new HttpRequiredHeaderParamMissingError(args.name);
				}
			}

			// Arg was defined, process it
			return this.getApiParam(args, isDefined, invocationParams.headers[headerName]);
		} else if (def.type === ApiParamType.Body || def.type === ApiParamType.RawBody) {
			const {bodyContents} = invocationParams;
			if (!bodyContents) {
				if (args.initializer) {
					return args.initializer();
				}

				throw new HttpRequiredBodyParamMissingError();
			}

			if (def.type === ApiParamType.RawBody) {
				if (typeof def.mimeType === 'string' && def.mimeType !== bodyContents.streamContentsMimeRaw) {
					throw new HttpUnsupportedMediaTypeError(def.mimeType);
				}

				if (def.bodyType === ApiRawBodyParamType.Stream) {
					if (!bodyContents.contentsStream) {
						throw new HttpTransportConfigurationError('Raw body was not available for handler');
					}

					return bodyContents.contentsStream;
				} else if (def.bodyType === ApiRawBodyParamType.String) {
					if (!bodyContents.contentsString) {
						bodyContents.contentsString = await bodyContents.readStreamToStringAsync();
					}

					return bodyContents.contentsString;
				} else {
					throw new HttpTransportConfigurationError('Unknown raw body type requested');
				}
			}

			let contents = null;
			if (typeof bodyContents.parsedBody !== 'undefined') {
				contents = bodyContents.parsedBody;
				if (contents instanceof Buffer) {
					throw new Error('ParsedBody may not be a buffer');
				}
			} else {
				contents = await this.parseRawRequestBody(bodyContents);
				switch (args.typedef.type) {
					case 'any':
						if (typeof contents === 'object') {
							break;
						}
						
					case 'string':
					case 'number':
					case 'boolean':
						contents = this.getApiParam(args, true, contents);
						break;

					case 'object':
					case 'array':
						break;

					default:
						throw new Error('Not implemented');
				}
			}
			
			this.validateBodyContents(args, contents);
			return contents;
		} else if (def.type === ApiParamType.Transport) {
			if (invocationParams.transportParams[def.transportTypeId]) {
				return invocationParams.transportParams[def.transportTypeId];
			} else if (args.initializer) {
				return args.initializer();
			} else if (!args.optional) {
				throw new HttpRequiredTransportParamMissingError(def.transportTypeId);
			} else {
				return undefined;
			}
		} else if (def.type === ApiParamType.Dependency) {
			try {
				if (args.typeref) {
					return this.dependencies.instantiateDependency(args.typeref);
				} else {
					return this.dependencies.instantiateDependency(args.typedef);
				}
			} catch (e) {
				if (args.initializer) {
					return args.initializer();
				} else if (args.optional) {
					return undefined;
				}

				throw e;
			}
		} else if (def.type === ApiParamType.Out) {
			if (this.streamCoercionMode === StreamCoercionMode.None) {
				throw new Error('Stream out type cannot be used while coercion is disabled');
			}

			return StreamIntermediary.GetStreamIntermediary();
		}
	}

	private async parseRawRequestBody(bodyContents: IApiBodyContents) {
		if (!bodyContents.contentsString) {
			bodyContents.contentsString = await bodyContents.readStreamToStringAsync();
		}
		
		switch (bodyContents.streamContentsMimeType) {
			case ApiMimeType.ApplicationJson:
				return JSON.parse(bodyContents.contentsString!);

			case ApiMimeType.Text:
				return bodyContents.contentsString!;
			
			// TODO: Add a way to register mime type parsers so that you can BYO xml

			default:
				throw new HttpUnsupportedMediaTypeError();
		}
	}

	private validateBodyContents(args: __ApiParamArgs, contents: any) {
		const contentsType = typeof contents;
		if (args.typedef.type !== 'any' && contentsType !== args.typedef.type) {
			throw new HttpBodyParamInvalidTypeError(args.typedef.type);
		}

		if (args.typedef.type === 'object') {
			const result = this.jsonValidator.validate(contents, args.typedef.schema);
			if (!result.valid) {
				if (result.errors.length === 0) {
					throw new HttpBodyParamInvalidTypeError(args.typedef.type);
				} else {
					// TODO: Create a multiple error format
					throw new HttpBodyParamValidationError(result.errors[0]);
				}
			}
		}

		if (args.validationFunc) {
			args.validationFunc(args.name, contents);
		}
	}

	private getApiParam(args: __ApiParamArgs, isDefined: boolean, strVal: string | Buffer | string[], contentsMime?: string) {
		switch (args.typedef.type) {
			case 'any':
			case 'string':
				{
					if (typeof strVal === 'string') {
						return strVal;
					} else if (Array.isArray(strVal)) {
						return strVal[0];
					} else if (strVal instanceof Buffer) {
						return strVal.toString();
					}
					
					throw new HttpQueryParamInvalidTypeError(args.name, 'string');
				}

			case 'number':
				{
					if (Array.isArray(strVal)) {
						strVal = strVal[0];
					} else if (strVal instanceof Buffer) {
						strVal = strVal.toString();
					}

					const parsed = Number(strVal);
					if (isNaN(parsed)) {
						throw new HttpQueryParamInvalidTypeError(args.name, 'number');
					}

					return parsed;
				};

			case 'boolean':
				{
					if (isDefined) {
						switch ((typeof strVal === 'string' ? strVal : strVal.toString()).toLowerCase()) {
							case '0':
							case 'false':
								return false;
						}

						return true;
					} else if (args.initializer) {
						return args.initializer();
					}
					
					return false;
				};

			case 'array':
				{
					// TODO: Check the type of the array elements
					if (typeof strVal === 'string') {
						return [strVal];
					} else if (Array.isArray(strVal)) {
						return strVal;
					} else if (strVal instanceof Buffer) {
						return [strVal.toString()];
					}
					
					throw new HttpQueryParamInvalidTypeError(args.name, 'array');
				}

			default:
				throw new Error('Not implemented');
		}
	}

	/**
	 * Instantiates a class instance of a handler, doing any dependency injection if needed
	 * @param handlerClass 
	 */
	private instanstiateHandlerClass(handlerClass: IApiClassDefinition): object {
		const instance = this.dependencies.instantiateDependency(handlerClass.constructor);
		return instance;
	}

	/**
	 * Registers a dependency.
	 * 
	 * Dependencies are injected by type. If you'd like to register many dependencies for a type, specify a unique `name` for each dependency.
	 * 
	 * Must be called before initialization to be applied.
	 * @param dep The dependency to fill
	 * @param name An optional name for the dependency.
	 */
	public addDependency(dep: ClassConstructor, name?: string): void {
		// TODO: Dependency scopes
		this.dependencies.registerDependency(
			ApiDependency.WithConstructor(dep));
	}

	/**
	 * Gets the value of a header in the current request
	 * @param name The name of the header to get. Case insensitive.
	 */
	public getHeader(name: string): string | string[] | undefined {
		const context = this.getExecutionContext();
		const headers = context.invocationParams.headers;
		if (!headers) {
			return;
		}

		return headers[name];
	}

	/**
	 * Sets the value of a header in the current response
	 * @param name The name of the header to set. Case insensitive.
	 * @param value The value of the header to set
	 */
	public abstract setHeader(name: string, value: string | number): void;

	/**
	 * Add a hook to be processed during request handling.
	 * @param hookName The name of the hook event
	 * @param hookfunction The handler to register
	 */
	public addHook(hookName: ManagedApi<TransportParamsType>['HookHandlerPreInvoke'], hookfunction: ManagedApiPreInvokeHandlerType<TransportParamsType>): void;
	public addHook(hookName: ManagedApi<TransportParamsType>['HookHandlerPostInvoke'], hookfunction: ManagedApiPostInvokeHandlerType<TransportParamsType>): void;
	public addHook(hookName: string, hookfunction: Func): void {
		switch (hookName) {
			case this.HookHandlerPreInvoke:
			case this.HookHandlerPostInvoke:
				if (!this.hooks.has(hookName)) {
					this.hooks.set(hookName, []);
				}

				this.hooks.get(hookName).push(hookfunction);
				break;
			
			default:
				throw new Error(`Invalid hook name: ${hookName}`);
		}
	}

	/**
	 * Remove a previously registered hook.
	 * @param hookName The name of the hook event
	 * @param hookfunction The handler to remove
	 * @returns true if the hook was found and removed
	 */
	public removeHook(hookName: string, hookfunction: Func): boolean {
		if (this.hooks.has(hookName)) {
			const hooks = this.hooks.get(hookName);
			const index = hooks.indexOf(hookfunction);
			if (index >= 0) {
				hooks.splice(index, 1);

				if (hooks.length === 0) {
					this.hooks.delete(hookName);
				}

				return true;
			}
		}

		return false;
	}

	private hook_checkStreamCoercionMode(pi: IApiInvocationContextPostInvoke<TransportParamsType>): IApiInvocationResult {
		if (this.streamCoercionMode === StreamCoercionMode.None) {
			return;
		}

		pi.result.streamMode = StreamCoercer.IsCoercible(pi.result.body, this.streamCoercionMode);
	}
}