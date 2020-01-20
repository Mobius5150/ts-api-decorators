import { IExtractedApiDefinitionWithMetadata } from 'ts-api-decorators/dist/transformer/ExtractionTransformer';
import { IGenerator, OutputFileGeneratorFunc } from 'ts-api-decorators/dist/generators/IGenerator';
import { MustacheFileGenerator } from 'ts-api-decorators/dist/generators/MustacheFileGenerator';
import { GeneratorUtil } from 'ts-api-decorators/dist/Util/GeneratorUtil';
import { ParsedCommandLine } from 'typescript';
import * as stripDirs from 'strip-dirs';
import * as path from 'path';
import { IBindingTrigger, IBindingParam } from '../Bindings';

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

	public forRoutes(routes: IExtractedApiDefinitionWithMetadata[]): OutputFileGeneratorFunc {
		return (p) => this.mustacheGenerator.generate({
			scriptFiles: Array.from(new Set(routes.map(r => r.file))).map(f => this.getScriptFilePathGenerator(p, f)),
			triggerType: this.getTriggerTypeForRoutes(routes).triggerType,
			route: this.getRoute(routes),
			methods: routes.map(route => route.method),
		});
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

	private getRoute(routes: IExtractedApiDefinitionWithMetadata[]) {
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

	private getTriggerTypeForRoutes(routes: IExtractedApiDefinitionWithMetadata[]): IBindingTrigger {
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

	private getTriggerType(route: IExtractedApiDefinitionWithMetadata): IBindingTrigger {
		if (!this.triggers.has(route.method)) {
			throw new Error('No trigger defined for route');
		}

		return this.triggers.get(route.method);
	}
}