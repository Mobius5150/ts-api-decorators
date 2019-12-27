import * as ts from 'typescript';
import transformer from '../src/transformer';
import { TransformerType, getDefaultCompilerOptions } from '../src/Util/CompilationUtil';

export * from '../src/Util/CompilationUtil';
export * from '../src/Util/AsyncGlob';

export function getTransformer(): (p: ts.Program) => TransformerType {
	return transformer;	
}

export function getCompiledProgram(moduleNamesTs: string[]) {
	const jsModuleNames = moduleNamesTs.map(ts => ts.replace(/\.ts$/, '.js'));
	const options = getDefaultCompilerOptions();
	const program = ts.createProgram(moduleNamesTs, options);
	const before = [getTransformer()(program)];
	for (let i = 0; i < moduleNamesTs.length; ++i) {
		program.emit(program.getSourceFile(moduleNamesTs[i]), undefined, undefined, false, {
			before,
		});
	}
	
	return jsModuleNames.map(js => require(js).default);
}