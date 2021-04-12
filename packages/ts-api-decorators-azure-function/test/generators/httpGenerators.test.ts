import 'mocha';
import { expect, assert } from 'chai';
import { ApiMethod } from 'ts-api-decorators';
import * as path from 'path';
import { HttpBindingTriggerFactory } from '../../src/generators/Bindings/HttpBinding';
import { IFunctionJsonFileGeneratorOpts, FunctionJsonFileGenerator, IFunctionJson } from '../../src/generators/FunctionJsonFileGenerator';
import { ApiParser } from 'ts-api-decorators/dist/Util/ApiParser';
import { IParseApiResult } from 'ts-api-decorators/dist/command/CliCommand';
import { RouteReducer } from '../../src/Util/RouteReducer';
import { IHttpTriggerBinding, IHttpOutputBinding } from '../../src/generators/Bindings/Bindings';
import { assertRealInclude } from 'ts-api-decorators/dist/Testing/TestUtil';

describe('generators-http', () => {
	let apiParser: ApiParser = new ApiParser();
	let api: IParseApiResult;
	const generatorOpts: IFunctionJsonFileGeneratorOpts = {
		triggers: [
			HttpBindingTriggerFactory.GetBindingForMethod(ApiMethod.GET),
			HttpBindingTriggerFactory.GetBindingForMethod(ApiMethod.PUT),
			HttpBindingTriggerFactory.GetBindingForMethod(ApiMethod.POST),
			HttpBindingTriggerFactory.GetBindingForMethod(ApiMethod.DELETE),
		],
		params: [],
		outputs: [],
	};

	before(async () => {
		api = await apiParser.parseApi({
			apiInfo:  path.resolve(__dirname, '../../package.json'),
			rootDir: path.resolve(__dirname, './sources'),
			tsconfig:  path.resolve(__dirname, './sources/tsconfig.json'),
		});
	});

	after(async () => {
		
	});

	describe('FunctionJsonFileGenerator', () => {
		const functionJsonGen: FunctionJsonFileGenerator = new FunctionJsonFileGenerator(generatorOpts);
		const methods = ['get', 'put', 'post', 'delete'];
		for (const verb of methods) {
			const verbUpper = verb.toUpperCase();
			it(`FunctionJsonFileGenerator works for ${verbUpper}`, async () => {
				const reduced = RouteReducer.reduceFunctionRoutesByPath(api);
				let assertionCount = 0;
				for (let [[method, route, ...bindings], routes] of reduced) {
					if (method !== 'http' || route !== `/${verb}`) {
						continue;
					}

					const outGenerator = functionJsonGen.forTree(routes);
					const generated = await outGenerator('file.json');
					expect(generated).to.instanceOf(Buffer, 'Generated output should be a buffer');

					const parsedGenerated: IFunctionJson = JSON.parse((<Buffer>generated).toString());
					assertRealInclude(parsedGenerated, (<IFunctionJson>{
						bindings: [
							(<IHttpTriggerBinding>{
								name: 'request',
								direction: 'in',
								type: 'httpTrigger',
								route: verb,
								methods: [
									verb,
								],
							}),
							(<IHttpOutputBinding>{
								name: 'response',
								direction: 'out',
								type: 'http',
							}),
						],
						scriptFile: 'index.js'
					}));

					++assertionCount;
				}

				expect(assertionCount).to.be.greaterThan(0, 'Should check at least one assertion');
			});
		}

		it(`FunctionJsonFileGenerator works for multiple methods in a route`, async () => {
			const reduced = RouteReducer.reduceFunctionRoutesByPath(api);
			let assertionCount = 0;
			for (let [[method, route, ...bindings], routes] of reduced) {
				if (method !== 'http' || route !== `/hello`) {
					continue;
				}

				const outGenerator = functionJsonGen.forTree(routes);
				const generated = await outGenerator('file.json');
				expect(generated).to.instanceOf(Buffer, 'Generated output should be a buffer');
				
				const parsedGenerated: IFunctionJson = JSON.parse((<Buffer>generated).toString());
				assertRealInclude(parsedGenerated, (<IFunctionJson>{
					bindings: [
						(<IHttpTriggerBinding>{
							name: 'request',
							direction: 'in',
							type: 'httpTrigger',
							route: 'hello',
							methods,
						}),
						(<IHttpOutputBinding>{
							name: 'response',
							direction: 'out',
							type: 'http',
						}),
					],
				}));

				++assertionCount;
			}

			expect(assertionCount).to.be.greaterThan(0, 'Should check at least one assertion');
		});
	});
});