import { asyncGlob } from "./AsyncGlob";
import * as glob from 'glob';
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { readFileSync } from "fs";
import { ITransformerArguments } from "../transformer";

export type TransformerType = (program: ts.Program, args?: ITransformerArguments) => ts.TransformerFactory<ts.SourceFile>;
// export type TransformerFuncType = (p: ts.Program) => TransformerType;

interface TsConfigFileRaw {
	compilerOptions: ts.CompilerOptions;
	files?: string[];
	include?: string[];
	exclude?: string[];
	extends?: string;
}

interface TsConfig {
	compilerOptions: ts.CompilerOptions;
	files: string[];
}

export function getDefaultCompilerOptions(): ts.CompilerOptions {
	return {
		module: ts.ModuleKind.CommonJS,
		noEmitOnError: true,
		noImplicitAny: false,
		experimentalDecorators: true,
		target: ts.ScriptTarget.ES2015,
		downlevelIteration: true,
		sourceMap: true,
		
	}
}

export class TsConfigParserHost implements ts.ParseConfigHost {
	useCaseSensitiveFileNames: boolean = true;

	readDirectory(rootDir: string, extensions: readonly string[], excludes: readonly string[], includes: readonly string[], depth?: number): readonly string[] {
		// TODO: Depth support
		const globPattern = `${rootDir}/**/*@(${extensions.join('|')})`;
		const opts: glob.IOptions = {
			ignore: excludes.map(e => this.pathToGlobIgnore(e, rootDir)),
			nocase: !this.useCaseSensitiveFileNames,
			absolute: true,
		};
		return glob.sync(globPattern, opts);
	}

	private pathToGlobIgnore(p: string, basePath: string): string {
		if (/\*|\.|\/|\\/.test(p)) {
			return path.join(basePath, p);
		}

		return path.join(basePath, p, '**/*');
	}

	fileExists(path: string): boolean {
		return fs.existsSync(path);
	}

	readFile(path: string): string {
		return fs.readFileSync(path, { encoding: 'utf8' });
	}

	trace?(s: string): void {

	}
}

export function parseTsConfig(basePath: string, tsconfigPath: string): ts.ParsedCommandLine {
	const sourcefile = ts.readJsonConfigFile(tsconfigPath, (path) => readFileSync(path, {encoding: 'utf8'}))
	return ts.parseJsonSourceFileConfigFileContent(sourcefile, new TsConfigParserHost(), basePath);	
}

export async function compileSourcesFromTsConfigFile(basePath: string, tsconfigPath: string, transformers: TransformerType[]) {
	// console.log({basePath, tsconfigPath});
	const config = parseTsConfig(basePath, tsconfigPath);
	// console.log({config});
	return compileSources(config.fileNames, 
		{
			...config.options,
			noEmit: true,
		}, transformers);
}

function resolveFilePathArray(files: string[], basePath: string): string[] {
	return files.map(f => path.resolve(f, basePath));
}

export async function compileSourcesDir(path: string, options: ts.CompilerOptions, transformers: TransformerType[]): Promise<{
	[path: string]: ts.TransformationResult<ts.Node>;
}> {
	const matches = await asyncGlob(path);
	if (!matches || matches.length === 0) {
		throw new Error('No sources found to compile with glob: ' + path);
	}
	else {
		return compileSources(matches, options, transformers);
	}
}

export function compileSources(matches: string[], options: ts.CompilerOptions, transformers: TransformerType[]) {
	const program = ts.createProgram(matches, options);
	const results: {
		[path: string]: ts.TransformationResult<ts.Node>;
	} = {};
	for (const file of matches) {
		results[file] = compileSourceFile(file, options, transformers, program);
	}
	return results;
}

export function compileSourceFile(path: string, options: ts.CompilerOptions, transformers: TransformerType[], program?: ts.Program): ts.TransformationResult<ts.SourceFile> {
	if (!program) {
		program = ts.createProgram([path], options);
	}
	return ts.transform(program.getSourceFile(path), transformers.map(t => t(program)));
}
