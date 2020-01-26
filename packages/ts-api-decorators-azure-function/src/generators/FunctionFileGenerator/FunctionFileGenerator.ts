import { IGenerator, OutputFileGeneratorFunc } from 'ts-api-decorators/dist/generators/IGenerator';
import { MustacheFileGenerator } from 'ts-api-decorators/dist/generators/MustacheFileGenerator';
import { GeneratorUtil } from 'ts-api-decorators/dist/Util/GeneratorUtil';
import { ParsedCommandLine } from 'typescript';
import { IBindingTrigger, IBindingParam } from '../Bindings';
import { IHandlerTreeNode, isHandlerNode, IHandlerTreeNodeHandler } from 'ts-api-decorators/dist/transformer/HandlerTree';
import * as path from 'path';

export interface IFunctionFileGeneratorOpts {
	tsConfig?: ParsedCommandLine;
	tsConfigPath?: string;
	triggers: IBindingTrigger[];
	params: IBindingParam[];
}

export class FunctionFileGenerator implements IGenerator {
	public static readonly FILE_NAME = 'index.js';
	private static readonly TEMPLATE_NAME = `${FunctionFileGenerator.FILE_NAME}.mustache`;
	private readonly mustacheGenerator: MustacheFileGenerator;
	private readonly triggers: Map<string, IBindingTrigger> = new Map();
	private readonly params: Map<string, IBindingParam> = new Map();

	constructor(
		private opts: IFunctionFileGeneratorOpts,
	) {
		this.mustacheGenerator = new MustacheFileGenerator(
			path.join(__dirname, FunctionFileGenerator.TEMPLATE_NAME));

		for (const t of opts.triggers) {
			this.triggers.set(t.triggerMethod, t);
		}

		for (const p of opts.params) {
			this.params.set(p.paramTypeId, p);
		}
	}

	public forTree(routes: IHandlerTreeNode[]): OutputFileGeneratorFunc {
		const handlerNodes = routes.filter(isHandlerNode);
		return (p) => this.mustacheGenerator.generate({
			scriptFiles: this.getSourceFilesForRoutes(handlerNodes, p),
			triggerType: this.getTriggerTypeForRoutes(handlerNodes).triggerType,
			route: this.getRoute(handlerNodes),
			methods: handlerNodes.map(route => route.apiMethod),
		});
	}

	getSourceFilesForRoutes(routes: IHandlerTreeNodeHandler[], p: string): string[] {
		const routeArray = new Set<string>();
		for (const route of routes) {
			const scriptPath = this.getScriptFilePathGenerator(p, route.location.file);
			if (!routeArray.has(scriptPath)) {
				routeArray.add(scriptPath);
			}
		}

		return Array.from(routeArray);
	}

	private getScriptFilePathGenerator(p: string, routeFile: string) {
		return (
			GeneratorUtil.NormalizePathSlashes(
				path.relative(
					path.dirname(p),
					GeneratorUtil.GetTsFileOutputPath(this.opts.tsConfig, this.opts.tsConfigPath, routeFile)
				)
			)
		);
	}

	public getFilenameForFunction(functionName: string): string {
		return `${functionName}/${FunctionFileGenerator.FILE_NAME}`;
	}

	private getRoute(routes: IHandlerTreeNodeHandler[]) {
		if (routes.length === 0) {
			throw new Error('Must have at least one route');
		}

		const route = routes[0];
		for (let i = 1; i < routes.length; ++i) {
			if (route.route !== routes[i].route) {
				throw new Error('All routes in a function file must have the same route');
			}
		}

		return route.route;
	}

	private getTriggerTypeForRoutes(routes: IHandlerTreeNodeHandler[]): IBindingTrigger {
		if (routes.length === 0) {
			throw new Error('Must have at least one route');
		}

		const trigger = this.getTriggerType(routes[0]);
		for (let i = 1; i < routes.length; ++i) {
			if (trigger.triggerType !== this.getTriggerType(routes[i]).triggerType) {
				throw new Error('All routes in a function file must have the same trigger type');
			}
		}

		return trigger;
	}

	private getTriggerType(route: IHandlerTreeNodeHandler): IBindingTrigger {
		if (!this.triggers.has(route.apiMethod)) {
			throw new Error('No trigger defined for route');
		}

		return this.triggers.get(route.apiMethod);
	}
}