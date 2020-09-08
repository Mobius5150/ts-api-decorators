import 'mocha';
import { TestServer } from '../TestServer';
import { ManagedApiInternal } from 'ts-api-decorators';
import { DefaultExpressPort } from '../TestUtil';
import * as path from 'path';
import * as request from 'supertest';
import * as http from 'http';

describe('Streams', () => {
	let loadedServer: string;
	let testServer: TestServer;
	let httpServer: http.Server;

	async function loadServer(name: string) {
		if (loadedServer !== name) {
			if (testServer) {
				await testServer.stop();
			}

			loadedServer = name;
		} else {
			return;
		}

		ManagedApiInternal.ResetRegisteredApis();
		testServer = new TestServer(path.resolve(__dirname, `./sources/${name}.ts`));
		httpServer = await testServer.start(DefaultExpressPort);
	}

	after(async () => {
		if (testServer) {
			await testServer.stop();
			testServer = undefined;
			httpServer = undefined;
		}

		ManagedApiInternal.ResetRegisteredApis();
	});

	it(`correctly reads simple streams`, async () => {
		await loadServer('streams');
		const name = 'Mike';
		return request(httpServer)
			.get(`/hello?name=${name}`)
			.expect(200, `Hello ${name}!`);
	});

	it(`correctly reads buffered streams`, async () => {
		await loadServer('streams');
		const name = 'Mike';
		return request(httpServer)
			.get(`/helloTimedRelease?name=${name}`)
			.expect(200, `Hello ${name}!`);
	});

	it(`works fine otherwise when streams disabled`, async () => {
		await loadServer('nostreams');
		const name = 'Mike';
		return request(httpServer)
			.get(`/helloNoStream?name=${name}`)
			.expect(200, `Hello ${name}!`);
	});
});