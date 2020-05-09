import { assert } from 'chai';
import * as path from 'path';
import 'mocha';
import * as sinon from 'sinon';
import { getCompiledProgram } from '../../src/Testing/TestUtil';
import { ApiMethod, IApiInvocationParams, IApiInvocationContext, IApiInvocationContextPostInvoke } from '../../src';
import { TestManagedApi, ITestManagedApiContext } from '../../src/Testing/TestTransport';

describe('Hooks', () => {
	let api: TestManagedApi;
    
	
	beforeEach(() => {
		[api] = getCompiledProgram([
			path.join(__dirname, 'sources/hooks.ts'),
        ]);
        
        api.init();
	})

	it('should be called when registered', async () => {
		const preInvoke = sinon.fake();
		const postInvoke = sinon.fake();

		api.addHook('handler-preinvoke', preInvoke);
		api.addHook('handler-postinvoke', postInvoke);

		const invocationParams: IApiInvocationParams<ITestManagedApiContext> = {
			headers: {},
			pathParams: {},
			queryParams: {
				name: 'Mike',
			},
			transportParams: {},
		}
		
		await api.invokeApiCall(ApiMethod.GET, '/hello', invocationParams);

		sinon.assert.calledOnce(preInvoke);
		sinon.assert.calledWith(preInvoke, sinon.match({invocationParams}))

		const postInvokeParams: Partial<IApiInvocationContextPostInvoke<ITestManagedApiContext>> = {
			invocationParams,
			result: {
				body: `Hi ${invocationParams.queryParams.name}`,
				headers: {},
				statusCode: 200,
			}
		};
		sinon.assert.calledOnce(postInvoke);
		sinon.assert.calledWith(postInvoke, sinon.match(postInvokeParams))
	});

	it('should not be called when unregistered', async () => {
		const preInvoke = sinon.fake();
		const postInvoke = sinon.fake();

		api.addHook('handler-preinvoke', preInvoke);
		api.addHook('handler-postinvoke', postInvoke);

		api.removeHook('handler-preinvoke', preInvoke);

		const invocationParams: IApiInvocationParams<ITestManagedApiContext> = {
			headers: {},
			pathParams: {},
			queryParams: {
				name: 'Mike',
			},
			transportParams: {},
		}
		
		await api.invokeApiCall(ApiMethod.GET, '/hello', invocationParams);

		sinon.assert.notCalled(preInvoke);

		const postInvokeParams: Partial<IApiInvocationContextPostInvoke<ITestManagedApiContext>> = {
			invocationParams,
			result: {
				body: `Hi ${invocationParams.queryParams.name}`,
				headers: {},
				statusCode: 200,
			}
		};
		sinon.assert.calledOnce(postInvoke);
		sinon.assert.calledWith(postInvoke, sinon.match(postInvokeParams))
	});

	it('should support multiple handlers', async () => {
		const preInvoke = [];
		const numSpies = 10;
		for (let i = 1; i <= numSpies + 1; ++i) {
			const spy = sinon.spy((params: IApiInvocationContext<ITestManagedApiContext>) => (<IApiInvocationContext<ITestManagedApiContext>>{
				...params,
				invocationParams: {
					...params.invocationParams,
					transportParams: {
						'num': i,
					}
				}
			}));

			api.addHook('handler-preinvoke', spy);
			preInvoke.push(spy);
		}

		const postInvoke = sinon.fake();
		api.addHook('handler-postinvoke', postInvoke);
		api.removeHook('handler-preinvoke', preInvoke[numSpies]);

		const invocationParams: IApiInvocationParams<ITestManagedApiContext> = {
			headers: {},
			pathParams: {},
			queryParams: {
				name: 'Mike',
			},
			transportParams: {
				num: 0,
			},
		}
		
		await api.invokeApiCall(ApiMethod.GET, '/hello', invocationParams);

		for (let i = 1; i <= numSpies; ++i) {
			const spy = preInvoke[i-1];
			sinon.assert.calledOnce(spy);
			sinon.assert.calledWith(spy, sinon.match({
				invocationParams: {
					...invocationParams,
					transportParams: {
						num: i-1,
					}
				}
			}))
		}

		sinon.assert.notCalled(preInvoke[numSpies]);

		const postInvokeParams: Partial<IApiInvocationContextPostInvoke<ITestManagedApiContext>> = {
			invocationParams: {
				...invocationParams,
				transportParams: {
					num: numSpies,
				}
			},
			result: {
				body: `Hi ${invocationParams.queryParams.name}`,
				headers: {},
				statusCode: 200,
			}
		};
		sinon.assert.calledOnce(postInvoke);
		sinon.assert.calledWith(postInvoke, sinon.match(postInvokeParams))
	});

});