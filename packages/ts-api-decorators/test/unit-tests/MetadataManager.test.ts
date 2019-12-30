import 'mocha';
import { expect, assert } from 'chai';
import * as sinon from 'sinon';
import { MetadataManager } from '../../src/transformer/MetadataManager';
import { ITransformerMetadata, IMetadataType } from '../../src/transformer/TransformerMetadata';
import { IExtractedApiDefinition } from '../../src/transformer/ExtractionTransformer';
import { ApiMethod } from '../../src/apiManagement/ApiDefinition';
import { IDecorationFunctionTransformInfoBase } from '../../src/transformer/DecoratorTransformer';

describe('MetadataManager', () => {
    const method: IExtractedApiDefinition = {
        file: 'file.ts',
        handlerKey: 'method',
        method: ApiMethod.GET,
        parameters: [],
        route: '/method',
    };

	it('should call the generator', async () => {
        const manager = new MetadataManager();
        const testObj: ITransformerMetadata = {
            type: IMetadataType.OpenApi,
            value: 'testVal',
        };

        const generatorFunc = sinon.spy((method, methodNode) => [testObj]);
        manager.addApiMethodMetadataGenerator(generatorFunc);

        const result = manager.getApiMetadataForApiMethod(method, null, null);
        assert.equal(result.length, 1);
        assert.equal(result[0], testObj);
        assert(generatorFunc.calledWith(method, null));
        assert(generatorFunc.calledOnce);
    });
    
    it('should call the generator', async () => {
        const manager = new MetadataManager();
        const testObj: ITransformerMetadata = {
            type: IMetadataType.OpenApi,
            value: 'testVal',
        };

        const callDecorator: IDecorationFunctionTransformInfoBase = {
            indexTs: 'index.ts',
            magicFunctionName: 'magicFunc',
        };

        const noCallDecorator: IDecorationFunctionTransformInfoBase = {
            indexTs: 'index.ts',
            magicFunctionName: 'magicFunc2',
        };

        const callGeneratorFunc = sinon.spy((method, methodNode) => [testObj]);
        const noCallGeneratorFunc = sinon.spy((method, methodNode) => [testObj]);
        manager.addApiMethodMetadataGenerator(callGeneratorFunc);
        manager.addApiMethodMetadataGenerator(callGeneratorFunc, callDecorator);
        manager.addApiMethodMetadataGenerator(noCallGeneratorFunc, noCallDecorator);

        // Call with a decorator
        let result = manager.getApiMetadataForApiMethod(method, null, callDecorator);
        assert.equal(result.length, 1);
        assert.equal(result[0], testObj);

        assert(callGeneratorFunc.calledOnceWith(method, null));
        assert(noCallGeneratorFunc.notCalled);

        callGeneratorFunc.resetHistory();
        noCallGeneratorFunc.resetHistory();

        // Call without a decorator
        result = manager.getApiMetadataForApiMethod(method, null, null);
        assert.equal(result.length, 1);
        assert.equal(result[0], testObj);

        assert(callGeneratorFunc.calledOnceWith(method, null));
        assert(noCallGeneratorFunc.notCalled);

        callGeneratorFunc.resetHistory();
        noCallGeneratorFunc.resetHistory();

        // Call the second method
        result = manager.getApiMetadataForApiMethod(method, null, noCallDecorator);
        assert.equal(result.length, 1);
        assert.equal(result[0], testObj);

        assert(callGeneratorFunc.notCalled);
        assert(noCallGeneratorFunc.calledOnceWith(method, null));

        callGeneratorFunc.resetHistory();
        noCallGeneratorFunc.resetHistory();

        // No result
        manager.removeApiMethodMetadataGenerator(noCallGeneratorFunc, noCallDecorator);
        result = manager.getApiMetadataForApiMethod(method, null, noCallDecorator);
        assert.equal(result.length, 0);

        assert(callGeneratorFunc.notCalled);
        assert(noCallGeneratorFunc.notCalled);
	});
});