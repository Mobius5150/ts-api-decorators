import * as ts from 'typescript';
import transformer, { ITransformerArguments } from '../transformer';
import { TransformerType, getDefaultCompilerOptions } from '../Util/CompilationUtil';
import { assert } from 'chai';

export * from '../Util/CompilationUtil';
export * from '../Util/AsyncGlob';

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

export type ArgMatcherFunction<T> = (actual: T | undefined, ctx: IIncludeMatchContext) => boolean;

export function validateOrSetMatch<MatchType>(sym: Symbol, match: MatchType, ctx: IIncludeMatchContext): MatchType {
	const symval = ctx.symbols[sym as any];
	if (!symval.matcher(symval.value, ctx)) {
		// Symbol hasn't been assigned a value yet. Try and find a matching key
		if (symval.matcher(match, ctx)) {
			symval.value = match;
		} else {
			assert.fail(`Property did not pass symbol ${sym.toString()} matcher ${match}`);
		}
	} else {
		// Symbol has resolved a value, check it
		assert.equal(match, symval.value, `Property symbol ${sym.toString()} did not match expected value ${symval.value}`);
	}

	return match;
}

export interface IIncludeMatchContext {
	path?: string;
	funcmode?: 'matcher' | 'value';
	undefinedValMode?: 'explicit' | 'allowMissingKeys',
	symbols?: {[sym: symbol]: { matcher?: ArgMatcherFunction<any>, value?: any }};
}

function initContextDefaults(ctx: IIncludeMatchContext): IIncludeMatchContext {
	const newCtx: IIncludeMatchContext = {
		funcmode: 'value',
		undefinedValMode: 'allowMissingKeys',
		...ctx,
		symbols: {},
	};

	if (ctx.symbols) {
		for (const sym of Reflect.ownKeys(ctx.symbols)) {
			newCtx.symbols[sym] = {
				matcher: (a: any) => typeof a !== 'undefined',
				value: undefined,
				...ctx.symbols[sym],
			};
		}
	}

	return newCtx;
}

/**
 * Asserts that an object deep includes the properties
 * @param actual The actual object observed
 * @param expected The expected object
 * @param path The current path (omit)
 * @param funcmode The mode for evaluating expected values that are functions. When `value` the function is treated as the value that is expected. When `matcher` the function is considered a test function and executed, with the first argument being the actual value. It should return true if the value matches expectation
 */
export function assertRealInclude(actual: object | undefined, expected: object, path: string = '$', ctx: IIncludeMatchContext = {}) {
	ctx = initContextDefaults(ctx);
	if (typeof actual !== typeof expected) {
		assert.fail(`Expected type ${typeof expected} at ${path} but got ${typeof actual}`);
	}

	const matchedKeys = new Set<string | symbol>();
	for (const expectedKey of [...Object.keys(expected), ...Object.getOwnPropertySymbols(expected)]) {
		let actualKey = expectedKey;
		const propPath = `${path}.${expectedKey.toString()}`;
		const expectedVal = expected[expectedKey];
		if (typeof expectedKey === 'symbol' && expectedKey in ctx.symbols) {
			const symval = ctx.symbols[expectedKey];
			if (!symval.matcher(symval.value, ctx)) {
				// Symbol hasn't been assigned a value yet. Try and find a matching key
				const foundkey = Object.keys(actual).find(v => !matchedKeys.has(v) && symval.matcher(v, ctx));
				if (symval.matcher(foundkey, ctx)) {
					symval.value = foundkey;
				} else {
					assert.fail(`Could not resolve property ${propPath}`);
				}
			} else {
				// Symbol has resolved a value, try and find it
				assert.property(actual, symval.value, `Expected resolved symbol ${propPath} as key (resolved to value ${symval.value})`);
			}

			actualKey = symval.value;
		} else {
			if (ctx.undefinedValMode === 'allowMissingKeys' && typeof expectedVal === 'undefined') {
				assert.isUndefined(actual[expectedKey], `Expected property ${propPath} to not exist or be undefined`);
			} else {
				assert.property(actual, expectedKey as any, `Expected property ${propPath}`);
			}
		}

		if (typeof expectedVal === 'object') {
			if (Array.isArray(expectedVal)) {
				assertRealArrayInclude(actual[actualKey], expectedVal, propPath, ctx);
			} else {
				assertRealInclude(actual[actualKey], expectedVal, propPath, ctx)
			}
		} else if (typeof expectedVal === 'function' && ctx.funcmode === 'matcher') {
			assert.isTrue(expectedVal(actual[actualKey], ctx), `Matcher function did not match expected value "${expectedVal}" at ${path}`);
		} else if (typeof expectedVal === 'symbol' && expectedVal in ctx.symbols) {
			const symval = ctx.symbols[expectedKey];
			if (!symval.matcher(symval.value, ctx)) {
				// Symbol hasn't been assigned a value yet. Try and find a matching key
				if (symval.matcher(actual[actualKey], ctx)) {
					symval.value = actual[actualKey];
				} else {
					assert.fail(`Property did not pass symbol ${expectedVal.toString()} matcher ${propPath}`);
				}
			} else {
				// Symbol has resolved a value, check it
				assert.equal(actual[actualKey], symval.value, `Property symbol ${propPath} did not match expected value ${symval.value}`);
			}
		} else {
			assert.equal(actual[actualKey], expectedVal, `Property does not match expected value: ${path}`);
		}

		matchedKeys.add(actualKey);
	}
}

/**
 * Asserts that an array deep includes the children
 * @param actual The actual array observed
 * @param expected The expected array
 * @param path The current path (omit)
 * @param funcmode The mode for evaluating expected values that are functions. When `value` the function is treated as the value that is expected. When `matcher` the function is considered a test function and executed, with the first argument being the actual value. It should return true if the value matches expectation
 */
export function assertRealArrayInclude(actual: Array<any>, expected: Array<any>, path: string = '$', ctx: IIncludeMatchContext = {}) {
	ctx = initContextDefaults(ctx);
	const skipActuals = new Set<any>();
	for (const expectedIndex in expected) {
		const expectedVal = expected[expectedIndex];
		const expectedType = typeof expectedVal;
		const expectedPath = `${path}.${expectedIndex}`;
		let found = false;
		for (const actualIndex in actual) {
			if (skipActuals.has(actualIndex)) {
				continue;
			}

			if (expectedType === 'function' && ctx.funcmode === 'matcher') {
				if (expectedVal(actual[actualIndex], ctx)) {
					skipActuals.add(actualIndex);
					found = true;
					break;
				}
			}

			if (expectedType === 'symbol' && expectedVal in ctx.symbols) {
				const symval = ctx.symbols[expectedVal];
				if (!symval.matcher(symval.value, ctx)) {
					// Symbol hasn't been assigned a value yet. Try and find a matching key
					if (symval.matcher(actual[actualIndex], ctx)) {
						symval.value = actual[actualIndex];
					} else {
						assert.fail(`Property did not pass symbol ${expectedVal.toString()} matcher ${expectedPath}`);
					}
				} else {
					// Symbol has resolved a value, check it
					assert.equal(actual[actualIndex], symval.value, `Property symbol ${expectedPath} did not match expected value ${symval.value}`);
				}

				skipActuals.add(actualIndex);
				found = true;
				break;
			}
			
			if (typeof actual[actualIndex] !== expectedType) {
				continue;
			}

			if (expectedType === 'object') {
				try {
					if (Array.isArray(expectedVal)) {
						assertRealArrayInclude(actual[actualIndex], expectedVal, expectedPath, ctx);
					} else {
						assertRealInclude(actual[actualIndex], expectedVal, expectedPath, ctx);
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