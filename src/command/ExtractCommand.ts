import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import transformer from '../transformer/transformers/extractionTransformer';
import { TransformerFuncType, compileSourcesFromTsConfigFile, getDefaultCompilerOptions, parseTsConfig, compileSources } from '../Util/CompilationUtil';
import { IApiDefinitionBase, ApiMethod } from '../apiManagement/ApiDefinition';
import { resolve } from 'dns';
import { ParsedCommandLine } from 'typescript';
import {OpenAPIV3, OpenAPIV2} from 'openapi-types';
import { PackageJson, getPackageJsonAuthor } from './CommandUtil';
import { IExtractedApiDefinitionWithMetadata } from '../transformer/ExtractionTransformer';
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

export interface ContactObject {
    name?: string;
    url?: string;
    email?: string;
}

export interface LicenseObject {
    name: string;
    url?: string;
}

export interface ProgramApiInfo {
    /**
     * The title of the API
     */
    title: string;

    /**
     * The main homepage for the API
     */
    homepage?: string;

    /**
     * A description of the API
     */
    description?: string;

    /**
     * A link to the terms of service for the API
     */
    termsOfService?: string;

    /**
     * Contact information for questions regarding the API
     */
    contact?: ContactObject;

    /**
     * One or more licenses that apply to the API and SDK
     */
    license?: LicenseObject[];

    /**
     * The version of the API
     */
    version: string;

    /**
     * The host the API can be found at
     */
    host?: string;

    /**
     * The base path for all api methods
     */
    basePath?: string;

    /**
     * Http schemes for accessing the api
     */
    schemes?: string[];
}

export class ExtractCommand {
    private static readonly DEFAULT_TSCONFIG = 'tsconfig.json';
    private console: typeof console = console;
    private extractedApis: IExtractedApiDefinitionWithMetadata[] = [];
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
            program => transformer(program, {
                onApiMethodExtracted: apiMethod => this.onApiMethodExtracted(apiMethod)
            }),
        ]
        
        const hasTsConfig = !!options.tsconfig;
        if (!hasTsConfig) {
            options.tsconfig = ExtractCommand.DEFAULT_TSCONFIG;
        }

        this.disableConsoleOutput();
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
        this.enableConsoleOutput();

        let summary: string | Buffer;
        switch (options.type) {
            case 'summary':
                summary = this.printExtractionSummary();
                break;

            case 'swagger2':
                summary = this.getSwaggerSummary();
                break;

            case 'json':
                summary = this.printJsonSummary();
                break;

            default:
                throw new Error('Unknown output type: ' + options.type);
        }
        
        this.printSummary(summary);
    }

    private printSummary(summary: string | Buffer) {
        console.log(summary instanceof Buffer ? summary.toString('utf8') : summary);
    }

    private printJsonSummary(): string {
        throw new Error("Method not implemented.");
    }
    
    private getSwaggerSummary() {
        const extractor = new Swagger2Extractor(this.extractedApis, this.loadApiInfo(), {});
        return extractor.toString();
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

    private loadApiInfo(): ProgramApiInfo {
        const file = path.resolve(process.cwd(), this.options.apiInfo);
        const infoBase: PackageJson = require(file);
        return {
            version: infoBase.version,
            title: infoBase.name,
            description: infoBase.description,
            contact: getPackageJsonAuthor(infoBase),
            license: [
                {
                    name: infoBase.license,
                }
            ],
            homepage: infoBase.homepage,
            basePath: infoBase.basePath,
            host: infoBase.host,
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

    protected onApiMethodExtracted(method: IExtractedApiDefinitionWithMetadata) {
        this.extractedApis.push(method);
    }

    protected printExtractionSummary(): string {
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

        return table.toString();
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