import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { getDefaultCompilerOptions, parseTsConfig, compileSources, TransformerType } from '../Util/CompilationUtil';
import { ParsedCommandLine } from 'typescript';
import { PackageJson, getPackageJsonAuthor } from './CommandUtil';
import { IProgramInfo } from './IProgramInfo';
import { IParseOptions } from './ProgramOptions';
import { ApiMethod } from '..';
import transformer, { ITransformerArguments } from '../transformer';
import { IHandlerTreeNodeRoot, WalkTreeByType, isHandlerNode, IHandlerTreeNodeHandler, MergeHandlerTreeRoots } from '../transformer/HandlerTree';

export interface IParseApiResult {
    compilationResult: { [path: string]: ts.TransformationResult<ts.Node> };
    tree: IHandlerTreeNodeRoot;
    programInfo: IProgramInfo;
    tsConfig?: ParsedCommandLine;
    tsConfigPath?: string;
}

export abstract class CliCommand {
    private static readonly DEFAULT_TSCONFIG = 'tsconfig.json';
    private console: typeof console = console;
    private tree: IHandlerTreeNodeRoot;

    protected async wrapCliError(f: Function) {
        try {
            await f();
        } catch (e) {
            this.handleError(e);
            throw e;
        }
    }

    protected async handleError(err: any) {
        console.error('Error processing command: ');
        console.error(err);
    }

    protected async parseApi(options: IParseOptions, transformerArgs: ITransformerArguments = {}): Promise<IParseApiResult> {
        if (!fs.existsSync(options.rootDir)) {
            throw new Error(`File does not exist: ${options.rootDir}`);
        }

        const resolvedRootDir = path.resolve(process.cwd(), options.rootDir);
        const rootDirStat = fs.lstatSync(resolvedRootDir);
        options.isDir = rootDirStat.isDirectory();

        const transformers: TransformerType[] = [
            program => transformer(program, {
                ...transformerArgs,
                onTreeExtracted: (err, tree) => this.onTreeExtracted(tree)
            }),
        ]
        
        const hasTsConfig = !!options.tsconfig;
        if (!hasTsConfig) {
            options.tsconfig = CliCommand.DEFAULT_TSCONFIG;
        }

        let compilationResult = null;
        let tsConfig: ParsedCommandLine;
        let tsConfigPath: string;
        if (options.isDir) {
            const loadedConfig = this.loadTsConfig(options.tsconfig, resolvedRootDir);
            tsConfig = loadedConfig.tsConfig;
            tsConfigPath = loadedConfig.path;
            compilationResult = compileSources(
                tsConfig.fileNames, 
                {
                    ...tsConfig.options,
                    noEmit: true,
                }, transformers);
        } else {
            const loadedConfig = this.loadTsConfig(options.tsconfig, path.dirname(resolvedRootDir));
            tsConfig = loadedConfig.tsConfig;
            tsConfigPath = loadedConfig.path;
            compilationResult = compileSources(
                [options.rootDir],
                {
                    ...tsConfig.options,
                    noEmit: true,
                }, transformers);
        }

        return {
            tsConfig,
            tsConfigPath,
            compilationResult,
            tree: this.tree,
            programInfo: this.loadApiInfo(options.apiInfo),
        };
    }
    
    private onTreeExtracted(tree: IHandlerTreeNodeRoot): void {
        this.tree = MergeHandlerTreeRoots(this.tree, tree);
    }

    private loadTsConfig(tsConfig: string | undefined, resolvedRootDir: string): { tsConfig: ParsedCommandLine, path: string } {
        let config: string;
        if (tsConfig) {
            config = tsConfig;
        } else {
            config = CliCommand.DEFAULT_TSCONFIG;
        }

        const tsconfigPath = path.resolve(process.cwd(), config);
        if (!fs.existsSync(tsconfigPath)) {
            if (tsConfig) {
                throw new Error(`tsconfig does not exist: ${tsconfigPath}`);
            }

            return {
                tsConfig: {
                    options: getDefaultCompilerOptions(),
                    errors: [],
                    fileNames: []
                },
                path: tsconfigPath,
            }
        }

        return {
            tsConfig: parseTsConfig(path.dirname(tsconfigPath), tsconfigPath),
            path: tsconfigPath,
        };
    }

    private loadApiInfo(apiInfoPath: string): IProgramInfo | undefined {
        if (typeof apiInfoPath !== 'string') {
            return undefined;
        }

        const file = path.resolve(process.cwd(), apiInfoPath);
        if (!fs.existsSync(file)) {
            return undefined;
        }

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

    protected disableConsoleOutput() {
        this.console = {...console};
        for (const key of Object.keys(console)) {
            if (typeof console[key] === 'function') {
                console[key] = () => {};
            }
        }
    }

    protected enableConsoleOutput() {
        for (const key of Object.keys(this.console)) {
            if (typeof console[key] === 'function') {
                console[key] = this.console[key];
            }
        }
    }

    protected printExtractionSummary(options: IParseOptions, api: IParseApiResult): string {
        const Table = require('cli-table');
        const table = new Table({
            head: ['Method', 'Route', 'File'],
        });

        const methodRoutes = new Map<ApiMethod, Set<string>>();
        for (const handler of WalkTreeByType(this.tree, isHandlerNode)) {
            if (!methodRoutes.has(handler.apiMethod)) {
                methodRoutes.set(handler.apiMethod, new Set<string>());
            }

            const methodMath = methodRoutes.get(handler.apiMethod);
            if (!methodMath.has(handler.route)) {
                methodMath.add(handler.route);
                table.push([handler.apiMethod, handler.route, handler.location.file]);
            }
        };

        return table.toString();
    }
}