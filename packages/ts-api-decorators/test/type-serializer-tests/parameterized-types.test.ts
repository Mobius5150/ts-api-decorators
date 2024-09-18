import { assert, expect } from 'chai';
import * as path from 'path';
import 'mocha';
import { getCompiledProgram, assertRealInclude } from '../../src/Testing/TestUtil';
import { ManagedApi, ApiMethod, IApiHandlerInstance } from '../../src';
import { InternalObjectTypeDefinition } from '../../src/apiManagement/InternalTypes';
import { definitionPathWithSymbolChecker } from '../../src/Testing/TreeTestUtil';

interface IGetInitHandlers {
	getInitHandlers: ManagedApi<{}>['initHandlers'];
	addHandlerClass: ManagedApi<{}>['addHandlerClass'];
}

describe('TypeSerializer', () => {
	let api: IGetInitHandlers;
	let handlers: Map<ApiMethod, Map<string, IApiHandlerInstance<object>>>;
	let modules: any[];

	before(() => {
		modules = getCompiledProgram([path.join(__dirname, 'sources/parameterized-types.ts')]);
	});

	beforeEach(() => {
		api = new (class extends ManagedApi<{}> {
			public getInitHandlers() {
				return this.initHandlers();
			}

			public setHeader(name: string, value: string | number): void {
				throw new Error('Method not implemented.');
			}
		})();

		for (const m of modules) {
			api.addHandlerClass(m);
		}

		handlers = api.getInitHandlers();
	});

	it('should parse parameterized return types', async () => {
		const apiPath = '/hello';

		assert(handlers.has(ApiMethod.GET));
		assert(handlers.get(ApiMethod.GET)!.has(apiPath));

		const handlerInstance = handlers.get(ApiMethod.GET)!.get(apiPath)!;
		assert.exists(handlerInstance, 'Handler');

		const returnType: InternalObjectTypeDefinition = <InternalObjectTypeDefinition>handlerInstance.returnType!;
		assert.exists(handlerInstance.returnType, 'Return type');
		assert.equal(returnType.typename, 'IResponse');
		const response = Symbol('IResponse<P>'),
			typeP = Symbol('P');
		assertRealInclude(
			returnType.schema,
			{
				$ref: (actual, ctx) => definitionPathWithSymbolChecker(actual, response, 'IResponse<P>', ctx),
				definitions: {
					// Something like IResponse<P>.<x>
					[response]: {
						type: 'object',
						required: ['response'],
						properties: {
							response: {
								$ref: (actual, ctx) => definitionPathWithSymbolChecker(actual, typeP, 'P', ctx),
							},
						},
					},
					// Something like P.<x>
					[typeP]: {
						type: 'object',
					},
				},
			},
			undefined,
			{
				funcmode: 'matcher',
				symbols: {
					[response]: {},
					[typeP]: {},
				},
			},
		);
	});

	it('should parse hidden parameterized return types', async () => {
		const apiPath = '/helloHidden';

		assert(handlers.has(ApiMethod.GET));
		assert(handlers.get(ApiMethod.GET)!.has(apiPath));

		const handlerInstance = handlers.get(ApiMethod.GET)!.get(apiPath)!;
		assert.exists(handlerInstance, 'Handler');

		const returnType: InternalObjectTypeDefinition = <InternalObjectTypeDefinition>handlerInstance.returnType!;
		assert.exists(handlerInstance.returnType, 'Return type');
		assert.equal(returnType.typename, 'IHiddenResponse');
		const hiddenResponse = Symbol('IHiddenResponse'),
			responseBody = Symbol('IResponseBody'),
			response = Symbol('IResponse<IResponseBody>');
		assertRealInclude(
			returnType.schema!,
			{
				$ref: (actual, ctx) => definitionPathWithSymbolChecker(actual, hiddenResponse, 'IHiddenResponse', ctx),
				definitions: {
					// IHiddenResponse.<x>
					[hiddenResponse]: {
						type: 'object',
						required: ['response'],
						properties: {
							response: {
								$ref: (actual, ctx) => definitionPathWithSymbolChecker(actual, response, 'IResponse<IResponseBody>', ctx),
							},
						},
					},
					// IResponseBody.<x>
					[responseBody]: {
						type: 'object',
						required: ['greeting'],
						properties: {
							greeting: {
								type: 'string',
							},
						},
					},
					// IResponse<IResponseBody>.<x>
					[response]: {
						type: 'object',
						required: ['response'],
						properties: {
							response: {
								$ref: (actual, ctx) => definitionPathWithSymbolChecker(actual, responseBody, 'IResponseBody', ctx),
							},
						},
					},
				},
			},
			undefined,
			{
				funcmode: 'matcher',
				symbols: {
					[hiddenResponse]: {},
					[responseBody]: { matcher: (a: string) => !!a?.startsWith('IResponseBody') },
					[response]: {},
				},
			},
		);
	});

	it('should parse complex alias types', async () => {
		const apiPath = '/helloComplex';

		assert(handlers.has(ApiMethod.GET));
		assert(handlers.get(ApiMethod.GET)!.has(apiPath));

		const handlerInstance = handlers.get(ApiMethod.GET)!.get(apiPath)!;
		assert.exists(handlerInstance, 'Handler');

		const returnType: InternalObjectTypeDefinition = <InternalObjectTypeDefinition>handlerInstance.returnType!;
		assert.exists(handlerInstance.returnType, 'Return type');
		assert.equal(returnType.typename, 'ComplexAliasType');
		const t1 = Symbol('Pick<IResponseBody&IHiddenResponse,"greeting">'),
			t2 = Symbol('Partial<IResponse<object>>');
		assertRealInclude(
			returnType.schema!,
			{
				allOf: [
					{
						$ref: (actual, ctx) => definitionPathWithSymbolChecker(actual, t1, 'Pick<IResponseBody&IHiddenResponse,"greeting">', ctx),
					},
					{
						$ref: (actual, ctx) => definitionPathWithSymbolChecker(actual, t2, 'Partial<IResponse<object>>', ctx),
					},
				],
				definitions: {
					// Pick<IResponseBody&IHiddenResponse,"greeting">.<x>
					[t1]: {
						type: 'object',
						required: ['greeting'],
						properties: {
							greeting: {
								type: 'string',
							},
						},
					},
					// Partial<IResponse<object>>.<x>
					[t2]: {
						type: 'object',
						properties: {
							response: {
								type: 'object',
								properties: {},
								additionalProperties: true,
							},
						},
					},
				},
			},
			undefined,
			{
				funcmode: 'matcher',
				symbols: {
					[t1]: { matcher: (a: string) => !!a?.startsWith('Pick<IResponseBody&IHiddenResponse,"greeting">') },
					[t2]: { matcher: (a: string) => !!a?.startsWith('Partial<IResponse<object>>') },
				},
			},
		);
	});
});
