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
	public static readonly TS_FILE_NAME = 'index.ts';
	private static readonly TEMPLATE_NAME = `${FunctionFileGenerator.TS_FILE_NAME}.mustache`;
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
		// TODO: This generates the path to the source file, but instead we want to generate the path to the compiled file. Either something like:
		// 		{tsconfig.outDir}/**/sourceFile.js
		// or   source/file/path/sourceFile.js
		let routeFile = route.file;
		if (this.opts.tsConfig && this.opts.tsConfig.options && typeof this.opts.tsConfig.options.outDir === 'string') {
			const outDir = this.opts.tsConfig.options.outDir;
			const baseDir = path.dirname(this.opts.tsConfigPath);
			const pDir: string = stripDirs(routeFile.substr(baseDir.length + 1), 1);
			console.log({
				p,
				outDir,
				baseDir,
				pDir,
			});
			routeFile = path.join(outDir, pDir);
		} else {
			throw new Error('Not implemented');
		}
		return (
			path.relative(p,
				path.join(
					path.dirname(routeFile),
					path.basename(routeFile, path.extname(FunctionFileGenerator.TS_FILE_NAME)))
			).replace(/\\/g, '\\\\')
		);
	}

	public getFilenameForFunction(functionName: string): string {
		return `${functionName}/${FunctionFileGenerator.TS_FILE_NAME}`;
	}
}