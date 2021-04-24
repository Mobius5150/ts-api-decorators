import 'mocha';
import { expect, assert } from 'chai';
import * as path from 'path';
import { propsFromObject, TestServer, waitTillConditionTrue } from '../TestUtil';
import * as supertest from 'supertest';
import {
	BlobServiceClient,
	ContainerClient,
} from "@azure/storage-blob";
import { v4 as uuidv4 } from 'uuid';
import { assertRealInclude } from 'ts-api-decorators/dist/Testing/TestUtil';

interface BlobDef {
	container: string,
	name: string,
}

describe('storage::blob', () => {
	const storageEnvVar = 'AzureWebJobsStorage';
	const testPort = Math.round( Math.random() * 500 + 2000 );
	let blobServiceClient: BlobServiceClient;
	let containerClient: ContainerClient;
	let testServer: TestServer;
	let request: supertest.SuperTest<supertest.Test>;
	let cleanupBlobs: Array<BlobDef> = [];

	before(async function() {
		if (!process.env[storageEnvVar]?.length) {
			this.skip();
			return;
		}

		testServer = new TestServer({
			sourceFile: path.resolve(__dirname, './sources/src/storage-blob.ts'),
			functionsOutDir: path.resolve(__dirname, './sources/function'),
			compileOutDir: path.resolve(__dirname, './sources/dist'),
			tsConfigJson: path.resolve(__dirname, './sources/tsconfig.json'),
			packageJson: path.resolve(__dirname, '../../package.json'),
			packageSymlink: path.resolve(__dirname, './sources/node_modules'),
			startTimeout: 30000,
			portNo: testPort,
		});
		
		await testServer.start();
		assert(testServer.isRunning(), 'Test server should be running');
		request = supertest(testServer.getBaseUrl());
		blobServiceClient = BlobServiceClient.fromConnectionString(process.env[storageEnvVar]);
		
	});

	afterEach(async () => {
		const awaitTasks: Promise<any>[] = [];
		await Promise.all(cleanupBlobs.map(cleanupBlob => {
			const containerClient = blobServiceClient.getContainerClient(cleanupBlob.container);
			const blockBlobClient = containerClient.getBlockBlobClient(cleanupBlob.name);
			return blockBlobClient.deleteIfExists();
		}));

		cleanupBlobs = [];
	});

	after(async () => {
		if (testServer) {
			await testServer.stop();
		}
	});

	it(`reacts to blob changes`, async function() {
		const containerName = 'testblobchanged';
		containerClient = blobServiceClient.getContainerClient(containerName);
		await containerClient.createIfNotExists();
		const blobNameBase = `${this.test.fullTitle()}-${uuidv4()}`.replace(/[^-a-zA-Z0-9_]+/g, '-');
		const blobName = blobNameBase + '.in';
		const outBlobName = blobNameBase + '.out';
		cleanupBlobs.push(
			{ container: containerName, name: blobName },
			{ container: containerName, name: outBlobName },
		);
		const blockBlobClient = containerClient.getBlockBlobClient(blobName);
		const data = this.test.fullTitle();
		await blockBlobClient.upload(data, data.length);

		try {
			await waitTillConditionTrue(async () => {
				const checkBlobClient = containerClient.getBlockBlobClient(outBlobName);
				return await checkBlobClient.exists();
			}, {});
		} catch (e) {
			console.error('==== TEST CASE FAILED ====');
			console.error(testServer.getCombinedOutput());
			console.error('==========================');
			throw Error(`Test failed - timed out checking for output blob: ${outBlobName}`)
		}

		const blobClient = containerClient.getBlockBlobClient(outBlobName);
		const contents = await blobClient.downloadToBuffer();
		const parsedContents = JSON.parse(contents.toString());
		assertRealInclude(parsedContents, {
			blobName: blobNameBase,
			blobExt: 'in'
		});
	});
	
	it(`supports blob contents`, async function() {
		const containerName = 'testblobchangedwithcontents';
		containerClient = blobServiceClient.getContainerClient(containerName);
		await containerClient.createIfNotExists();
		const blobNameBase = `${this.test.fullTitle()}-${uuidv4()}`.replace(/[^-a-zA-Z0-9_]+/g, '-');
		const blobName = blobNameBase + '.in';
		const outBlobName = blobNameBase + '.out';
		cleanupBlobs.push(
			{ container: containerName, name: blobName },
			{ container: containerName, name: outBlobName },
		);
		const blockBlobClient = containerClient.getBlockBlobClient(blobName);
		const data = this.test.fullTitle();
		await blockBlobClient.upload(data, data.length);

		try {
			await waitTillConditionTrue(async () => {
				const checkBlobClient = containerClient.getBlockBlobClient(outBlobName);
				return await checkBlobClient.exists();
			}, {});
		} catch (e) {
			console.error('==== TEST CASE FAILED ====');
			console.error(testServer.getCombinedOutput());
			console.error('==========================');
			throw Error(`Test failed - timed out checking for output blob: ${outBlobName}`)
		}

		const blobClient = containerClient.getBlockBlobClient(outBlobName);
		const contents = await blobClient.downloadToBuffer();
		const parsedContents = JSON.parse(contents.toString());
		assertRealInclude(parsedContents, {
			blobName: blobNameBase,
			blobExt: 'in',
			contents: data,
		});
	});

	it(`supports blob props`, async function() {
		const containerName = 'testblobchangedwithprops';
		containerClient = blobServiceClient.getContainerClient(containerName);
		await containerClient.createIfNotExists();
		const blobNameBase = `${this.test.fullTitle()}-${uuidv4()}`.replace(/[^-a-zA-Z0-9_]+/g, '-');
		const blobName = blobNameBase + '.in';
		const outBlobName = blobNameBase + '.out';
		cleanupBlobs.push(
			{ container: containerName, name: blobName },
			{ container: containerName, name: outBlobName },
		);
		const blockBlobClient = containerClient.getBlockBlobClient(blobName);
		const data = this.test.fullTitle();
		const uploadResults = await blockBlobClient.upload(data, data.length);

		try {
			await waitTillConditionTrue(async () => {
				const checkBlobClient = containerClient.getBlockBlobClient(outBlobName);
				return await checkBlobClient.exists();
			}, {});
		} catch (e) {
			console.error('==== TEST CASE FAILED ====');
			console.error(testServer.getCombinedOutput());
			console.error('==========================');
			throw Error(`Test failed - timed out checking for output blob: ${outBlobName}`)
		}

		const blobClient = containerClient.getBlockBlobClient(outBlobName);
		const contents = await blobClient.downloadToBuffer();
		const parsedContents = JSON.parse(contents.toString());
		assertRealInclude(parsedContents, {
			blobName: blobNameBase,
			blobExt: 'in',
			props: {
				eTag: uploadResults.etag,
				contentMD5: (<Buffer>uploadResults.contentMD5).toString('base64'),
			},
		});
	});
});