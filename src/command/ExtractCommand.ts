import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import transformer from '../transformer/transformers/extractionTransformer';
import { TransformerFuncType, compileSourcesFromTsConfigFile } from '../Util/CompilationUtil';
import { IApiDefinitionBase, ApiMethod } from '../apiManagement/ApiDefinition';

export interface ProgramOptions {
    tsconfig: string;
    type: string;
    outFile: string;
    rootDir: string;
    isDir?: boolean;
}

export class ExtractCommand {
    private console: typeof console = console;
    private extractedApis: IApiDefinitionBase[] = [];

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
        .option('--tsconfig <file>', 'The tsconfig.json file to use when compiling', 'tsconfig.json')
        .option('--type', 'The type of output to generate', value => this.validateProgramOutputType(value), 'json')
        .option('--outFile', 'The file to write output to')
        .action((rootDir: string, options: ProgramOptions) => this.runCommand({
            ...options,
            rootDir,
        }));
    }

    protected async runCommand(options: ProgramOptions) {
        if (!fs.existsSync(options.rootDir)) {
            throw new Error(`File does not exist: ${options.rootDir}`);
        }

        const resolvedRootDir = path.resolve(options.rootDir, process.cwd());
        const rootDirStat = fs.lstatSync(resolvedRootDir);
        options.isDir = rootDirStat.isDirectory();

        const transformers: TransformerFuncType[] = [
            program => transformer(program, apiMethod => this.onApiMethodExtracted(apiMethod)),
        ]
        
        if (options.isDir) {
            const tsconfigPath = path.join(resolvedRootDir, options.tsconfig);
            if (fs.existsSync(tsconfigPath)) {
                this.disableConsoleOutput();
                await compileSourcesFromTsConfigFile(resolvedRootDir, tsconfigPath, transformers);
                this.enableConsoleOutput();
                this.printExtractionSummary();
            } else {
                console.log('tsconfig not found');
            }
            
            // compileSourcesDir(options.rootDir,)
        }
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

    protected onApiMethodExtracted(method: IApiDefinitionBase) {
        this.extractedApis.push(method);
    }

    protected printExtractionSummary() {
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

    protected validateProgramOutputType(value) {
        switch (value) {
            case 'json':
                return value;
    
            default:
                throw new Error('Invalid value for `type`: ' + value);
        }
    }
}