import { IApiDefinition, ApiMethod, IApiParamDefinition, IApiProcessors, IApiModifierDefinition } from "./ApiDefinition";
import 'reflect-metadata';
import { IDependency, IDependencyParam } from "./ApiDependency";
import { ClassConstructor } from "../Util/ClassConstructors";
import { IApiProcessor, ApiProcessorTime, IApiPreProcessor, IApiPostProcessor, IApiGlobalProcessor } from "./ApiProcessing/ApiProcessing";
import { IApiInvocationParams, IApiInvocationResult } from "./ManagedApi";
import { IParameterDecoratorDefinition } from "../transformer/DecoratorDefinition";

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
	public static readonly ApiMethodModifierMetadataKey = 'managedapi:apimodifier';
	public static readonly ApiMethodProcessorsMetadataKey = 'managedapi:apiprocessors';
	public static readonly ApiMethodParamsMetadataKey = 'managedapi:apimethodparams';
	public static readonly DependencyMetadataKey = 'managedapi:dependency';
	public static readonly DependencyParamMetadataKey = 'managedapi:dependencyparams';
	public static readonly GlobalApiProcessorMetadataKey = 'managedapi:globalapiprocessor';

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

	public static AddApiModifierMetadataToObject<T = object>(metadata: IApiModifierDefinition<T>, target: object): void {
		const apis: IApiModifierDefinition<T>[] = ManagedApiInternal.GetApiModifierDefinitionsOnObject<T>(target, metadata.propertyKey);
		apis.push(metadata);
		Reflect.defineMetadata(this.ApiMethodModifierMetadataKey, apis, target, metadata.propertyKey);
	}

	public static AddGlobalApiProcessorMetadataToObject(metadata: IApiGlobalProcessor, target: object): void {
		const apis: IApiGlobalProcessor[] = ManagedApiInternal.GetGlobalApiProcessorOnObject(target);
		apis.push(metadata);
		Reflect.defineMetadata(this.GlobalApiProcessorMetadataKey, apis, target);
	}

	public static AddApiProcessorsToObject(processors: IApiProcessor<IApiInvocationParams<any> | IApiInvocationResult>[], target: object): void {
		const apis: IApiProcessor<IApiInvocationParams<any> | IApiInvocationResult>[] = ManagedApiInternal.GetApiProcessorsOnObject(target);
		apis.push(...processors);
		Reflect.defineMetadata(this.ApiMethodProcessorsMetadataKey, apis, target);
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

	public static GetApiHandlerProcessors<T extends object>(target: object): IApiProcessors<T> {
		const processors: IApiProcessors<T> = {
			[ApiProcessorTime.StagePreInvoke]: [],
			[ApiProcessorTime.StagePostInvoke]:[],
		};

		for (const processor of ManagedApiInternal.GetApiProcessorsOnObject(target)) {
			processors[processor.stage].push(<any>processor);
		}

		return processors;
	}

	private static GetApiDefinitionsOnObject(target: object): IApiDefinition[] {
		return Reflect.getMetadata(this.ApiMethodMetadataKey, target) || [];
	}

	public static GetApiModifierDefinitionsOnObject<T = object>(target: object, propertyKey: string | symbol): IApiModifierDefinition<T>[] {
		return Reflect.getMetadata(this.ApiMethodModifierMetadataKey, target, propertyKey) || [];
	}

	private static GetGlobalApiProcessorOnObject(target: object): IApiGlobalProcessor[] {
		return Reflect.getMetadata(this.GlobalApiProcessorMetadataKey, target) || [];
	}

	private static GetApiProcessorsOnObject(target: object): IApiProcessor<IApiInvocationParams<any> | IApiInvocationResult>[] {
		return Reflect.getMetadata(this.ApiMethodProcessorsMetadataKey, target) || [];
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