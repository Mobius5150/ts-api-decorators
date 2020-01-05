import { IExtractedApiDefinitionWithMetadata } from 'ts-api-decorators/dist/transformer/ExtractionTransformer';
import { IGenerator, OutputFileGeneratorFunc } from 'ts-api-decorators/dist/generators/IGenerator';
import { FunctionFileGenerator } from '../FunctionFileGenerator';
import { ApiParamType, IApiTransportTypeParamDefinition } from 'ts-api-decorators/dist/apiManagement/ApiDefinition';
import { IBinding, IBindingParam, IBindingTrigger } from '../Bindings';

export interface IFunctionJson {
	bindings: IBinding[];
	scriptFile: string;
}

export interface IFunctionJsonFileGeneratorOpts {
	triggers: IBindingTrigger[];
	params: IBindingParam[];
}

export class FunctionJsonFileGenerator implements IGenerator {
	public static readonly FILE_NAME = 'function.json';
	private readonly triggers: Map<string, IBindingTrigger> = new Map();
	private readonly params: Map<string, IBindingParam> = new Map();

	constructor(opts: IFunctionJsonFileGeneratorOpts) {
		for (const t of opts.triggers) {
			this.triggers.set(t.methodType, t);
		}

		for (const p of opts.params) {
			this.params.set(p.paramTypeId, p);
		}
	}

	public forRoutes(routes: IExtractedApiDefinitionWithMetadata[]): OutputFileGeneratorFunc {
		if (routes.length === 0) {
			throw new Error('Azure Function Generator can only generate for a single route');
		}

		return async () => Buffer.from(await this.generateRouteStr(routes[0]));
	}

	private async generateRouteStr(routes: IExtractedApiDefinitionWithMetadata): Promise<string> {
		return JSON.stringify(
			await this.generateRoutes(routes),
			undefined,
			4);
	}
	
	private generateRoutes(routes: IExtractedApiDefinitionWithMetadata): IFunctionJson {
		const trigger = this.getTriggerType(routes);
		return {
			bindings: [
				...trigger.getTriggerForRoute(routes),
				...this.getParamBindings(routes),
			],

			// TODO: Infer this somehow from tsconfig?
			scriptFile: FunctionFileGenerator.TS_FILE_NAME,
		};
	}

	private getParamBindings(route: IExtractedApiDefinitionWithMetadata): IBinding[] {
		const bindings: IBinding[] = [];
		for (const param of route.parameters) {
			if (param.type === ApiParamType.Transport) {
				if (!this.params.has(param.transportTypeId)) {
					throw new Error('Param binding not registered for param: ' + param.transportTypeId);
				}

				const binding = this.params.get(param.transportTypeId).getBindingForParam(param, route);
				if (binding) {
					bindings.push(binding);
				}
			}
		}

		return bindings;
	}

	private getTriggerType(route: IExtractedApiDefinitionWithMetadata): IBindingTrigger {
		if (!this.triggers.has(route.method)) {
			throw new Error('No trigger defined for route');
		}

		return this.triggers.get(route.method);
	}

	public getFilenameForFunction(functionName: string): string {
		return `${functionName}/${FunctionJsonFileGenerator.FILE_NAME}`;
	}
}