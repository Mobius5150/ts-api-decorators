import { assert } from 'chai';
import * as path from 'path';
import 'mocha';
import { getCompiledProgram } from '../../src/Testing/TestUtil';
import { ApiMethod, StreamCoercionMode } from '../../src';
import { TestManagedApi } from '../../src/Testing/TestTransport';
import * as streamBuffer from 'stream-buffers';
import { StreamCoercer, ICoercedStream } from '../../src/Util/StreamCoercer';

describe('Out Param Runtime', () => {
    let api: TestManagedApi;

    function streamToString(stream: ICoercedStream): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const outBuf = new streamBuffer.WritableStreamBuffer();
            outBuf.on('error', e => reject(e));
            outBuf.on('finish', () => resolve(outBuf.getContentsAsString('utf8') || null));
            stream.pipe(outBuf, { end: true, });
        });
    }
    
    async function testApiMethodInput(url: string, paramName: string, tests: Array<[string, number, string]>) {
        for (const [testVal, resultStatus, testOutput] of tests) {
            const result = await api.invokeApiCall(ApiMethod.GET, url.replace(`:${paramName}`, testVal), {
                headers: {},
                queryParams: {
                    [paramName]: testVal,
                },
                transportParams: {},
            });

            assert.equal(result.statusCode, resultStatus, `Expected input of '${testVal}' to give status code ${resultStatus} but got ${result.statusCode}`);

            if (resultStatus >= 200 && resultStatus < 300) {
                assert.notEqual(result.streamMode, StreamCoercionMode.None);
                const outStream = StreamCoercer.CoerceWith(result.body, result.streamMode);
                assert.equal(await streamToString(outStream), testOutput);
            }
        }
    }
	
	before(() => {
		[api] = getCompiledProgram([
			path.join(__dirname, 'sources/out-params.ts'),
        ]);
        
        api.init();
    })

    it('should handle a basic inline stream write', async () => {
        await testApiMethodInput('/basicOutStream', 'name', [
            ['Mike', 200, 'Hello Mike!'],
            ['John', 200, 'Hello John!'],
            ['bad', 400, ''],
        ]);
    });

	it('should handle a stream that completes after the method completes', async () => {
        await testApiMethodInput('/timedOutStream', 'name', [
            ['Mike', 200, 'Hello Mike!'],
            ['John', 200, 'Hello John!'],
        ]);
    });

    it('should handle a stream that asynchronously completes before the method completes', async () => {
        await testApiMethodInput('/timedOutStreamThatFinishes', 'name', [
            ['Mike', 200, 'Hello Mike!'],
            ['John', 200, 'Hello John!'],
            ['bad', 400, ''],
        ]);
    });
});