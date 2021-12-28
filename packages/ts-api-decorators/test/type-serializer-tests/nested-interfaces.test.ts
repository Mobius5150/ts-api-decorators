import { assert, expect } from 'chai';
import * as path from 'path';
import 'mocha';
import { getCompiledProgram, assertRealInclude } from '../../src/Testing/TestUtil';
import { ManagedApi, ApiMethod, IApiHandlerInstance } from '../../src';
import { InternalObjectTypeDefinition } from '../../src/apiManagement/InternalTypes';
import { DeepPartial, definitionPathWithSymbolChecker } from '../../src/Testing/TreeTestUtil';

interface IGetInitHandlers {
	getInitHandlers: ManagedApi<{}>['initHandlers'];
	addHandlerClass: ManagedApi<{}>['addHandlerClass']
}

describe('TypeSerializer', () => {
	let api: IGetInitHandlers;
	let handlers: Map<ApiMethod, Map<string, IApiHandlerInstance<object>>>;
	let modules: any[];
	
	before(() => {
		modules = getCompiledProgram([
			path.join(__dirname, 'sources/nested-interfaces.ts'),
			path.join(__dirname, 'sources/nested-interfaces.dep.ts'),
		]);
	})

	beforeEach(() => {
		api = new (class extends ManagedApi<{}> {
			public getInitHandlers() {
				return this.initHandlers();
			}

			public setHeader(name: string, value: string | number): void {
				throw new Error("Method not implemented.");
			}
		});

		for (const m of modules) {
			api.addHandlerClass(m);
		}
		
		handlers = api.getInitHandlers();
	});

	it('should parse nested interfaces', async () => {
		const apiPath = '/hello';
		
		assert(handlers.has(ApiMethod.GET));
		assert(handlers.get(ApiMethod.GET).has(apiPath));

		const handlerInstance = handlers.get(ApiMethod.GET).get(apiPath);
		assert.equal(handlerInstance.handlerArgs.length, 1);

		const bodyArg = handlerInstance.handlerArgs[0];
		assert.equal(bodyArg.args.name, 'body');

		const typedef: InternalObjectTypeDefinition = <InternalObjectTypeDefinition>bodyArg.args.typedef;
		assert.equal(typedef.typename, 'IRequestBody');
		const requestBody = Symbol('IRequestBody'), bodyParams = Symbol('IBodyParams');
		assertRealInclude(
			typedef.schema,
			{
				$ref: (actual, ctx) => definitionPathWithSymbolChecker(actual, requestBody, 'IRequestBody', ctx),
				definitions: {
					[requestBody]: {
						type: 'object',
						required: ['params', 'version'],
						properties: {
							version: {
								type: 'string'
							},
							params: {
								'$ref': (actual, ctx) => definitionPathWithSymbolChecker(actual, bodyParams, 'IBodyParams', ctx),
							}
						}
					},
					[bodyParams]: {
						type: 'object',
						required: ['params', 'source'],
						properties: {
							source: {
								type: 'string',
								enum: ['a'],
							},
							params: {
								type: 'array',
								items: {
									type: 'string',
								}
							}
						}
					}
				},
			},
			undefined,
			{
				funcmode: 'matcher',
				symbols: {
					[requestBody]: {},
					[bodyParams]: {},
				}
			}
		)
	});

	it('should parse return types', async () => {
		assert(handlers.has(ApiMethod.GET));
		const getHandlers = handlers.get(ApiMethod.GET);
		const responseBody = Symbol('IResponseBody');
		const routeAssertions: {[key: string]: DeepPartial<IApiHandlerInstance<object>['returnType']>} = {
			'/hello': {
				type: 'string'
			},
			'/helloDep': {
				type: 'object',
				schema: {
					$ref: (actual, ctx) => definitionPathWithSymbolChecker(actual, responseBody, 'IResponseBody', ctx),
					definitions: {
						[<any>responseBody]: {
							type: 'object',
							properties: {
								message: {
									type: 'string'
								},
							},
							required: ['message'],
						}
					}
				}
			},
		};

		assert.equal(getHandlers.size, Object.keys(routeAssertions).length);
		for (const [route, instance] of getHandlers) {
			if (!routeAssertions[route]) {
				throw new Error('Unknown route to verify return type of: ' + instance.route);
			}

			assertRealInclude(
				instance.returnType,
				routeAssertions[route],
				undefined,
				{ funcmode: 'matcher', symbols: { [responseBody]: {} } });
		}
	});
});