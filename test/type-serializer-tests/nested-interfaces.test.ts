import { assert } from 'chai';
import * as path from 'path';
import 'mocha';
import { getCompiledProgram } from '../TestUtil';
import { ManagedApi, ApiMethod, IApiHandlerInstance } from '../../src';
import { InternalObjectTypeDefinition } from '../../src/apiManagement/InternalTypes';


describe('TypeSerializer', () => {
	let api: ManagedApi<object>;
	let handlers: Map<ApiMethod, Map<string, IApiHandlerInstance<object>>>;

	beforeEach(() => {
		const modules = getCompiledProgram([
			path.join(__dirname, 'sources/nested-interfaces.ts'),
			path.join(__dirname, 'sources/nested-interfaces.dep.ts'),
		]);
		api = new ManagedApi(false);
		for (const m of modules) {
			api.addHandlerClass(m);
		}
		
		handlers = api.initHandlers();
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
		assert.deepNestedInclude(
			typedef.schema,
			{
				$ref: '#/definitions/IRequestBody',
				definitions: {
					IRequestBody: {
						type: 'object',
						required: ['params', 'version'],
						properties: {
							version: {
								type: 'string'
							},
							params: {
								'$ref': '#/definitions/IBodyParams',
							}
						}
					},
					IBodyParams: {
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
			}
		)
	});

});