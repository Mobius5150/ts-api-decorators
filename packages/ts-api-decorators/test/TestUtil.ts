import * as ts from 'typescript';
import transformer, { ITransformerArguments } from '../src/transformer';
import { TransformerType, getDefaultCompilerOptions } from '../src/Util/CompilationUtil';
import { assert } from 'chai';

export * from '../src/Util/CompilationUtil';
export * from '../src/Util/AsyncGlob';

export function getTransformer(): TransformerType {
	return transformer;	
}

export function getCompiledProgram(moduleNamesTs: string[], transformerArgs?: ITransformerArguments) {
	const jsModuleNames = moduleNamesTs.map(ts => ts.replace(/\.ts$/, '.js'));
	const options = getDefaultCompilerOptions();
	const program = ts.createProgram(moduleNamesTs, options);
	const before = [getTransformer()(program, transformerArgs)];
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
				assertRealArrayInclude(actual[expectedKey], expectedVal, propPath);
			} else {
				assertRealInclude(actual[expectedKey], expectedVal, propPath)
			}
		} else {
			assert.equal(actual[expectedKey], expectedVal, `Property does not match expected value: ${path}`);
		}
	}
}

export function assertRealArrayInclude(actual: Array<any>, expected: Array<any>, path: string = '$') {
	const skipActuals = new Set<any>();
	for (const expectedIndex in expected) {
		const expectedVal = expected[expectedIndex];
		const expectedType = typeof expectedVal;
		const expectedPath = `${path}.${expectedIndex}`;
		let found = false;
		for (const actualIndex in actual) {
			if (typeof actual[actualIndex] !== expectedType || skipActuals.has(actualIndex)) {
				continue;
			}

			if (expectedType === 'object') {
				try {
					if (Array.isArray(expectedVal)) {
						assertRealArrayInclude(actual[actualIndex], expectedVal, expectedPath);
					} else {
						assertRealInclude(actual[actualIndex], expectedVal, expectedPath);
					}

					skipActuals.add(actualIndex);
					found = true;
					break;
				} catch (e) {
					// Do nothing
				}
			} else if (expectedVal === actual[actualIndex]) {
				skipActuals.add(actualIndex);
				found = true;
				break;
			}
		}

		if (!found) {
			assert.fail(undefined, expectedVal, `Could not find array member value at path: ${expectedPath}`);
		}
	}
}