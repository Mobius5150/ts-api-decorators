import 'mocha';
import { TestServer } from '../TestServer';
import { ManagedApiInternal } from 'ts-api-decorators';
import { DefaultExpressPort } from '../TestUtil';
import * as path from 'path';
import * as request from 'supertest';
import * as http from 'http';

describe('Body Params', () => {
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

	for (const verb of ['put', 'post']) {
		const verbUpper = verb.toUpperCase();
		it(`[${verbUpper}] accepts strings`, async () => {
			return request(httpServer)
				[verb](`/helloBody`)
				.send({ name: verb, times: 1 })
				.expect(200, `Hi ${verb}! `);
		});

		it(`[${verbUpper}] accepts numbers`, async () => {
			return request(httpServer)
				[verb](`/helloBody`)
				.send({ name: verb, times: 3 })
				.expect(200, `Hi ${verb}! Hi ${verb}! Hi ${verb}! `);
		});

		it(`[${verbUpper}] validates strings`, async () => {
			return Promise.all([
				// Number
				request(httpServer)
					[verb](`/helloBody`)
					.send({ name: 1, times: 1 })
					.expect(400),

				// Null
				request(httpServer)
					[verb](`/helloBody`)
					.send({ name: null, times: 1 })
					.expect(400),

				// undefined
				request(httpServer)
					[verb](`/helloBody`)
					.send({ name: undefined, times: 1 })
					.expect(400),

				// Object
				request(httpServer)
					[verb](`/helloBody`)
					.send({ name: {}, times: 1 })
					.expect(400),

				// Invalid prefix
				request(httpServer)
					[verb](`/helloBody`)
					.send({ name: [], times: 1 })
					.expect(400),
			]);
		});

		it(`[${verbUpper}] validates numbers`, async () => {
			return Promise.all([
				// String number
				request(httpServer)
					[verb](`/helloBody`)
					.send({ name: verb, times: '3' })
					.expect(400),

				// Invalid characters as suffix
				request(httpServer)
					[verb](`/helloBody`)
					.send({ name: verb, times: '3n' })
					.expect(400),

				// Invalid string
				request(httpServer)
					[verb](`/helloBody`)
					.send({ name: verb, times: 'potato' })
					.expect(400),

				// Invalid prefix
				request(httpServer)
					[verb](`/helloBody`)
					.send({ name: verb, times: 'n3' })
					.expect(400),

				// Object
				request(httpServer)
					[verb](`/helloBody`)
					.send({ name: verb, times: {} })
					.expect(400),

				// Invalid prefix
				request(httpServer)
					[verb](`/helloBody`)
					.send({ name: verb, times: [] })
					.expect(400),

				// Null
				request(httpServer)
					[verb](`/helloBody`)
					.send({ name: verb, times: null })
					.expect(400),

				// Undefined
				request(httpServer)
					[verb](`/helloBody`)
					.send({ name: verb, times: undefined })
					.expect(400),
			]);
		});

		it(`[${verbUpper}] accepts optional args`, async () => {
			const optional = 'preamble';
			return request(httpServer)
				[verb](`/helloBody`)
				.send({ name: verb, times: 3, optional })
				.expect(200, `${optional}Hi ${verb}! Hi ${verb}! Hi ${verb}! `);
		});
	}
});