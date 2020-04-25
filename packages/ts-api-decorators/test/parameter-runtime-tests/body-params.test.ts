import { assert } from 'chai';
import * as path from 'path';
import 'mocha';
import { getCompiledProgram } from '../../src/Testing/TestUtil';
import { ApiMethod, ApiMimeType, readStreamToStringUtil, readStreamToStringUtilCb } from '../../src';
import { TestManagedApi } from '../../src/Testing/TestTransport';
import { ObjectReadableMock } from 'stream-mock';
import { Readable } from 'stream';

describe('Body Param Runtime', () => {
    let api: TestManagedApi;

    function stringToMemoryStream(str: string): Readable {
        return new ObjectReadableMock(Array.from(str).map((c, i) => {
            if (i % 2) {
                return Buffer.from(c);
            }

            return c;
        }));
    }
    
    async function testApiMethodInput(url: string, tests: Array<[any, string, number]>) {
        for (const [testVal, testResponse, resultStatus] of tests) {
            let mimeType = ApiMimeType.Text;
            let testStr = testVal.toString();
            if (typeof testVal === 'object') {
                mimeType = ApiMimeType.ApplicationJson;
                testStr = JSON.stringify(testVal);
            }

            const contentsStream = stringToMemoryStream(testStr);
            const result = await api.invokeApiCall(ApiMethod.POST, url, {
                headers: {},
                bodyContents: {
                    contentsStream: contentsStream,
                    streamContentsMimeType: mimeType,
                    streamContentsMimeRaw: mimeType.toString(),
                    readStreamToStringAsync: readStreamToStringUtil(contentsStream),
                    readStreamToStringCb: readStreamToStringUtilCb(contentsStream),
                },
                queryParams: {},
                transportParams: {},
            });

            assert.equal(result.statusCode, resultStatus, `Expected input of '${testVal}' to give status code ${resultStatus} but got ${result.statusCode}`);

            if (resultStatus >= 200 && resultStatus < 300) {
                assert.equal(result.body, testResponse);
            }
        }
    }
	
	before(() => {
		[api] = getCompiledProgram([
			path.join(__dirname, 'sources/body-params.ts'),
        ]);
        
        api.init();
    })

    it('should read json data', async () => {
        await testApiMethodInput('/jsonData', [
            [{ data: 'hello' }, 'hello', 200],
            [{ data: 1 }, null, 400],
            [{ data: ['hello'] }, null, 400],
            [{ data: { data: 'hello' } }, null, 400],
            [{}, null, 400],
            [{ badData: 'hello' }, null, 400],
            [1, null, 400],
            ['a', null, 400],
            [true, null, 400],
            [false, null, 400],
        ]);
    });

	it('should validate number minimums', async () => {
        await testApiMethodInput('/numberMin', [
            [0, "0", 200],
            [1, "1", 200],
            [-1, null, 400],
            ['a', null, 400],
            [true, null, 400],
            [false, null, 400],
        ]);
    });

    it('should validate number maximums', async () => {
        await testApiMethodInput('/numberMax', [
            [0, "0", 200],
            [1, null, 400],
            [-1, "-1", 200],
            ['a', null, 400],
            [true, null, 400],
            [false, null, 400],
        ]);
    });

    it('should validate number minimums and maximums', async () => {
        await testApiMethodInput('/numberMinMax', [
            [5, "5", 200],
            [6, "6", 200],
            [10, "10", 200],
            [1, null, 400],
            [11, null, 400],
            ['a', null, 400],
            [true, null, 400],
            [false, null, 400],
        ]);
    });

    it('should validate string regexes', async () => {
        await testApiMethodInput('/stringRegex', [
            ['a', 'a', 200],
            [5, null, 400],
            ['', null, 400],
            ['6', null, 400],
            ['I', null, 400],
            ['i', 'i', 200],
        ]);
    });

    it('should call validation functions', async () => {
        await testApiMethodInput('/validationFunc', [
            ['valid', 'valid', 200],
            ['a', null, 400],
            [5, null, 400],
            ['', null, 400],
            [true, null, 400],
            [false, null, 400],
            ['6', null, 400],
            ['I', null, 400],
            ['i', null, 400],
            ['valid', 'valid', 200],
        ]);
    });
});