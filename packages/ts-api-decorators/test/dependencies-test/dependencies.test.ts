import { assert, expect } from 'chai';
import * as path from 'path';
import 'mocha';
import { getCompiledProgram, assertRealInclude } from '../TestUtil';
import { ManagedApi, ApiMethod, IApiHandlerInstance } from '../../src';
import { InternalObjectTypeDefinition } from '../../src/apiManagement/InternalTypes';
import { TestManagedApi } from '../TestTransport';

interface IGetInitHandlers {
	getInitHandlers: ManagedApi<{}>['initHandlers'];
	addHandlerClass: ManagedApi<{}>['addHandlerClass']
}

describe('ManagedApi Dependencies', () => {
	let api: IGetInitHandlers;
	let handlers: Map<ApiMethod, Map<string, IApiHandlerInstance<object>>>;
	let modules: TestManagedApi[];
	
	before(() => {
		modules = getCompiledProgram([
			path.join(__dirname, 'sources/basic-dependencies.ts'),
        ]);
        for (const m of modules) {
            m.init();
        }
	})

	it('should instantiate classes with dependencies', async () => {
        const api = modules[0];
        const result = await api.invokeApiCall(ApiMethod.GET, '/hello', {
            headers: {},
            queryParams: {},
            transportParams: {},
        });

        assert.equal(result.statusCode, 200);
        assert.equal(result.body, 'response');
	});
});