import 'mocha';
import { TestServer } from '../TestServer';
import { ManagedApiInternal } from 'ts-api-decorators';
import { DefaultExpressPort } from '../TestUtil';
import * as path from 'path';
import * as request from 'supertest';
import * as http from 'http';

describe('Middleware', () => {
	let testServer: TestServer;
	let httpServer: http.Server;

	before(async () => {
		ManagedApiInternal.ResetRegisteredApis();
		testServer = new TestServer(path.resolve(__dirname, './sources/middleware.ts'));
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

	it(`applies middleware [positive]`, async () => {
		return request(httpServer)
			.get(`/hello`)
			.expect(200, `Hello`);
	});

	it(`applies middleware [negative]`, async () => {
		return request(httpServer)
			.get(`/hello?goodbye=true`)
			.expect(200, `Goodbye`);
	});
});