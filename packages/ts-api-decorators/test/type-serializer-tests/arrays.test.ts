import { assert, expect } from 'chai';
import * as path from 'path';
import 'mocha';
import { getCompiledProgram, assertRealInclude } from '../../src/Testing/TestUtil';
import { ManagedApi, ApiMethod, IApiHandlerInstance } from '../../src';
import { InternalArrayTypeDefinition, InternalObjectTypeDefinition } from '../../src/apiManagement/InternalTypes';

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
			path.join(__dirname, 'sources/arrays.ts'),
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

	it('should handle arrays properly', async () => {
		const apiPath = '/hello';
		
		assert(handlers.has(ApiMethod.GET));
		assert(handlers.get(ApiMethod.GET).has(apiPath));

		const handlerInstance = handlers.get(ApiMethod.GET).get(apiPath);
		assert.equal(handlerInstance.handlerArgs.length, 1);

		const bodyArg = handlerInstance.handlerArgs[0];
		assert.equal(bodyArg.args.name, 'body');

		const typedef: InternalArrayTypeDefinition = <InternalArrayTypeDefinition>bodyArg.args.typedef;

		// Check the typeof the body argument
		assertRealInclude(
			typedef,
			{
				type: "array",
				elementType: {
					type: "object",
					typename: "IRequestBody",
					schema: {
						$ref: '#/definitions/IRequestBody',
						definitions: {
							IRequestBody: {
								type: 'object',
								required: ['prompt'],
								properties: {
									prompt: {
										type: 'string'
									},
								}
							}
						},
					}
				}
			}
		)

		// Check the return type
		assertRealInclude(
			handlerInstance.returnType,
			{
				type: "array",
				elementType: {
					type: "object",
					typename: "IResponseBody",
					schema: {
						$ref: '#/definitions/IResponseBody',
						definitions: {
							IResponseBody: {
								type: 'object',
								required: ['response'],
								properties: {
									response: {
										type: 'string'
									}
								}
							}
						},
					}
				}
			}
		)
	});

	it('should handle arrays in promises properly', async () => {
		const apiPath = '/helloPromise';
		
		assert(handlers.has(ApiMethod.GET));
		assert(handlers.get(ApiMethod.GET).has(apiPath));

		const handlerInstance = handlers.get(ApiMethod.GET).get(apiPath);
		assert.equal(handlerInstance.handlerArgs.length, 1);

		const bodyArg = handlerInstance.handlerArgs[0];
		assert.equal(bodyArg.args.name, 'body');

		const typedef: InternalArrayTypeDefinition = <InternalArrayTypeDefinition>bodyArg.args.typedef;

		// Check the typeof the body argument
		assertRealInclude(
			typedef,
			{
				type: "array",
				elementType: {
					type: "object",
					typename: "IRequestBody",
					schema: {
						$ref: '#/definitions/IRequestBody',
						definitions: {
							IRequestBody: {
								type: 'object',
								required: ['prompt'],
								properties: {
									prompt: {
										type: 'string'
									},
								}
							}
						},
					}
				}
			}
		)

		// Check the return type
		assertRealInclude(
			handlerInstance.returnType,
			{
				type: "array",
				elementType: {
					type: "object",
					typename: "IResponseBody",
					schema: {
						$ref: '#/definitions/IResponseBody',
						definitions: {
							IResponseBody: {
								type: 'object',
								required: ['response'],
								properties: {
									response: {
										type: 'string'
									}
								}
							}
						},
					}
				}
			}
		)
	});
});