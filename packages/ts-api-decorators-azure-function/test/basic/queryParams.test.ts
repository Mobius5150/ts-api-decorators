import 'mocha';
import { TestServer } from '../TestServer';
import { ManagedApiInternal } from 'ts-api-decorators';
import { DefaultExpressPort } from '../TestUtil';
import * as path from 'path';
import * as request from 'supertest';
import * as http from 'http';

describe('Query Params', () => {
	let testServer: TestServer;
	let httpServer: http.Server;

	before(async () => {
		ManagedApiInternal.ResetRegisteredApis();
		testServer = new TestServer(path.resolve(__dirname, './sources/server-basic.ts'));
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
		it(`[${verbUpper}] accepts strings`, async () => {
			const name = 'test';
			return request(httpServer)
				[verb](`/hello?name=${name}`)
				.expect(200, `Hi ${name}! `);
		});

		it(`[${verbUpper}] accepts numbers`, async () => {
			const name = 'test';
			return request(httpServer)
				[verb](`/hello?name=${name}&times=3`)
				.expect(200, `Hi ${name}! Hi ${name}! Hi ${name}! `);
		});

		it(`[${verbUpper}] validates numbers`, async () => {
			const name = 'test';
			return Promise.all([
				// Invalid characters as suffix
				request(httpServer)
					[verb](`/hello?name=${name}&times=3n`)
					.expect(400),

				// Invalid string
				request(httpServer)
					[verb](`/hello?name=${name}&times=potato`)
					.expect(400),

				// Invalid prefix
				request(httpServer)
					[verb](`/hello?name=${name}&times=n3`)
					.expect(400),
			]);
		});

		it(`[${verbUpper}] accepts optional args`, async () => {
			const name = 'test';
			return request(httpServer)
				[verb](`/hello?name=${name}&times=3&optional=preamble`)
				.expect(200, `preambleHi ${name}! Hi ${name}! Hi ${name}! `);
		});

		it(`[${verbUpper}] accepts named args`, async () => {
			const str = 'test';
			return request(httpServer)
				[verb](`/echo?echo=${str}`)
				.expect(200, str);
		});
	}
});