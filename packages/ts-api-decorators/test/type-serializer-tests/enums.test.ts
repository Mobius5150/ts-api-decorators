import { assert, expect } from 'chai';
import * as path from 'path';
import 'mocha';
import { getCompiledProgram, assertRealInclude } from '../../src/Testing/TestUtil';
import { ManagedApi, ApiMethod, IApiHandlerInstance } from '../../src';
import { InternalArrayTypeDefinition, InternalObjectTypeDefinition } from '../../src/apiManagement/InternalTypes';

interface IGetInitHandlers {
	getInitHandlers: ManagedApi<{}>['initHandlers'];
	addHandlerClass: ManagedApi<{}>['addHandlerClass'];
}

describe('TypeSerializer', () => {
	let api: IGetInitHandlers;
	let handlers: Map<ApiMethod, Map<string, IApiHandlerInstance<object>>>;
	let modules: any[];

	before(() => {
		modules = getCompiledProgram([path.join(__dirname, 'sources/enums.ts')]);
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

	it('should handle defined string enums properly', async () => {
		const apiPath = '/helloStringEnum';

		assert(handlers.has(ApiMethod.GET));
		assert(handlers.get(ApiMethod.GET).has(apiPath));

		const handlerInstance = handlers.get(ApiMethod.GET).get(apiPath);
		assert.equal(handlerInstance.handlerArgs.length, 1);

		const enumArg = handlerInstance.handlerArgs[0];
		assert.equal(enumArg.args.name, 'enumParam');

		const typedef: InternalArrayTypeDefinition = <InternalArrayTypeDefinition>enumArg.args.typedef;

		// Check the typeof the body argument
		assertRealInclude(typedef, {
			type: 'string',
			typename: 'MyStringEnum',
			schema: {
				enum: ['a', 'b'],
			},
		});

		// Check the return type
		assertRealInclude(handlerInstance.returnType, {
			type: 'string',
			typename: 'MyStringEnum',
			schema: {
				enum: ['a', 'b'],
			},
		});
	});

	it('should handle defined number enums properly', async () => {
		const apiPath = '/helloNumberEnum';

		assert(handlers.has(ApiMethod.GET));
		assert(handlers.get(ApiMethod.GET).has(apiPath));

		const handlerInstance = handlers.get(ApiMethod.GET).get(apiPath);
		assert.equal(handlerInstance.handlerArgs.length, 1);

		const enumArg = handlerInstance.handlerArgs[0];
		assert.equal(enumArg.args.name, 'enumParam');

		const typedef: InternalArrayTypeDefinition = <InternalArrayTypeDefinition>enumArg.args.typedef;

		// Check the typeof the body argument
		assertRealInclude(typedef, {
			type: 'number',
			typename: 'MyNumberEnum',
			schema: {
				enum: [0, 1],
			},
		});
	});

	it('should handle inline number enums properly', async () => {
		const apiPath = '/helloNumberEnumInline';

		assert(handlers.has(ApiMethod.GET));
		assert(handlers.get(ApiMethod.GET).has(apiPath));

		const handlerInstance = handlers.get(ApiMethod.GET).get(apiPath);
		assert.equal(handlerInstance.handlerArgs.length, 1);

		const enumArg = handlerInstance.handlerArgs[0];
		assert.equal(enumArg.args.name, 'enumParam');

		const typedef: InternalArrayTypeDefinition = <InternalArrayTypeDefinition>enumArg.args.typedef;

		// Check the typeof the body argument
		assertRealInclude(typedef, {
			type: 'number',
			schema: {
				enum: [2, 3],
			},
		});
	});

	it('should handle string + number enums properly', async () => {
		const apiPath = '/helloStringNumberEnumInline';

		assert(handlers.has(ApiMethod.GET));
		assert(handlers.get(ApiMethod.GET).has(apiPath));

		const handlerInstance = handlers.get(ApiMethod.GET).get(apiPath);
		assert.equal(handlerInstance.handlerArgs.length, 1);

		const enumArg = handlerInstance.handlerArgs[0];
		assert.equal(enumArg.args.name, 'enumParam');

		const typedef: InternalArrayTypeDefinition = <InternalArrayTypeDefinition>enumArg.args.typedef;

		// Check the typeof the body argument
		assertRealInclude(typedef, {
			type: 'enum',
			schema: {
				enum: ['str', 3],
			},
		});
	});
});
