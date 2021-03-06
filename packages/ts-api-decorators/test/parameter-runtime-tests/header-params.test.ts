import { assert } from 'chai';
import * as path from 'path';
import 'mocha';
import { getCompiledProgram } from '../../src/Testing/TestUtil';
import { ApiMethod } from '../../src';
import { TestManagedApi } from '../../src/Testing/TestTransport';

describe('Header Param Runtime', () => {
    let api: TestManagedApi;
    
    async function testApiMethodInput(url: string, paramName: string, tests: Array<[any, number]>) {
        for (const [testVal, resultStatus] of tests) {
            const result = await api.invokeApiCall(ApiMethod.GET, url, {
                headers: {
                    [paramName]: testVal.toString(),
                },
                queryParams: {},
                transportParams: {},
            });

            assert.equal(result.statusCode, resultStatus, `Expected input of '${testVal}' to give status code ${resultStatus} but got ${result.statusCode}`);

            if (resultStatus >= 200 && resultStatus < 300) {
                assert.equal(result.body, testVal.toString());
            }
        }
    }
	
	before(() => {
		[api] = getCompiledProgram([
			path.join(__dirname, 'sources/header-params.ts'),
        ]);
        
        api.init();
	})

	it('should validate number minimums', async () => {
        await testApiMethodInput('/numberMin', 'num', [
            [0, 200],
            [1, 200],
            [-1, 400],
            ['a', 400],
            [true, 400],
            [false, 400],
        ]);
    });

    it('should validate number maximums', async () => {
        await testApiMethodInput('/numberMax', 'num', [
            [0, 200],
            [1, 400],
            [-1, 200],
            ['a', 400],
            [true, 400],
            [false, 400],
        ]);
    });

    it('should validate number minimums and maximums', async () => {
        await testApiMethodInput('/numberMinMax', 'num', [
            [5, 200],
            [6, 200],
            [10, 200],
            [1, 400],
            [11, 400],
            ['a', 400],
            [true, 400],
            [false, 400],
        ]);
    });

    it('should validate string regexes', async () => {
        await testApiMethodInput('/stringRegex', 'str', [
            ['a', 200],
            [5, 400],
            ['', 400],
            ['6', 400],
            ['I', 400],
            ['i', 200],
        ]);
    });

    it('should call validation functions', async () => {
        await testApiMethodInput('/validationFunc', 'str', [
            ['valid', 200],
            ['a', 400],
            [5, 400],
            ['', 400],
            [true, 400],
            [false, 400],
            ['6', 400],
            ['I', 400],
            ['i', 400],
            ['valid', 200],
        ]);
    });
});