import { assert, expect } from 'chai';
import * as path from 'path';
import 'mocha';
import { getCompiledProgram, assertRealInclude } from '../../src/Testing/TestUtil';
import { ManagedApi, ApiMethod, IApiHandlerInstance } from '../../src';
import { InternalObjectTypeDefinition } from '../../src/apiManagement/InternalTypes';

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
			path.join(__dirname, 'sources/parameterized-types.ts'),
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

	it('should parse parameterized return types', async () => {
		const apiPath = '/hello';
		
		assert(handlers.has(ApiMethod.GET));
		assert(handlers.get(ApiMethod.GET).has(apiPath));

		const handlerInstance = handlers.get(ApiMethod.GET).get(apiPath);
		assert.exists(handlerInstance, 'Handler');

		const returnType: InternalObjectTypeDefinition = <InternalObjectTypeDefinition>handlerInstance.returnType!;
		assert.exists(handlerInstance.returnType, 'Return type');
		assert.equal(returnType.typename, 'IResponse');
		assert.deepNestedInclude(
			returnType.schema,
			{
				$ref: '#/definitions/IResponse<P>',
				definitions: {
					'IResponse<P>': {
						type: 'object',
						required: ['response'],
						properties: {
							response: {
								'$ref': '#/definitions/P',
							}
						}
					},
					P: {
						type: 'object',
					}
				},
			}
		)
	});

	it('should parse hidden parameterized return types', async () => {
		const apiPath = '/helloHidden';
		
		assert(handlers.has(ApiMethod.GET));
		assert(handlers.get(ApiMethod.GET).has(apiPath));

		const handlerInstance = handlers.get(ApiMethod.GET).get(apiPath);
		assert.exists(handlerInstance, 'Handler');

		const returnType: InternalObjectTypeDefinition = <InternalObjectTypeDefinition>handlerInstance.returnType!;
		assert.exists(handlerInstance.returnType, 'Return type');
		assert.equal(returnType.typename, 'IHiddenResponse');
		assert.deepNestedInclude(
			returnType.schema,
			{
				$ref: '#/definitions/IHiddenResponse',
				definitions: {
					IHiddenResponse: {
						type: 'object',
						required: ['response'],
						properties: {
							response: {
								'$ref': '#/definitions/IResponse<IResponseBody>',
							}
						}
					},
					IResponseBody: {
						type: 'object',
						required: ['greeting'],
						properties: {
							greeting: {
								type: 'string',
							}
						}
					},
					'IResponse<IResponseBody>': {
						type: 'object',
						required: ['response'],
						properties: {
							response: {
								'$ref': '#/definitions/IResponseBody',
							}
						}
					},
					'IResponse<P>': {
						type: 'object',
						required: ['response'],
						properties: {
							response: {
								'$ref': '#/definitions/P',
							}
						}
					},
					P: {
						type: 'object',
					}
				},
			}
		)
	});
});