import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import transformer from '../transformer/transformers/extractionTransformer';
import { TransformerFuncType, compileSourcesFromTsConfigFile, getDefaultCompilerOptions, parseTsConfig, compileSources } from '../Util/CompilationUtil';
import { IApiDefinitionBase, ApiMethod } from '../apiManagement/ApiDefinition';
import { resolve } from 'dns';
import { ParsedCommandLine } from 'typescript';
import {OpenAPIV3} from 'openapi-types';
import { PackageJson } from './CommandUtil';
import { IExtractedApiDefinition } from '../transformer/ExtractionTransformer';
import { Swagger2Extractor } from './Swagger2Extractor';

export interface ProgramOptions {
    tsconfig: string;
    type: string;
    outFile: string;
    rootDir: string;
    isDir?: boolean;
    silent: boolean;
    apiInfo: string;
}

export class ExtractCommand {
    private static readonly DEFAULT_TSCONFIG = 'tsconfig.json';
    private console: typeof console = console;
    private extractedApis: IExtractedApiDefinition[] = [];
    private options: ProgramOptions;

    constructor(
        private readonly program: Command
    ) {
        program
            .command('extract <rootDir>')
            .description(
                'Extract api information from the program at rootDir.',
                {
                    'rootDir': 'The root directory or file of the program to extract. If directory, should be the directory that contains tsConfig',
                }
            )
            .option('--tsconfig <file>', 'The tsconfig.json file to use when compiling')
            .option('--type <type>', 'The type of output to generate', (d,v) => this.validateProgramOutputType(d, v), 'json')
            .option('--outFile', 'The file to write output to')
            .option('--silent', 'Don\'t output information', false)
            .option('--apiInfo <file>', 'File containing information for the API', 'package.json')
            .action((rootDir: string, options: ProgramOptions) => this.runCommand({
                ...options,
                rootDir,
            }));
    }

    protected async runCommand(options: ProgramOptions) {
        this.options = options;
        if (!fs.existsSync(options.rootDir)) {
            throw new Error(`File does not exist: ${options.rootDir}`);
        }

        const resolvedRootDir = path.resolve(process.cwd(), options.rootDir);
        const rootDirStat = fs.lstatSync(resolvedRootDir);
        options.isDir = rootDirStat.isDirectory();

        const transformers: TransformerFuncType[] = [
            program => transformer(program, apiMethod => this.onApiMethodExtracted(apiMethod)),
        ]
        
        const hasTsConfig = !!options.tsconfig;
        if (!hasTsConfig) {
            options.tsconfig = ExtractCommand.DEFAULT_TSCONFIG;
        }

        // this.disableConsoleOutput();
        if (options.isDir) {
            const tsConfig = this.loadTsConfig(resolvedRootDir);
            compileSources(
                tsConfig.fileNames, 
                {
                    ...tsConfig.options,
                    noEmit: true,
                }, transformers);
        } else {
            const tsConfig = this.loadTsConfig(path.dirname(resolvedRootDir));
            compileSources(
                [options.rootDir],
                {
                    ...tsConfig.options,
                    noEmit: true,
                }, transformers);
        }
        // this.enableConsoleOutput();

        switch (options.type) {
            case 'summary':
                this.printExtractionSummary();
                break;

            case 'swagger2':
                this.printSwaggerSummary();
                break;

            case 'json':
                this.printJsonSummary();
                break;
        }
        
    }

    private printJsonSummary() {
        throw new Error("Method not implemented.");
    }
    
    private printSwaggerSummary() {
        const extractor = new Swagger2Extractor(this.extractedApis, this.loadApiInfo())
        console.log(extractor.toString());
    }

    private loadTsConfig(resolvedRootDir: string): ParsedCommandLine {
        let config: string;
        if (this.options.tsconfig) {
            config = this.options.tsconfig;
        } else {
            config = ExtractCommand.DEFAULT_TSCONFIG;
        }

        const tsconfigPath = path.resolve(process.cwd(), config);
        if (!fs.existsSync(tsconfigPath)) {
            if (this.options.tsconfig) {
                throw new Error(`tsconfig does not exist: ${tsconfigPath}`);
            }

            return {
                options: getDefaultCompilerOptions(),
                errors: [],
                fileNames: []
            }
        }

        return parseTsConfig(resolvedRootDir, tsconfigPath);
    }

    private loadApiInfo(): OpenAPIV3.InfoObject {
        const file = path.resolve(process.cwd(), this.options.apiInfo);
        const infoBase: PackageJson = require(file);
        return {
            version: infoBase.version,
            title: infoBase.name,
            description: infoBase.description,
            contact: {
                name: infoBase.author,
            },
            license: {
                name: infoBase.license,
            }
        };
    }

    private disableConsoleOutput() {
        this.console = {...console};
        for (const key of Object.keys(console)) {
            if (typeof console[key] === 'function') {
                console[key] = () => {};
            }
        }
    }

    private enableConsoleOutput() {
        for (const key of Object.keys(this.console)) {
            if (typeof console[key] === 'function') {
                console[key] = this.console[key];
            }
        }
    }

    protected onApiMethodExtracted(method: IExtractedApiDefinition) {
        this.extractedApis.push(method);
    }

    protected printExtractionSummary() {
        if (this.options.silent) {
            return;
        }

        const Table = require('cli-table');
        const table = new Table({
            head: ['Method', 'Route'],
        });

        const methodRoutes = new Map<ApiMethod, Set<string>>();
        this.extractedApis.forEach(a => {
            if (!methodRoutes.has(a.method)) {
                methodRoutes.set(a.method, new Set<string>());
            }

            const methodMath = methodRoutes.get(a.method);
            if (!methodMath.has(a.route)) {
                methodMath.add(a.route);
                table.push([a.method, a.route]);
            }
        });

        this.console.log(table.toString());
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