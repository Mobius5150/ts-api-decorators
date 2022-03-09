import { assert } from 'chai';
import * as path from 'path';
import 'mocha';
import { getCompiledProgram } from '../../src/Testing/TestUtil';
import { ManagedApi, ApiMethod } from '../../src';
import { TestManagedApi } from '../../src/Testing/TestTransport';

interface IGetInitHandlers {
	getInitHandlers: ManagedApi<{}>['initHandlers'];
	addHandlerClass: ManagedApi<{}>['addHandlerClass']
}

describe('ManagedApi Dependencies', () => {
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
    
    it('should set dependencies after instantiation', async () => {
        const api = modules[0];
        const result = await api.invokeApiCall(ApiMethod.GET, '/hello2', {
            headers: {},
            queryParams: {},
            transportParams: {},
        });

        assert.equal(result.statusCode, 200);
        assert.equal(result.body, 'responseresponse');
    });
    
    it('should supply dependencies for handlers', async () => {
        const api = modules[0];
        const result = await api.invokeApiCall(ApiMethod.GET, '/hello3', {
            headers: {},
            queryParams: {},
            transportParams: {},
        });

        assert.equal(result.statusCode, 200);
        assert.equal(result.body, 'response');
	});

    it('should used the specified instance for dependencies', async () => {
        const api = modules[0];
        const result = await api.invokeApiCall(ApiMethod.GET, '/hellodb3', {
            headers: {},
            queryParams: {},
            transportParams: {},
        });

        assert.equal(result.statusCode, 200);
        assert.equal(result.body, 'db3');
    });

    it('should used the intializer function for dependencies', async () => {
        const api = modules[0];
        const result = await api.invokeApiCall(ApiMethod.GET, '/hellodb4', {
            headers: {},
            queryParams: {},
            transportParams: {},
        });

        assert.equal(result.statusCode, 200);
        assert.equal(result.body, 'db4');
    });
});