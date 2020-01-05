import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { CliCommand, IParseApiResult } from 'ts-api-decorators/dist/command/CliCommand';
import { OutputFileGenerator } from 'ts-api-decorators/dist/generators/OutputFileGenerator';
import { IParseOptions } from 'ts-api-decorators/dist/command/ProgramOptions';
import { FunctionFileGenerator } from '../generators/FunctionFileGenerator';
import { FunctionJsonFileGenerator } from '../generators/FunctionJsonFileGenerator';
import { ApiMethod } from 'ts-api-decorators';
import { IExtractedApiDefinitionWithMetadata } from 'ts-api-decorators/dist/transformer/ExtractionTransformer';
import { HttpBindingTriggerFactory } from '../generators/Bindings/HttpBinding';

export interface IAzureFunctionGenerateCommandOptions extends IParseOptions {
    outDir: string;
    silent: boolean;
    verbose: boolean;
}

export class AzureFunctionGenerateCommand extends CliCommand {
    constructor(
        private readonly program: Command
    ) {
        super();
        program
            .command('azfunc-generate <rootDir> <outDir>')
            .description(
                'Output an Azure Function app',
                {
					'rootDir': 'The root directory or file of the program. If directory, should be the directory that contains tsConfig',
					'outDir': 'A directory to output the Azure function to',
                }
            )
            .option('--tsconfig <file>', 'The tsconfig.json file to use when compiling')
            .option('--silent', 'Don\'t output information', false)
            .option('--verbose', 'Write extra output information', false)
            .option('--apiInfo <file>', 'File containing information for the API', 'package.json')
            .action((rootDir: string, outDir: string, options: IAzureFunctionGenerateCommandOptions) => this.runCommand({
                ...options,
                rootDir,
                outDir,
            }));
    }

    protected async runCommand(options: IAzureFunctionGenerateCommandOptions) {
        const api = await this.parseApi(options);
        if (!options.silent) {
            let summary: string | Buffer = this.printExtractionSummary(options, api);
            this.printSummary(summary);
        }
        
        const outGenerator = new OutputFileGenerator(options.outDir);
        // const functionGen = new FunctionFileGenerator();
        const functionJsonGen = new FunctionJsonFileGenerator({
            triggers: [
                HttpBindingTriggerFactory.GetBindingForMethod(ApiMethod.GET),
                HttpBindingTriggerFactory.GetBindingForMethod(ApiMethod.PUT),
                HttpBindingTriggerFactory.GetBindingForMethod(ApiMethod.POST),
                HttpBindingTriggerFactory.GetBindingForMethod(ApiMethod.DELETE),
            ],
            params: [],
        });

        const routes = new Map<string, IExtractedApiDefinitionWithMetadata>();
        for (const route of api.extractedApis) {
            const baseRouteName = `${route.method}_${route.handlerKey.toString()}`;
            let routeName = baseRouteName;
            let attempt = 0;
            while (routes.has(routeName)) {
                routeName = baseRouteName + '_' + ++attempt;
            }

            routes.set(routeName, route);
            outGenerator.addOutputFile(`${routeName}/function.json`, functionJsonGen.forRoutes([route]));
            // outGenerator.addOutputFile(`${routeFolderName}/index.ts`, functionGen.forRoutes(routes))
        }

        const written = await outGenerator.generate();
        if (options.verbose) {
            console.log('Wrote output files: ');
            for (const f of written) {
                console.log(f);
            }
        }
    }

    private printSummary(summary: string | Buffer) {
        console.log(summary instanceof Buffer ? summary.toString('utf8') : summary);
    }

    protected validateProgramOutputType(value: string, defaultValue: string) {
        switch (value) {
            case 'summary':
            case 'json':
            case 'swagger2':
                return value;

            case undefined:
                return defaultValue;

            default:
                throw new Error('Invalid value for `type`: ' + value);
        }
    }
}