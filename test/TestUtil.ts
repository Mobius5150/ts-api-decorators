import * as ts from 'typescript';
import transformer from '../src/transformer';
import * as glob from 'glob';

export type TransformerType = ts.TransformerFactory<ts.SourceFile>;
export type TransformerFuncType = (p: ts.Program) => TransformerType;

export async function compileSourcesDir(path: string, options: ts.CompilerOptions, transformers: TransformerFuncType[]): Promise<{[path: string]: ts.TransformationResult<ts.Node>}> {
	const matches = await asyncGlob(path);
	 if (!matches || matches.length === 0) {
		throw new Error('No sources found to compile with glob: ' + path);
	} else {
		const program = ts.createProgram(matches, options);
		const results: {[path: string]: ts.TransformationResult<ts.Node>} = {};
		for (const file of matches) {
			results[file] = compileSourceFile(file, options, transformers, program);
		}
		
		return results;
	}
}

export function compileSourceFile(path: string, options: ts.CompilerOptions, transformers: TransformerFuncType[], program?: ts.Program): ts.TransformationResult<ts.Node> {
	if (!program) {
		program = ts.createProgram([path], options);
	}

	return ts.transform(program.getSourceFile(path), transformers.map(t => t(program)));
}

export function asyncGlob(path: string): Promise<string[]> {
	return new Promise<string[]>((resolve, reject) => {
		try {
			glob(path, (err, matches) => {
				if (err) {
					reject(err);
				} else {
					resolve(matches);
				}
			});
		} catch (e) {
			reject(e);
		}
	});
}

export function getTransformer(): (p: ts.Program) => TransformerType {
	return transformer;	
}

export function getDefaultCompilerOptions(): ts.CompilerOptions {
	return {
		noEmitOnError: true,
		noImplicitAny: true,
		experimentalDecorators: true,
		target: ts.ScriptTarget.ES5,
	}
}