import 'mocha';
import { expect, assert } from 'chai';
import { asyncGlob } from '../../src/Util/AsyncGlob';
import * as path from 'path';
import { ApiMimeType, HttpUnsupportedMediaTypeError, parseApiMimeType, ParsedContentTypeHeader } from '../../src';
import { assertRealInclude } from '../../src/Testing/TestUtil';

function testMimeType(contentType: string, expected: Partial<ParsedContentTypeHeader>, defaultCharset?: BufferEncoding) {
    assertRealInclude(
        parseApiMimeType(contentType, defaultCharset),
        expected
    );
}
describe('MimeTypes', () => {
	it('should parse mime types', async () => {
        const tests: Array<[string, Partial<ParsedContentTypeHeader>]> = [
            [undefined, { mimeType: ApiMimeType.ApplicationOctetStream, charset: 'latin1' }],
            ['application/json', { mimeType: ApiMimeType.ApplicationJson }],
            ['APPLICATION/JSON', { mimeType: ApiMimeType.ApplicationJson }],
            ['APPLICATION/json', { mimeType: ApiMimeType.ApplicationJson }],
            ['APPLICATION/javascript', { mimeType: ApiMimeType.ApplicationJavascript }],
            ['APPLICATION/xml', { mimeType: ApiMimeType.ApplicationXml }],
            ['APPLICATION/octet-stream', { mimeType: ApiMimeType.ApplicationOctetStream }],
            ['text/plain', { mimeType: ApiMimeType.Text }],
            ['text/xml', { mimeType: ApiMimeType.TextXml }],
        ];

        for (const [test, expected] of tests) {
            testMimeType(test, expected);
        }
    });

    it('should parse charsets', async () => {
        const tests: Array<[string, Partial<ParsedContentTypeHeader>]> = [
            ['application/json', { mimeType: ApiMimeType.ApplicationJson, charset: 'latin1' }],
            ['application/json; charset=utf-8', { mimeType: ApiMimeType.ApplicationJson, charset: 'utf8' }],
            ['APPLICATION/JSON; CHARSET=UTF-8', { mimeType: ApiMimeType.ApplicationJson, charset: 'utf8' }],
            ['APPLICATION/json; ChArSeT=uTf-8', { mimeType: ApiMimeType.ApplicationJson, charset: 'utf8' }],
            ['application/json; charset=utf8', { mimeType: ApiMimeType.ApplicationJson, charset: 'utf8' }],
            ['APPLICATION/JSON; CHARSET=UTF8', { mimeType: ApiMimeType.ApplicationJson, charset: 'utf8' }],
            ['APPLICATION/json; ChArSeT=uTf8', { mimeType: ApiMimeType.ApplicationJson, charset: 'utf8' }],
            ['APPLICATION/javascript; charset=latin1', { mimeType: ApiMimeType.ApplicationJavascript, charset: 'latin1'  }],
        ];

        for (const [test, expected] of tests) {
            testMimeType(test, expected);
        }
    });

    it('should not accept unsupported charsets', async () => {
        expect(() => testMimeType('application/json; charset=covid-19', { mimeType: ApiMimeType.ApplicationJson }))
            .to.throw(HttpUnsupportedMediaTypeError);
    });
});