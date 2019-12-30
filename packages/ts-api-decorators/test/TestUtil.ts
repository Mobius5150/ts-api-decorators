import * as ts from 'typescript';
import transformer from '../src/transformer';
import { TransformerType, getDefaultCompilerOptions } from '../src/Util/CompilationUtil';
import { assert } from 'chai';

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

export function assertRealInclude(actual: object, expected: object, path: string = '$') {
	for (const expectedKey of Object.keys(expected)) {
		const propPath = `${path}.${expectedKey}`;
		assert.property(actual, expectedKey, `Expected property ${propPath}`);
		const expectedVal = expected[expectedKey];
		if (typeof expectedVal === 'object') {
			if (Array.isArray(expectedVal)) {
				assert.includeDeepMembers(actual[expectedKey], expectedVal);
			} else {
				assertRealInclude(actual[expectedKey], expectedVal, propPath)
			}
		} else {
			assert.equal(actual[expectedKey], expectedVal, `Property does not match expected value: ${path}`);
		}
	}
}