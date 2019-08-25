import { IApiDefinition, ApiMethod } from "./ApiDefinition";
import { ClassConstructor } from "../decorators";

export interface IApiClassDefinition {
	constructor: ClassConstructor;
	handlers: Map<ApiMethod, Map<string, IApiDefinition>>;
}

export class ManagedApiInternal {
	public static RegisterApi(constructor: ClassConstructor) {
		throw new Error('Not implemented');
	}

	public static GetRegisteredApiClasses(): IApiClassDefinition[] {
		throw new Error('Not implemented');
	}
}