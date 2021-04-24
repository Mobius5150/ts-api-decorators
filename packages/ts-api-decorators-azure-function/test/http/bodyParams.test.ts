import 'mocha';
import { expect, assert } from 'chai';
import * as path from 'path';
import { TestServer } from '../TestUtil';
import * as supertest from 'supertest';

describe('http body params', () => {
	const testPort = Math.round( Math.random() * 500 + 2000 );
	let testServer: TestServer;
	let request: supertest.SuperTest<supertest.Test>;

	before(async () => {
		testServer = new TestServer({
			sourceFile: path.resolve(__dirname, './sources/src/server-basic.ts'),
			functionsOutDir: path.resolve(__dirname, './sources/function'),
			compileOutDir: path.resolve(__dirname, './sources/dist'),
			tsConfigJson: path.resolve(__dirname, './sources/tsconfig.json'),
			packageJson: path.resolve(__dirname, '../../package.json'),
			startTimeout: 30000,
			portNo: testPort,
		});
		
		await testServer.start();
		assert(testServer.isRunning(), 'Test server should be running');
		request = supertest(testServer.getBaseUrl());
	});

	after(async () => {
		await testServer.stop();
	});

	for (const verb of ['put', 'post']) {
		const verbUpper = verb.toUpperCase();
		it(`[${verbUpper}] accepts strings`, async () => {
			return request
				[verb](`/helloBody`)
				.send({ name: verb, times: 1 })
				.expect(200, `Hi ${verb}! `);
		});

		it(`[${verbUpper}] accepts numbers`, async () => {
			return request
				[verb](`/helloBody`)
				.send({ name: verb, times: 3 })
				.expect(200, `Hi ${verb}! Hi ${verb}! Hi ${verb}! `);
		});

		it(`[${verbUpper}] validates strings`, async () => {
			return Promise.all([
				// Number
				request
					[verb](`/helloBody`)
					.send({ name: 1, times: 1 })
					.expect(400),

				// Null
				request
					[verb](`/helloBody`)
					.send({ name: null, times: 1 })
					.expect(400),

				// undefined
				request
					[verb](`/helloBody`)
					.send({ name: undefined, times: 1 })
					.expect(400),

				// Object
				request
					[verb](`/helloBody`)
					.send({ name: {}, times: 1 })
					.expect(400),

				// Invalid prefix
				request
					[verb](`/helloBody`)
					.send({ name: [], times: 1 })
					.expect(400),
			]);
		});

		it(`[${verbUpper}] validates numbers`, async () => {
			return Promise.all([
				// String number
				request
					[verb](`/helloBody`)
					.send({ name: verb, times: '3' })
					.expect(400),

				// Invalid characters as suffix
				request
					[verb](`/helloBody`)
					.send({ name: verb, times: '3n' })
					.expect(400),

				// Invalid string
				request
					[verb](`/helloBody`)
					.send({ name: verb, times: 'potato' })
					.expect(400),

				// Invalid prefix
				request
					[verb](`/helloBody`)
					.send({ name: verb, times: 'n3' })
					.expect(400),

				// Object
				request
					[verb](`/helloBody`)
					.send({ name: verb, times: {} })
					.expect(400),

				// Invalid prefix
				request
					[verb](`/helloBody`)
					.send({ name: verb, times: [] })
					.expect(400),

				// Null
				request
					[verb](`/helloBody`)
					.send({ name: verb, times: null })
					.expect(400),

				// Undefined
				request
					[verb](`/helloBody`)
					.send({ name: verb, times: undefined })
					.expect(400),
			]);
		});

		it(`[${verbUpper}] accepts optional args`, async () => {
			const optional = 'preamble';
			return request
				[verb](`/helloBody`)
				.send({ name: verb, times: 3, optional })
				.expect(200, `${optional}Hi ${verb}! Hi ${verb}! Hi ${verb}! `);
		});
	}

});