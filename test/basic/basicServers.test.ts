import 'mocha';
import { expect, assert } from 'chai';
import { TestServer } from '../TestServer';
import { ManagedApiInternal } from 'ts-api-decorators';
import { DefaultExpressPort } from '../TestUtil';
import * as path from 'path';
import * as request from 'supertest';
import * as http from 'http';

describe('Query strings', () => {
	let testServer: TestServer;
	let httpServer: http.Server;

	before(async () => {
		ManagedApiInternal.ResetRegisteredApis();
		testServer = new TestServer(path.resolve(__dirname, './sources/server-basic.ts'));
		httpServer = await testServer.start(DefaultExpressPort);
	});

	after(() => {
		if (testServer) {
			testServer.stop();
			testServer = undefined;
			httpServer = undefined;
		}

		ManagedApiInternal.ResetRegisteredApis();
	});

	it('accepts strings', async () => {
		const name = 'test';
		return request(httpServer)
			.get(`/hello?name=${name}`)
			.expect(200, `Hi ${name}! `);
	});

	it('accepts numbers', async () => {
		const name = 'test';
		return request(httpServer)
			.get(`/hello?name=${name}&times=3`)
			.expect(200, `Hi ${name}! Hi ${name}! Hi ${name}! `);
	});

	it('validates numbers', async () => {
		const name = 'test';
		return Promise.all([
			// Invalid characters as suffix
			request(httpServer)
				.get(`/hello?name=${name}&times=3n`)
				.expect(400),

			// Invalid string
			request(httpServer)
				.get(`/hello?name=${name}&times=potato`)
				.expect(400),

			// Invalid prefix
			request(httpServer)
				.get(`/hello?name=${name}&times=n3`)
				.expect(400),
		]);
	});

	it('accepts optional args', async () => {
		const name = 'test';
		return request(httpServer)
			.get(`/hello?name=${name}&times=3&optional=preamble`)
			.expect(200, `preambleHi ${name}! Hi ${name}! Hi ${name}! `);
	});
});