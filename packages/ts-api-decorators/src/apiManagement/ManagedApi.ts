import { ManagedApiInternal, IApiClassDefinition } from "./ManagedApiInternal";
import { IApiDefinition, ApiMethod, IApiParamDefinition, ApiParamType, IApiTransportTypeParamDefinition, IApiDefinitionWithProcessors, IApiProcessors } from "./ApiDefinition";
import { createNamespace, getNamespace, Namespace } from 'cls-hooked';
import { HttpRequiredQueryParamMissingError, HttpQueryParamInvalidTypeError, HttpError, HttpRequiredBodyParamMissingError, HttpBodyParamInvalidTypeError, HttpBodyParamValidationError, HttpRequiredTransportParamMissingError, HttpRequiredHeaderParamMissingError, HttpRegexParamInvalidTypeError, HttpParamInvalidError, HttpNumberParamOutOfBoundsError, HttpRequiredPathParamMissingError } from "../Errors";
import { Readable } from "stream";
import { ApiMimeType } from "./MimeTypes";
import { __ApiParamArgs } from "./InternalTypes";
import { Validator as JsonSchemaValidator } from 'jsonschema';
import { PromiseCallbackHelper } from "./CallbackPromiseHelper";
import * as p2r from 'path-to-regexp';
import { ApiDependencyCollection, ApiDependency } from "./ApiDependency";
import { ClassConstructor } from "../Util/ClassConstructors";
import { ApiProcessorTime } from "./ApiProcessing/ApiProcessing";

export type ApiParamsDict = { [param: string]: string };
export type ApiHeadersDict = { [paramNameLowercase: string]: string | string[] };

export interface IApiBodyContents {
	contentsStream: Readable;
	streamContentsMimeType: ApiMimeType;
	streamContentsMimeRaw: string;
	readStreamToStringAsync: () => Promise<string>;
	readStreamToStringCb: (cb: (err: any, contents?: string) => void) => void;
	parsedBody?: any;
}

export interface IApiInvocationParams<TransportParamsType extends object> {
	queryParams: ApiParamsDict;
	pathParams: ApiParamsDict;
	headers: ApiHeadersDict;
	bodyContents?: IApiBodyContents;
	transportParams: TransportParamsType;
}

export interface IApiInvocationResult {
	statusCode: number;
	body: string | object;
	headers: ApiHeadersDict;
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
	private static readonly InvocationParamsNamespace = 'invocationParams';

	private static apis = [];
	private static namespace: Namespace;

	private readonly jsonValidator: JsonSchemaValidator;

	private classes: IApiClassDefinition[];

	private readonly dependencies = new ApiDependencyCollection();

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
					invocationParams = await this.preProcessInvocationParams(invocationParams, def.processors);
					ManagedApi.namespace.set(ManagedApi.InvocationParamsNamespace, invocationParams);
					const handlerResult = await this.invokeHandler(def, handlerArgs, instance, invocationParams);

					const result: IApiInvocationResult = await this.postProcessInvocationResult({
						statusCode: 200,
						body: handlerResult,
						headers: {},
					}, def.processors);

					return result;
				} catch (e) {
					if (this.isHttpErrorLike(e)) {
						return {
							statusCode: e.statusCode || e.code,
							body: e.message,
							headers: {},
						};
					} else {
						return {
							statusCode: 500,
							body: '',
							headers: {},
						}
					}
				}
			});
		};
	}

	protected async preProcessInvocationParams(invocationParams: IApiInvocationParams<TransportParamsType>, processors: IApiProcessors<TransportParamsType>): Promise<IApiInvocationParams<TransportParamsType>> {
		for (const processor of processors[ApiProcessorTime.StagePreInvoke]) {
			invocationParams = await processor.processor(invocationParams);
		}

		return invocationParams;
	}

	protected async postProcessInvocationResult(invocationResult: IApiInvocationResult, processors: IApiProcessors<TransportParamsType>): Promise<IApiInvocationResult> {
		for (const processor of processors[ApiProcessorTime.StagePostInvoke]) {
			invocationResult = await processor.processor(invocationResult);
		}

		return invocationResult;
	}

	private isHttpErrorLike(e: any) {
		return e instanceof HttpError || (typeof e === 'object' && (e.statusCode || e.code) && e.message);
	}

	public getExecutionContextInvocationParams(): IApiInvocationParams<TransportParamsType> {
		return ManagedApi.namespace.get(ManagedApi.InvocationParamsNamespace);
	}

	private async invokeHandler(def: IApiDefinition, handlerArgs: IApiParamDefinition[], instance: object, invocationParams: IApiInvocationParams<TransportParamsType>) {
		// Resolve handler arguments
		let useCallback: PromiseCallbackHelper<any>;
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
			if (!def.args) {
				return parsed;
			}

			if (def.args.regexp) {
				this.validateRegExpParam(def.args, parsed);
			}
			if (def.args.typedef.type === 'number') {
				this.validateNumberParamr(def.args, parsed);
			}
			if (def.args.validationFunction) {
				try {
					def.args.validationFunction(def.args.name, parsed);
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

		if (useCallback) {
			return useCallback.execute(() => def.handler.apply(instance, args));
		} else {
			return def.handler.apply(instance, args);
		}
	}
	
	protected validateNumberParamr({typedef, name}: __ApiParamArgs, parsed: any) {
		if (typedef.type === 'number') {
			if ((typedef.minVal && parsed < typedef.minVal) || (typedef.maxVal && parsed > typedef.maxVal)) {
				throw new HttpNumberParamOutOfBoundsError(name, typedef.minVal, typedef.maxVal);
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
		} else if (def.type === ApiParamType.Body) {
			const {bodyContents} = invocationParams;
			if (!bodyContents) {
				if (args.initializer) {
					return args.initializer();
				}

				throw new HttpRequiredBodyParamMissingError();
			}

			let contents = null;
			if (typeof bodyContents.parsedBody !== 'undefined') {
				contents = bodyContents.parsedBody;
				if (contents instanceof Buffer) {
					throw new Error('ParsedBody may not be a buffer');
				}
			} else {
				switch (args.typedef.type) {
					case 'any':
					case 'string':
					case 'number':
					case 'boolean':
						contents = this.getApiParam(args, true, contents);
						break;

					case 'object':
					case 'array':
						contents = await this.parseRawRequestBody(bodyContents);
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
		}
	}

	private async parseRawRequestBody(bodyContents: IApiBodyContents) {
		switch (bodyContents.streamContentsMimeType) {
			case ApiMimeType.ApplicationJson:
				return JSON.parse(await bodyContents.readStreamToStringAsync());
			
			// TODO: Add a way to register mime type parsers so that you can BYO xml

			default:
				throw new Error('Body contents parser not defined for type: ' + bodyContents.streamContentsMimeRaw);
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

		if (args.validationFunction) {
			args.validationFunction(args.name, contents);
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
		const context = this.getExecutionContextInvocationParams();
		const headers = context.headers;
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
}