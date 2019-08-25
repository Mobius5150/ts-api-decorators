import { ManagedApiInternal, IApiClassDefinition } from "./ManagedApiInternal";
import { IApiDefinition, ApiMethod } from "./ApiDefinition";
import { stringify } from "querystring";

interface IApiHandlerInstance extends IApiDefinition {
	parent: object;
}

export default class ManagedApi {
	private static apis = [];

	public constructor() {
	}

	/**
	 * Iniitalizes all API factories
	 */
	public init() {
		// Get the list of registered classes
		const classes = ManagedApiInternal.GetRegisteredApiClasses()
			// Only get the ones that have handlers defined on them
			.filter(c => c.handlers.size > 0);

		// Initialize each class and build a master map of all API handlers
		const handlers = new Map<ApiMethod, Map<string, IApiHandlerInstance>>();
		for (const handlerClass of classes) {
			const instance = this.instanstiateHandlerClass(handlerClass);
			for (const handlerMethod of handlerClass.handlers) {
				if (!handlers.has(handlerMethod[0])) {
					handlers.set(handlerMethod[0], new Map<string, IApiHandlerInstance>());
				}

				const handlerMethodCollection = handlers.get(handlerMethod[0]);
				for (const handlerRoute of handlerMethod[1]) {
					if (handlerMethodCollection.has(handlerRoute[0])) {
						throw new Error(`Multiple APIs defined for '${handlerMethod[0]}' method on '${handlerRoute[0]}'`);
					}

					handlerMethodCollection.set(handlerRoute[0], {
						parent: instance, 
						...handlerRoute[1]
					});
				}
			}
		}
		
		// TODO: Other initialization actions

		throw new Error('Not implemented');
	}
	
	/**
	 * Instantiates a class instance of a handler, doing any dependency injection if needed
	 * @param handlerClass 
	 */
	private instanstiateHandlerClass(handlerClass: IApiClassDefinition): object {
		throw new Error("Method not implemented.");
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