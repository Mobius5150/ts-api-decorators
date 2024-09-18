import { Command } from 'commander';
import { Swagger2Extractor } from './Swagger2Extractor';
import { CliCommand, IParseApiResult } from './CliCommand';
import { IParseOptions } from './ProgramOptions';
import { OpenApiV3Extractor } from './OpenApiV3';
import { ApiParser } from '../Util/ApiParser';

export interface IProgramOptions extends IParseOptions {
	type: string;
	outFile: string;
	silent: boolean;
}

export class ExtractCommand extends CliCommand {
	private apiParser: ApiParser;
	constructor(private readonly program: Command) {
		super();
		this.apiParser = new ApiParser();
		program
			.command('extract <rootDir>')
			.description('Extract api information from the program at rootDir.', {
				rootDir: 'The root directory or file of the program to extract. If directory, should be the directory that contains tsConfig',
			})
			.option('--tsconfig <file>', 'The tsconfig.json file to use when compiling')
			.option('--type <type>', 'The type of output to generate', (d, v) => this.validateProgramOutputType(d, v), 'openapiv3')
			.option('--outFile', 'The file to write output to')
			.option('--silent', "Don't output information", false)
			.option('--apiInfo <file>', 'File containing information for the API', 'package.json')
			.action((rootDir: string, options: IProgramOptions) =>
				this.runCommand({
					...options,
					rootDir,
				}),
			);
	}

	protected async runCommand(options: IProgramOptions) {
		const api = await this.apiParser.parseApi(options);
		let summary: string | Buffer;
		switch (options.type) {
			case 'summary':
				summary = this.printExtractionSummary(options, api, this.apiParser.getTree());
				break;

			case 'swagger2':
				summary = this.getSwaggerSummary(options, api);
				break;

			case 'openapiv3':
				summary = this.getOpenApiV3Summary(options, api);
				break;

			case 'json':
				summary = this.printJsonSummary(options, api);
				break;

			default:
				throw new Error('Unknown output type: ' + options.type);
		}

		this.printSummary(summary);
	}

	private printSummary(summary: string | Buffer) {
		console.log(summary instanceof Buffer ? summary.toString('utf8') : summary);
	}

	private printJsonSummary(options: IProgramOptions, api: IParseApiResult): string {
		throw new Error('Method not implemented.');
	}

	private getSwaggerSummary(options: IProgramOptions, api: IParseApiResult) {
		const extractor = new Swagger2Extractor(api.tree, api.programInfo, {});
		return extractor.toString();
	}

	private getOpenApiV3Summary(options: IProgramOptions, api: IParseApiResult) {
		const extractor = new OpenApiV3Extractor(api.tree, api.programInfo, {});
		return extractor.toString();
	}

	protected validateProgramOutputType(value: string, defaultValue: string) {
		switch (value) {
			case 'summary':
			case 'json':
			case 'swagger2':
			case 'openapiv3':
			case 'openapiv31':
				return value;

			case undefined:
				return defaultValue;

			default:
				throw new Error('Invalid value for `type`: ' + value);
		}
	}
}
