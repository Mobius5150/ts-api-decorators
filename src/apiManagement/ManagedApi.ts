import { ManagedApiInternal, IApiClassDefinition } from "./ManagedApiInternal";
import { IApiDefinition, ApiMethod, IApiParamDefinition } from "./ApiDefinition";
import { createNamespace, getNamespace, Namespace } from 'cls-hooked';
import { HttpRequiredQueryParamMissingError, HttpQueryParamInvalidTypeError, HttpError } from "../Errors";

export type ApiQueryParamsDict = { [param: string]: string };
export type ApiHeadersDict = { [param: string]: string };

export interface IApiInvocationParams<TransportParamsType extends object> {
	queryParams: ApiQueryParamsDict;
	transportParams: TransportParamsType
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

	public constructor() {
		if (!ManagedApi.namespace) {
			ManagedApi.namespace = getNamespace(ManagedApi.ClsNamespace);

			if (!ManagedApi.namespace) {
				ManagedApi.namespace = createNamespace(ManagedApi.ClsNamespace);
			}
		}
	}

	/**
	 * Iniitalizes all API factories
	 * 
	 * TODO: Move to a helper class
	 */
	public initHandlers() {
		// Get the list of registered classes
		const classes = ManagedApiInternal.GetRegisteredApiClassDefinitions()
			// Only get the ones that have handlers defined on them
			.filter(c => c.handlers.size > 0);

		// Initialize each class and build a master map of all API handlers
		const handlers = new Map<ApiMethod, Map<string, IApiHandlerInstance<TransportParamsType>>>();
		for (const handlerClass of classes) {
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
					const handlerResult = await Promise.resolve(this.invokeHandler(def, handlerArgs, instance, invocationParams));

					const result: IApiInvocationResult = {
						statusCode: 200,
						body: handlerResult,
						headers: {},
					};

					return result;
				} catch (e) {
					if (e instanceof HttpError) {
						return {
							statusCode: e.statusCode,
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

	public getExecutionContextInvocationParams(): IApiInvocationParams<TransportParamsType> {
		return ManagedApi.namespace.get('invocationparams');
	}

	private invokeHandler(def: IApiDefinition, handlerArgs: IApiParamDefinition[], instance: object, invocationParams: IApiInvocationParams<TransportParamsType>) {
		// Resolve handler arguments
		const args = handlerArgs.map(({args}) => {
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
			const strVal = invocationParams.queryParams[args.name];
			switch (args.typedef.type) {
				case 'any':
				case 'string':
					return strVal;

				case 'number':
					{
						const parsed = Number(strVal);
						if (isNaN(parsed)) {
							throw new HttpQueryParamInvalidTypeError(args.name, 'number');
						}

						return parsed;
					}
					break;

				case 'boolean':
					{
						if (isDefined) {
							switch (strVal.toLowerCase()) {
								case '0':
								case 'false':
									return false;
							}

							return true;
						} else if (args.initializer) {
							return args.initializer();
						} else {
							return false;
						}
					};

				default:
					throw new Error('Not implemented');
			}

			// TODO: How to specify callback arg for callback model?
		});

		return def.handler.apply(instance, args);
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

	private getRequestForCurrentExecutionContext() {
		throw new Error('Not implemented');
	}
}