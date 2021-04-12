import 'mocha';
import { expect, assert } from 'chai';
import * as path from 'path';
import { IFunctionJsonFileGeneratorOpts, FunctionJsonFileGenerator, IFunctionJson } from '../../src/generators/FunctionJsonFileGenerator';
import { ApiParser } from 'ts-api-decorators/dist/Util/ApiParser';
import { IParseApiResult } from 'ts-api-decorators/dist/command/CliCommand';
import { RouteReducer } from '../../src/Util/RouteReducer';
import { IHttpTriggerBinding, IHttpOutputBinding, IBindingTrigger } from '../../src/generators/Bindings/Bindings';
import { assertRealInclude } from 'ts-api-decorators/dist/Testing/TestUtil';
import { BlobStorageBindingTriggerFactory, BlobStorageOutputBindingFactory } from '../../src/generators/Bindings/BlobStorageBinding';
import { IBlobOutputBinding, IBlobTriggerBinding } from '../../src/decorators/ExtensionDecorators/BlobStorage/BlobStorageBinding';
import { getTransformerArguments } from '../../src/transformer';

describe('generators-storage-blob', () => {
	let apiParser: ApiParser = new ApiParser();
	let api: IParseApiResult;
	const generatorOpts: IFunctionJsonFileGeneratorOpts = {
		triggers: [
			BlobStorageBindingTriggerFactory.GetTriggerBinding(),
		],
		params: [],
		outputs: [
			...BlobStorageOutputBindingFactory.GetOutputBindings(),
		],
	};

	before(async () => {
		api = await apiParser.parseApi({
			apiInfo:  path.resolve(__dirname, '../../package.json'),
			rootDir: path.resolve(__dirname, './sources'),
			tsconfig:  path.resolve(__dirname, './sources/tsconfig.json'),
		}, getTransformerArguments());
	});

	after(async () => {
		
	});

	describe('FunctionJsonFileGenerator', () => {
		const functionJsonGen: FunctionJsonFileGenerator = new FunctionJsonFileGenerator(generatorOpts);
		it(`FunctionJsonFileGenerator works for blobTrigger`, async () => {
			const reduced = RouteReducer.reduceFunctionRoutesByPath(api);
			let assertionCount = 0;
			for (let [[method, route, ...bindings], routes] of reduced) {
				if (method !== 'blobTrigger') {
					continue;
				}

				const outGenerator = functionJsonGen.forTree(routes);
				const generated = await outGenerator('file.json');
				expect(generated).to.instanceOf(Buffer, 'Generated output should be a buffer');

				const parsedGenerated: IFunctionJson = JSON.parse((<Buffer>generated).toString());
				assertRealInclude(parsedGenerated, (<Partial<IFunctionJson>>{
					bindings: [
						(<IBlobTriggerBinding>{
							name: 'blobTrigger',
							direction: 'in',
							type: 'blobTrigger',
							path: 'inPath',
							connection: 'inConnectionStr',
						}),
						(<IBlobOutputBinding>{
							name: 'outputblob',
							direction: 'out',
							type: 'blob',
							path: 'outPath',
							connection: 'outConnectionStr',
						}),
					]
				}));

				++assertionCount;
			}

			expect(assertionCount).to.be.greaterThan(0, 'Should check at least one assertion');
		});
	});
});