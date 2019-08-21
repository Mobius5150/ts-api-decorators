export default class ManagedApi {
	private static apis = [];

	public constructor() {
	}

	/**
	 * Iniitalizes all API factories
	 */
	public init() {
		throw new Error('Not implemented');
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