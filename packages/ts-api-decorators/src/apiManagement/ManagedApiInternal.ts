import { IApiDefinition, ApiMethod, IApiParamDefinition } from "./ApiDefinition";
import { ClassConstructor } from "../decorators";
import 'reflect-metadata';
import { IDependency, IDependencyParam } from "./ApiDependency";

const SINGLETON_KEY = Symbol.for("MB.ts-api-decorators.ManagedApiInternal");

// check if the global object has this symbol
// add it if it does not have the symbol, yet
// ------------------------------------------
const globalSymbols = Object.getOwnPropertySymbols(global);
const keyDefined = (globalSymbols.indexOf(SINGLETON_KEY) > -1);
if (!keyDefined) {
	global[SINGLETON_KEY] = {
		apis: new Map<ClassConstructor, IApiClassDefinition>(),
	};
}

let Apis: { apis: Map<ClassConstructor, IApiClassDefinition> } = global[SINGLETON_KEY];

export interface IApiClassDefinition {
	constructor: ClassConstructor;
	handlers: Map<ApiMethod, Map<string, IApiDefinition>>;
}

export class ManagedApiInternal {
	public static readonly ApiMetadataKey = 'managedapi:api';
	public static readonly ApiMethodMetadataKey = 'managedapi:apimethod';
	public static readonly ApiMethodParamsMetadataKey = 'managedapi:apimethodparams';
	public static readonly DependencyMetadataKey = 'managedapi:dependency';
	public static readonly DependencyParamMetadataKey = 'managedapi:dependencyparams';

	public static ResetRegisteredApis() {
		Apis.apis.clear();
	}

	public static RegisterApi(constructor: ClassConstructor) {
		if (Apis.apis.has(constructor)) {
			throw new Error('Api already registered');
		}

		Apis.apis.set(constructor, {
			constructor,
			handlers: new Map<ApiMethod, Map<string, IApiDefinition>>(),
		});

		Reflect.defineMetadata(ManagedApiInternal.ApiMetadataKey, constructor.name, constructor);
	}

	public static GetRegisteredApiClassDefinitions(): IApiClassDefinition[] {
		const result: IApiClassDefinition[] = [];
		for (const api of Apis.apis) {
			const handlers = this.GetHandlersForConstructor(api[0]);
			if (handlers) {
				api[1].handlers = handlers;
				result.push(api[1]);
			}
		}

		return Array.from(Apis.apis.values());
	}
	
	public static GetHandlersForConstructor(constructor: ClassConstructor): Map<ApiMethod, Map<string, IApiDefinition>> {
		const apis: IApiDefinition[] = ManagedApiInternal.GetApiDefinitionsOnObject(constructor);
		const handlers = new Map<ApiMethod, Map<string, IApiDefinition>>();
		if (!apis || apis.length === 0) {
			return handlers;
		}

		for (const api of apis) {
			if (!handlers.has(api.method)) {
				handlers.set(api.method, new Map<string, IApiDefinition>());
			}

			const methodHandler = handlers.get(api.method);
			if (methodHandler.has(api.route)) {
				throw ManagedApiInternal.ErrorMultipleApiDefinition(api.method, api.route);
			}

			methodHandler.set(api.route, api);
		}

		return handlers;
	}

	public static GetDependenciesOnConstructor(constructor: ClassConstructor): IDependency[] {
		return this.GetDependencyDefinitionsOnObject(constructor);
	}

	public static ErrorMultipleApiDefinition(method: ApiMethod, route: string) {
		return new Error(`Multiple APIs defined for '${method}' method on '${route}'`);
	}

	public static AddApiMetadataToObject(metadata: IApiDefinition, target: object): void {
		const apis: IApiDefinition[] = ManagedApiInternal.GetApiDefinitionsOnObject(target);
		apis.push(metadata);
		Reflect.defineMetadata(this.ApiMethodMetadataKey, apis, target);
	}

	public static AddApiHandlerParamMetadataToObject(metadata: IApiParamDefinition, target: object): void {
		const apis: IApiParamDefinition[] = ManagedApiInternal.GetHandlerParamDefinitionsOnObject(target, metadata.propertyKey);
		apis.push(metadata);
		Reflect.defineMetadata(this.ApiMethodParamsMetadataKey, apis, target, metadata.propertyKey);
	}

	public static AddApiDependencyParamMetadataToObject(metadata: IDependencyParam, target: object): void {
		const deps: IDependencyParam[] = ManagedApiInternal.GetDependencyParamDefinitionsOnObject(target, metadata.propertyKey);
		deps.push(metadata);
		Reflect.defineMetadata(this.DependencyParamMetadataKey, deps, target, metadata.propertyKey);
	}

	public static AddDependencyMetadataToObject(metadata: IDependency, target: object): void {
		const deps: IDependency[] = ManagedApiInternal.GetDependencyDefinitionsOnObject(target);
		deps.push(metadata);
		Reflect.defineMetadata(this.DependencyMetadataKey, deps, target);
	}

	public static GetDependencyParams(target: object, key: string | symbol): IDependencyParam[] {
		const params = this.GetDependencyParamDefinitionsOnObject(target, key)
			.sort((a, b) => a.parameterIndex-b.parameterIndex);

		for (let i = 0; i < params.length; ++i) {
			if (params[i].parameterIndex !== i) {
				throw new Error(`All parameters must be decorated for handler: ${String(key)}`);
			}
		}

		return params;
	}

	public static GetApiHandlerParams(target: object, key: string | symbol): IApiParamDefinition[] {
		const params = this.GetHandlerParamDefinitionsOnObject(target, key)
			.sort((a, b) => a.parameterIndex-b.parameterIndex);

		for (let i = 0; i < params.length; ++i) {
			if (params[i].parameterIndex !== i) {
				throw new Error(`All parameters must be decorated for handler: ${String(key)}`);
			}
		}

		return params;
	}

	private static GetApiDefinitionsOnObject(target: object): IApiDefinition[] {
		return Reflect.getMetadata(this.ApiMethodMetadataKey, target) || [];
	}

	private static GetHandlerParamDefinitionsOnObject(target: object, key: string | symbol): IApiParamDefinition[] {
		return Reflect.getMetadata(this.ApiMethodParamsMetadataKey, target, key) || [];
	}

	private static GetDependencyDefinitionsOnObject(target: object): IDependency[] {
		return Reflect.getMetadata(this.DependencyMetadataKey, target) || [];
	}

	private static GetDependencyParamDefinitionsOnObject(target: object, key: string | symbol): IDependencyParam[] {
		return Reflect.getMetadata(this.DependencyParamMetadataKey, target, key) || [];
	}
}