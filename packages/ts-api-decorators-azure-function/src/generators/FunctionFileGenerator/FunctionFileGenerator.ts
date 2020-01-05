import { IExtractedApiDefinitionWithMetadata } from 'ts-api-decorators/dist/transformer/ExtractionTransformer';
import { IGenerator, OutputFileGeneratorFunc } from 'ts-api-decorators/dist/generators/IGenerator';
import { MustacheFileGenerator } from 'ts-api-decorators/dist/generators/MustacheFileGenerator';
import * as path from 'path';

export class FunctionFileGenerator implements IGenerator {
	public static readonly TS_FILE_NAME = 'index.ts';
	private static readonly TEMPLATE_NAME = `${FunctionFileGenerator.TS_FILE_NAME}.mustache`;
	private readonly mustacheGenerator: MustacheFileGenerator;

	constructor() {
		this.mustacheGenerator = new MustacheFileGenerator(
			path.join(__dirname, FunctionFileGenerator.TEMPLATE_NAME));
	}

	public forRoutes(routes: IExtractedApiDefinitionWithMetadata[]): OutputFileGeneratorFunc {
		return () => this.mustacheGenerator.generate({
			scriptFile: FunctionFileGenerator.TS_FILE_NAME,
			routes,
		});
	}

	public getFilenameForFunction(functionName: string): string {
		return `${functionName}/${FunctionFileGenerator.TS_FILE_NAME}`;
	}
}