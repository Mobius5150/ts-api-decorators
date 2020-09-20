import 'mocha';
import { expect, assert } from 'chai';
import * as path from 'path';
import { TestServer } from '../TestUtil';
import * as supertest from 'supertest';

describe('http path params', () => {
	const testPort = Math.round( Math.random() * 500 + 2000 );
	let testServer: TestServer;
	let request: supertest.SuperTest<supertest.Test>;

	before(async () => {
		testServer = new TestServer({
			sourceFile: path.resolve(__dirname, './sources/src/path-params.ts'),
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
				[verb](`/hello/${name}`)
				.expect(200, `Hi ${name}! `);
		});

		it(`[${verbUpper}] accepts numbers`, async () => {
			const name = 'test';
			return request
				[verb](`/hello/${name}/3`)
				.expect(200, `Hi ${name}! Hi ${name}! Hi ${name}! `);
		});

		it(`[${verbUpper}] validates numbers`, async () => {
			const name = 'test';
			return Promise.all([
				// Invalid characters as suffix
				request
					[verb](`/hello/${name}/3n`)
					.expect(400),

				// Invalid string
				request
					[verb](`/hello/${name}/potato`)
					.expect(400),

				// Invalid prefix
				request
					[verb](`/hello/${name}/n3`)
					.expect(400),
			]);
		});

		it(`[${verbUpper}] accepts optional args`, async () => {
			const name = 'test';
			return request
				[verb](`/hello/${name}/3/preamble`)
				.expect(200, `preambleHi ${name}! Hi ${name}! Hi ${name}! `);
		});

	}
});