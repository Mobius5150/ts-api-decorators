import { IGenerator, OutputFileGeneratorFunc } from 'ts-api-decorators/dist/generators/IGenerator';
import { FunctionFileGenerator } from '../FunctionFileGenerator';
import { ApiParamType, IApiTransportTypeParamDefinition } from 'ts-api-decorators/dist/apiManagement/ApiDefinition';
import { IBinding, IBindingParam, IBindingTrigger } from '../Bindings';
import { IHandlerTreeNode, IHandlerTreeNodeHandler, isHandlerNode, WalkChildrenByType, isHandlerParameterNode } from 'ts-api-decorators/dist/transformer/HandlerTree';

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
	private static readonly JSON_PRETTY_PRINT_SPACE: string | number = 4;
	private readonly triggers: Map<string, IBindingTrigger> = new Map();
	private readonly params: Map<string, IBindingParam> = new Map();

	constructor(opts: IFunctionJsonFileGeneratorOpts) {
		for (const t of opts.triggers) {
			this.triggers.set(t.triggerMethod, t);
		}

		for (const p of opts.params) {
			this.params.set(p.paramTypeId, p);
		}
	}

	public forTree(routes: IHandlerTreeNode[]): OutputFileGeneratorFunc {
		if (routes.length === 0) {
			throw new Error('Azure Function Generator requires at least one route');
		}

		return async () => Buffer.from(await this.generateRouteStr(routes.filter(isHandlerNode)));
	}

	private async generateRouteStr(routes: IHandlerTreeNodeHandler[]): Promise<string> {
		return JSON.stringify(this.generateRoutes(routes), undefined, FunctionJsonFileGenerator.JSON_PRETTY_PRINT_SPACE);
	}
	
	private generateRoutes(routes: IHandlerTreeNodeHandler[]): IFunctionJson {
		// TODO: This whole method isn't smart enough to handle a route with multiple triggers (e.g. http and queue trigger)
		const triggers = routes.map(r => this.getTriggerType(r));
		const routePaths = new Set(routes.map(r => r.route));
		if (new Set(triggers.map(r => r.triggerType)).size !== 1) {
			throw new Error('FunctionJsonFileGenerator can only accept one trigger type per function file');
		}

		if (routePaths.size !== 1) {
			throw new Error('FunctionJsonFileGenerator can only accept one route per function file');
		}

		return {
			bindings: [
				...triggers[0].getBindingForRoutes(routes),
				...this.getParamBindings(routes),
			],

			// Assumed to always be in the same directory
			scriptFile: `./${FunctionFileGenerator.FILE_NAME}`,
		};
	}

	private getParamBindings(routes: IHandlerTreeNodeHandler[]): IBinding[] {
		const routeBindings = routes.map(route => {
			const bindings: IBinding[] = [];
			for (const param of WalkChildrenByType(route, isHandlerParameterNode)) {
				if (param.paramDef.type === ApiParamType.Transport) {
					if (!this.params.has(param.paramDef.transportTypeId)) {
						throw new Error('Param binding not registered for param: ' + param.paramDef.transportTypeId);
					}

					const bindingDef = this.params.get(param.paramDef.transportTypeId);
					if (bindingDef.getBindingForParam) {
						const binding = bindingDef.getBindingForParam(param.paramDef, route);
						if (Array.isArray(binding)) {
							bindings.push(...binding);
						} else if (binding) {
							bindings.push(binding);
						}
					}
				}
			}

			return bindings;
		});

		const bindings = routeBindings.shift();
		for (const bind of routeBindings) {
			const routeSet = new Set(bind.concat(bindings));
			if (routeSet.size !== bindings.length) {
				throw new Error('FunctionJsonFileGenerator All routes with the same path must have the same bindings');
			}
		}

		return bindings;
	}

	private getTriggerType(route: IHandlerTreeNodeHandler): IBindingTrigger {
		if (!this.triggers.has(route.apiMethod)) {
			throw new Error('No trigger defined for route');
		}

		return this.triggers.get(route.apiMethod);
	}

	public getFilenameForFunction(functionName: string): string {
		return `${functionName}/${FunctionJsonFileGenerator.FILE_NAME}`;
	}
}