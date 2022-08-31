import 'mocha';
import { expect, assert } from 'chai';
import * as path from 'path';
import { TestServer } from '../TestUtil';
import * as supertest from 'supertest';

describe('http header params', () => {
	const testPort = Math.round( Math.random() * 500 + 2000 );
	let testServer: TestServer;
	let request: supertest.SuperTest<supertest.Test>;

	before(async () => {
		testServer = new TestServer({
			sourceFile: path.resolve(__dirname, './sources/src/header-params.ts'),
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

	for (const verb of ['get', 'put', 'post', 'delete']) {
		const verbUpper = verb.toUpperCase();
		it(`[${verbUpper}] accepts strings`, async () => {
			const name = 'test';
			return request
				[verb](`/hello`)
				.set('name', name)
				.expect(200, `Hi ${name}! `);
		});

		it(`[${verbUpper}] accepts numbers`, async () => {
			const name = 'test';
			return request
				[verb](`/hello`)
				.set('name', name)
				.set('times', 3)
				.expect(200, `Hi ${name}! Hi ${name}! Hi ${name}! `);
		});

		it(`[${verbUpper}] validates numbers`, async () => {
			const name = 'test';
			return Promise.all([
				// Invalid characters as suffix
				request
					[verb](`/hello`)
					.set('name', name)
					.set('times', '3n')	
					.expect(400),

				// Invalid string
				request
					[verb](`/hello`)
					.set('name', name)
					.set('times', 'potato')
					.expect(400),

				// Invalid prefix
				request
					[verb](`/hello`)
					.set('name', name)
					.set('times', 'n3')	
					.expect(400),
			]);
		});

		it(`[${verbUpper}] accepts optional args`, async () => {
			const name = 'test';
			return request
				[verb](`/hello`)
				.set('name', name)
				.set('times', 3)
				.set('optional', 'preamble')
				.expect(200, `preambleHi ${name}! Hi ${name}! Hi ${name}! `);
		});

		it(`[${verbUpper}] accepts named args`, async () => {
			const str = 'test';
			return request
				[verb](`/echo`)
				.set('x-echo', str)
				.expect(200, str);
		});

		it(`[${verbUpper}] is case insensitive`, async () => {
			const str = 'caseTest';
			await Promise.all([
				request
					[verb](`/echo`)
					.set('X-ECHO', str)
					.expect(200, str),

				request
					[verb](`/echoCase`)
					.set('X-ECHO', str)
					.expect(200, str),

				request
					[verb](`/echoCase`)
					.set('x-echo', str)
					.expect(200, str),
			]);
		});
	}
});