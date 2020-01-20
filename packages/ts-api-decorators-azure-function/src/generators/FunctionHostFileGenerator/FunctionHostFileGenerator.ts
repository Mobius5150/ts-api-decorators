import { IExtractedApiDefinitionWithMetadata } from 'ts-api-decorators/dist/transformer/ExtractionTransformer';
import { IGenerator, OutputFileGeneratorFunc } from 'ts-api-decorators/dist/generators/IGenerator';
import { FunctionFileGenerator } from '../FunctionFileGenerator';
import { ApiParamType, IApiTransportTypeParamDefinition } from 'ts-api-decorators/dist/apiManagement/ApiDefinition';
import { IBinding, IBindingParam, IBindingTrigger } from '../Bindings';
import { ParsedCommandLine } from 'typescript';
import * as path from 'path';
import { GeneratorUtil } from 'ts-api-decorators/dist/Util/GeneratorUtil';

export interface IFunctionJson {
	bindings: IBinding[];
	scriptFile: string;
}

export interface IFunctionJsonFileGeneratorOpts {
	setWatchDirectories?: boolean;
	tsConfig?: ParsedCommandLine;
	tsConfigPath?: string;
	triggers: IBindingTrigger[];
	params: IBindingParam[];
}

interface IFunctionHostFile {
	version: string;
	watchDirectories?: string[];
}

export class FunctionHostFileGenerator implements IGenerator {
	public static readonly FILE_NAME = 'host.json';
	private static readonly DEFAULT_FUNCTIONS_VERSION = '2.0';
	private static readonly JSON_PRETTY_PRINT_SPACE: string | number = 4;
	private readonly triggers: Map<string, IBindingTrigger> = new Map();
	private readonly params: Map<string, IBindingParam> = new Map();

	constructor(
		private readonly opts: IFunctionJsonFileGeneratorOpts
	) {
		for (const t of opts.triggers) {
			this.triggers.set(t.triggerMethod, t);
		}

		for (const p of opts.params) {
			this.params.set(p.paramTypeId, p);
		}
	}

	public forRoutes(routes: IExtractedApiDefinitionWithMetadata[]): OutputFileGeneratorFunc {
		if (routes.length === 0) {
			throw new Error('Azure Function Generator requires at least one route');
		}

		return async (currentFile) => Buffer.from(await this.generateHostJson(currentFile, routes));
	}

	private generateHostJson(currentFile: string, routes: IExtractedApiDefinitionWithMetadata[]): string {
		const hostfile: IFunctionHostFile = {
			version: FunctionHostFileGenerator.DEFAULT_FUNCTIONS_VERSION,
		};

		if (typeof this.opts.setWatchDirectories !== 'boolean' || this.opts.setWatchDirectories) {
			hostfile.watchDirectories = this.getWatchedDirectories(currentFile);
		}

		return JSON.stringify(hostfile, undefined, FunctionHostFileGenerator.JSON_PRETTY_PRINT_SPACE);
	}

	private getWatchedDirectories(currentFile: string): string[] {
		const dirs = [];
		const outputDir = this.getRelativePathOfOutputDirectory(currentFile);
		if (outputDir) {
			dirs.push(outputDir);
		}
		return dirs;
	}

	private getRelativePathOfOutputDirectory(currentFile: string): string {
		if (!this.opts.tsConfig) {
			return;
		}

		let outDir: string;
		if (this.opts.tsConfig.options.outDir) {
			outDir = this.opts.tsConfig.options.outDir;
		}

		if (this.opts.tsConfig.options.sourceRoot) {
			outDir = this.opts.tsConfig.options.sourceRoot;
		}

		if (outDir) {
			return GeneratorUtil.NormalizePathSlashes(
				path.relative(
					path.dirname(currentFile),
					outDir));
		}
	}

	public getFilename(): string {
		return `${FunctionHostFileGenerator.FILE_NAME}`;
	}
}