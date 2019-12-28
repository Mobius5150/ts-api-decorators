import 'mocha';
import { expect, assert } from 'chai';
import { TestServer } from '../TestServer';
import { ManagedApiInternal } from 'ts-api-decorators';
import { DefaultExpressPort } from '../TestUtil';
import * as path from 'path';
import * as request from 'supertest';
import * as http from 'http';

describe('Header Params', () => {
	let testServer: TestServer;
	let httpServer: http.Server;

	before(async () => {
		ManagedApiInternal.ResetRegisteredApis();
		testServer = new TestServer(path.resolve(__dirname, './sources/header-params.ts'));
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
				[verb](`/hello`)
				.set('name', name)
				.expect(200, `Hi ${name}! `);
		});

		it(`[${verbUpper}] accepts numbers`, async () => {
			const name = 'test';
			return request(httpServer)
				[verb](`/hello`)
				.set('name', name)
				.set('times', 3)
				.expect(200, `Hi ${name}! Hi ${name}! Hi ${name}! `);
		});

		it(`[${verbUpper}] validates numbers`, async () => {
			const name = 'test';
			return Promise.all([
				// Invalid characters as suffix
				request(httpServer)
					[verb](`/hello`)
					.set('name', name)
					.set('times', '3n')	
					.expect(400),

				// Invalid string
				request(httpServer)
					[verb](`/hello`)
					.set('name', name)
					.set('times', 'potato')
					.expect(400),

				// Invalid prefix
				request(httpServer)
					[verb](`/hello`)
					.set('name', name)
					.set('times', 'n3')	
					.expect(400),
			]);
		});

		it(`[${verbUpper}] accepts optional args`, async () => {
			const name = 'test';
			return request(httpServer)
				[verb](`/hello`)
				.set('name', name)
				.set('times', 3)
				.set('optional', 'preamble')
				.expect(200, `preambleHi ${name}! Hi ${name}! Hi ${name}! `);
		});

		it(`[${verbUpper}] accepts named args`, async () => {
			const str = 'test';
			return request(httpServer)
				[verb](`/echo`)
				.set('x-echo', str)
				.expect(200, str);
		});

		it(`[${verbUpper}] is case insensitive`, async () => {
			const str = 'caseTest';
			Promise.all([
				request(httpServer)
					[verb](`/echo`)
					.set('X-ECHO', str)
					.expect(200, str),

				request(httpServer)
					[verb](`/echoCase`)
					.set('X-ECHO', str)
					.expect(200, str),

				request(httpServer)
					[verb](`/echoCase`)
					.set('x-echo', str)
					.expect(200, str),
			]);
		});
	}
});