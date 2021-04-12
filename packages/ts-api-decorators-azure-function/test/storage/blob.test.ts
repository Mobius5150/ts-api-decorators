import 'mocha';
import { expect, assert } from 'chai';
import * as path from 'path';
import { TestServer } from '../TestUtil';
import * as supertest from 'supertest';

describe('storage::blob', () => {
	const testPort = Math.round( Math.random() * 500 + 2000 );
	let testServer: TestServer;
	let request: supertest.SuperTest<supertest.Test>;

	before(async () => {
		testServer = new TestServer({
			sourceFile: path.resolve(__dirname, './sources/src/storage-blob.ts'),
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
	
	// `it(`[${verbUpper}] accepts strings`, async () => {
	// 	const name = 'test';
	// 	return request
	// 		[verb](`/hello/${name}`)
	// 		.expect(200, `Hi ${name}! `);
	// });`
});