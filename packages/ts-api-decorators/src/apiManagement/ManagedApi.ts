import { ManagedApiInternal, IApiClassDefinition } from "./ManagedApiInternal";
import { IApiDefinition, ApiMethod, IApiParamDefinition, ApiParamType, IApiTransportTypeParamDefinition } from "./ApiDefinition";
import { createNamespace, getNamespace, Namespace } from 'cls-hooked';
import { HttpRequiredQueryParamMissingError, HttpQueryParamInvalidTypeError, HttpError, HttpRequiredBodyParamMissingError, HttpBodyParamInvalidTypeError, HttpBodyParamValidationError, HttpRequiredTransportParamMissingError, HttpRequiredHeaderParamMissingError, HttpRegexParamInvalidTypeError, HttpParamInvalidError, HttpNumberParamOutOfBoundsError } from "../Errors";
import { Readable } from "stream";
import { ApiMimeType } from "./MimeTypes";
import { __ApiParamArgs } from "./InternalTypes";
import { Validator as JsonSchemaValidator } from 'jsonschema';
import { ClassConstructor } from "..";
import { PromiseCallbackHelper } from "./CallbackPromiseHelper";

export type ApiQueryParamsDict = { [param: string]: string };
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
	queryParams: ApiQueryParamsDict;
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

export interface IApiHandlerInstance<TransportParamsType extends object> extends IApiDefinition {
	parent: object;
	wrappedHandler: WrappedApiHandler<TransportParamsType>;
	handlerArgs: IApiParamDefinition[];
}

export class ManagedApi<TransportParamsType extends object> {
	private static readonly ClsNamespace = 'ManagedApiNamespace';

	private static apis = [];
	private static namespace: Namespace;

	private readonly jsonValidator: JsonSchemaValidator;

	private classes: IApiClassDefinition[];

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
	public initHandlers() {
		if (!this.classes) {
			// Get the list of registered classes
			this.classes = ManagedApiInternal.GetRegisteredApiClassDefinitions()
				// Only get the ones that have handlers defined on them
				.filter(c => c.handlers.size > 0);
		}

		// Initialize each class and build a master map of all API handlers
		const handlers = new Map<ApiMethod, Map<string, IApiHandlerInstance<TransportParamsType>>>();
		for (const handlerClass of this.classes) {
			const instance = this.instanstiateHandlerClass(handlerClass);
			for (const handlerMethod of handlerClass.handlers) {
				if (!handlers.has(handlerMethod[0])) {
					handlers.set(handlerMethod[0], new Map<string, IApiHandlerInstance<TransportParamsType>>());
				}

				const handlerMethodCollection = handlers.get(handlerMethod[0]);
				for (const handlerRoute of handlerMethod[1]) {
					if (handlerMethodCollection.has(handlerRoute[0])) {
						throw ManagedApiInternal.ErrorMultipleApiDefinition(handlerMethod[0], handlerRoute[0]);
					}

					const handlerArgs = ManagedApiInternal.GetApiHandlerParams(handlerClass.constructor, handlerRoute[1].handlerKey);
					handlerMethodCollection.set(handlerRoute[0], {
						parent: instance,
						wrappedHandler: this.getWrappedHandler(handlerRoute[1], handlerArgs, instance),
						handlerArgs,
						...handlerRoute[1]
					});
				}
			}
		}

		return handlers;
	}
	
	private getWrappedHandler(def: IApiDefinition, handlerArgs: IApiParamDefinition[], instance: object): WrappedApiHandler<TransportParamsType> {
		return (invocationParams) => {
			return ManagedApi.namespace.runPromise(async () => {
				ManagedApi.namespace.set('invocationParams', invocationParams);
				try {
					const handlerResult = await this.invokeHandler(def, handlerArgs, instance, invocationParams);

					const result: IApiInvocationResult = {
						statusCode: 200,
						body: handlerResult,
						headers: {},
					};

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

	private isHttpErrorLike(e: any) {
		return e instanceof HttpError || (typeof e === 'object' && (e.statusCode || e.code) && e.message);
	}

	public getExecutionContextInvocationParams(): IApiInvocationParams<TransportParamsType> {
		return ManagedApi.namespace.get('invocationparams');
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
		const instance = new handlerClass.constructor();

		// TODO: Inject dependencies
		// this.injectClassDependencies(handlerClass, instance);

		return instance;
	}

	/**
	 * Scans the class for declared dependencies and injects them on properties.
	 * @param handlerClass The class definition
	 * @param instance An instance of the class
	 */
	private injectClassDependencies(handlerClass: IApiClassDefinition, instance: object) {
		throw new Error('Method not implemented');
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
	public addDependency<T>(dep: T, name?: string): void {
		throw new Error('Not implemented');
	}

	/**
	 * Gets the value of a header in the current request
	 * @param name The name of the header to get. Case insensitive.
	 */
	public getHeader(name: string): string {
		// Note to self: when implementing this we'll use some request stack magic
		// to figure out which request is being read. getRequestForCurrentExecutionContext
		throw new Error('Not implemented');
	}

	/**
	 * Sets the value of a header in the current response
	 * @param name The name of the header to set. Case insensitive.
	 * @param value The value of the header to set
	 */
	public setHeader(name: string, value: string | number): void {
		// Note to self: when implementing this we'll use some request stack magic
		// to figure out which request is being read. getRequestForCurrentExecutionContext
		throw new Error('Not implemented');
	}

	private getRequestForCurrentExecutionContext(): TransportParamsType {
		throw new Error('Not implemented');
	}
}