import 'mocha';
import { TestServer } from '../TestServer';
import { ManagedApiInternal } from 'ts-api-decorators';
import { DefaultExpressPort } from '../TestUtil';
import * as path from 'path';
import * as request from 'supertest';
import * as http from 'http';
import { expect } from 'chai';

describe('Express Params', () => {
	let testServer: TestServer;
	let httpServer: http.Server;

	before(async () => {
		ManagedApiInternal.ResetRegisteredApis();
		testServer = new TestServer(path.resolve(__dirname, './sources/express-params.ts'));
		httpServer = await testServer.start(DefaultExpressPort);
	});

	after(async () => {
		if (testServer) {
			await testServer.stop();
			testServer = undefined;
			httpServer = undefined;
		}

		ManagedApiInternal.ResetRegisteredApis();
	});

	for (const verb of ['get', 'put', 'post', 'delete']) {
		const verbUpper = verb.toUpperCase();
		it(`[${verbUpper}] returns ok`, async () => {
			return request(httpServer)[verb](`/hello?name=${verb}`).expect(200, `response`);
		});
	}

	it('gets the user from the request', async () => {
		return request(httpServer).get(`/helloUser`).expect(200, `Hello Developer!`);
	});

	it('should abort the request', async () => {
		await request(httpServer).get(`/checkWasAborted`).expect(200, 'false');

		try {
			await request(httpServer).get(`/helloAbort`).timeout(1);
			expect.fail('Request should have timed out');
		} catch (e) {
			if (e.message.toLowerCase().indexOf('timeout') === -1) {
				throw e;
			}
		}

		return request(httpServer).get(`/checkWasAborted`).expect(200, 'true');
	});
});
