import { expect, assert } from 'chai';
import * as path from 'path';
import * as ts from 'typescript';
import 'mocha';
import { compileSourcesDir, getDefaultCompilerOptions, getTransformer, asyncGlob, compileSourceFile, getCompiledProgram } from '../TestUtil';

describe('transformer', () => {
	const defaultOpts = getDefaultCompilerOptions();
	const transformers = [getTransformer()];

	it('should transform things', async () => {
		const modules = getCompiledProgram([
			path.join(__dirname, 'sources/basic-decorators.ts'),
		]);
	});

	it('ApiQueryParam invalid with object type', () => {
		const file = path.resolve(__dirname, './sources/invalid-usage-badtype-ApiQueryParam-object.ts');
		assert.throws(() => compileSourceFile(file, defaultOpts, transformers));
	});

	it('ApiQueryParam invalid with function type', () => {
		const file = path.resolve(__dirname, './sources/invalid-usage-badtype-ApiQueryParam-function.ts');
		assert.throws(() => compileSourceFile(file, defaultOpts, transformers));
	});

});