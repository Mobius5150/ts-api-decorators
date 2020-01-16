import { IExtractedApiDefinitionWithMetadata } from 'ts-api-decorators/dist/transformer/ExtractionTransformer';
import { IGenerator, OutputFileGeneratorFunc } from 'ts-api-decorators/dist/generators/IGenerator';
import { MustacheFileGenerator } from 'ts-api-decorators/dist/generators/MustacheFileGenerator';
import { ParsedCommandLine } from 'typescript';
import * as stripDirs from 'strip-dirs';
import * as path from 'path';

export interface IFunctionFileGeneratorOpts {
	tsConfig?: ParsedCommandLine;
	tsConfigPath?: string;
}

export class FunctionFileGenerator implements IGenerator {
	public static readonly FILE_NAME = 'index.js';
	private static readonly TEMPLATE_NAME = `${FunctionFileGenerator.FILE_NAME}.mustache`;
	private readonly mustacheGenerator: MustacheFileGenerator;

	constructor(
		private opts: IFunctionFileGeneratorOpts,
	) {
		this.mustacheGenerator = new MustacheFileGenerator(
			path.join(__dirname, FunctionFileGenerator.TEMPLATE_NAME));
	}

	public forRoutes(routes: IExtractedApiDefinitionWithMetadata[]): OutputFileGeneratorFunc {
		return (p) => this.mustacheGenerator.generate({
			routes: routes.map(route => ({
				scriptFile: () => this.getScriptFilePathGenerator(p, route),
				route,
			}))
		});
	}

	private getScriptFilePathGenerator(p: string, route: IExtractedApiDefinitionWithMetadata) {
		let routeFile = route.file;
		if (this.opts.tsConfig && this.opts.tsConfig.options && typeof this.opts.tsConfig.options.outDir === 'string') {
			const baseDir = path.dirname(this.opts.tsConfigPath);
			routeFile = path.join(
				this.opts.tsConfig.options.outDir,
				stripDirs(routeFile.substr(baseDir.length + 1), 1));
		}

		return (
			path.relative(
				path.dirname(p),
				path.join(
					path.dirname(routeFile),
					path.basename(routeFile, path.extname(routeFile))
				)
			).replace(/\\/g, '/')
		);
	}

	public getFilenameForFunction(functionName: string): string {
		return `${functionName}/${FunctionFileGenerator.FILE_NAME}`;
	}
}