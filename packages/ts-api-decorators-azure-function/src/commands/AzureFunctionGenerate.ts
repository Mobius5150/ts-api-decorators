import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { CliCommand, IParseApiResult } from 'ts-api-decorators/dist/command/CliCommand';
import { OutputFileGenerator } from 'ts-api-decorators/dist/generators/OutputFileGenerator';
import { IParseOptions } from 'ts-api-decorators/dist/command/ProgramOptions';
import { FunctionFileGenerator } from '../generators/FunctionFileGenerator';
import { FunctionJsonFileGenerator, IFunctionJsonFileGeneratorOpts } from '../generators/FunctionJsonFileGenerator';
import { ApiMethod } from 'ts-api-decorators';
import { HttpBindingTriggerFactory } from '../generators/Bindings/HttpBinding';
import { NArgReducer } from '../Util/NArgReducer';
import { IBinding, IBindingTrigger } from '../generators/Bindings';
import { FunctionHostFileGenerator } from '../generators/FunctionHostFileGenerator';
import { IHandlerTreeNode, WalkChildrenByType, isHandlerNode } from 'ts-api-decorators/dist/transformer/HandlerTree';
import { getMetadataValueByDescriptor, BuiltinMetadata } from 'ts-api-decorators/dist/transformer/TransformerMetadata';
import { FunctionExtensionJsonFileGenerator } from '../generators/FunctionExtensionJsonFileGenerator';
import { TimerBindingTriggerFactory } from '../generators/Bindings/TimerBinding';
import { getTransformerArguments } from '../transformer';
import { BlobStorageBindingTriggerFactory, BlobStorageBindingParamFactory } from '../generators/Bindings/BlobStorageBinding';

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
        const api = await this.parseApi(options, getTransformerArguments());
        if (!options.silent) {
            let summary: string | Buffer = this.printExtractionSummary(options, api);
            this.printSummary(summary);
        }
        
        const generatorOpts: IFunctionJsonFileGeneratorOpts = {
            triggers: [
                HttpBindingTriggerFactory.GetBindingForMethod(ApiMethod.GET),
                HttpBindingTriggerFactory.GetBindingForMethod(ApiMethod.PUT),
                HttpBindingTriggerFactory.GetBindingForMethod(ApiMethod.POST),
                HttpBindingTriggerFactory.GetBindingForMethod(ApiMethod.DELETE),
                TimerBindingTriggerFactory.GetBinding(),
                BlobStorageBindingTriggerFactory.GetTriggerBinding(),
            ],
            params: [
                TimerBindingTriggerFactory.GetParamBinding(),
                ...BlobStorageBindingParamFactory.GetParamBindings(),
            ],
        };
        const outGenerator = new OutputFileGenerator(options.outDir);
        const hostGen = new FunctionHostFileGenerator({ ...generatorOpts, tsConfig: api.tsConfig });
        const extensionGen = new FunctionExtensionJsonFileGenerator();
        const functionGen = new FunctionFileGenerator({ ...generatorOpts, tsConfig: api.tsConfig, tsConfigPath: api.tsConfigPath });
        const functionJsonGen = new FunctionJsonFileGenerator(generatorOpts);

        // TODO: Actually check on the binding triggers and parameter types for each method
        const reducer = new NArgReducer<[string, string, ...IBindingTrigger[]], IHandlerTreeNode>()
        const routeNames = new Set<string>();
        for (const route of WalkChildrenByType(api.tree, isHandlerNode)) {
            let methodType: string = getMetadataValueByDescriptor(route.metadata, BuiltinMetadata.ApiMethodType);
            if (!methodType) {
                throw new Error(`Unknown http method type: ${methodType}`);
            }

            reducer.add([methodType, route.route], route);
        }

        outGenerator.addOutputFile(hostGen.getFilename(), hostGen.forTree([api.tree]));
        outGenerator.addOutputFile(extensionGen.getFilename(), extensionGen.forTree([api.tree]));
        for (let [[method, route, ...bindings], routes] of reducer.getReduced()) {
            route = route.startsWith('/') ? route.substr(1) : route;
            const baseRouteName = `${route.replace(/[^-a-zA-Z0-9_]/g, '_').toString()}`;
            let routeName = baseRouteName;
            let attempt = 0;
            while (routeNames.has(routeName)) {
                routeName = baseRouteName + '_' + ++attempt;
            }

            routeNames.add(routeName);
            outGenerator.addOutputFile(functionJsonGen.getFilenameForFunction(routeName), functionJsonGen.forTree(routes));
            outGenerator.addOutputFile(functionGen.getFilenameForFunction(routeName), functionGen.forTree(routes))
        }

        const written = await outGenerator.generate();
        if (options.verbose) {
            console.log('Wrote output files: ');
            for (const f of written) {
                console.log('\t', f);
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