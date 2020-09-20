import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { IParseOptions } from '../command/ProgramOptions';
import transformer, { ITransformerArguments } from '../transformer';
import { IParseApiResult, CliCommand } from '../command/CliCommand';
import { TransformerType, compileSources, parseTsConfig } from './CompilationUtil';
import { ParsedCommandLine } from 'typescript';
import { IHandlerTreeNodeRoot, MergeHandlerTreeRoots } from '../transformer/HandlerTree';
import { IProgramInfo } from '../command/IProgramInfo';
import { PackageJson, getPackageJsonAuthor } from '../command/CommandUtil';

export class ApiParser {
	private static readonly DEFAULT_TSCONFIG = 'tsconfig.json';
	private tree: IHandlerTreeNodeRoot;
	
    public async parseApi(options: IParseOptions, transformerArgs: ITransformerArguments = {}): Promise<IParseApiResult> {
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
            options.tsconfig = ApiParser.DEFAULT_TSCONFIG;
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

    public loadTsConfig(tsConfig: string | undefined, resolvedRootDir: string): { tsConfig: ParsedCommandLine, path: string } {
        let config: string;
        if (tsConfig) {
            config = tsConfig;
        } else {
            config = ApiParser.DEFAULT_TSCONFIG;
        }

        const tsconfigPath = path.resolve(process.cwd(), config);
        if (!fs.existsSync(tsconfigPath)) {
            if (tsConfig) {
                throw new Error(`tsconfig does not exist: ${tsconfigPath}`);
            }

            return {
                tsConfig: {
                    options: ts.getDefaultCompilerOptions(),
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

    public loadApiInfo(apiInfoPath: string): IProgramInfo | undefined {
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
	
	public getTree(): IHandlerTreeNodeRoot | null {
		return this.tree || null;
	}
}