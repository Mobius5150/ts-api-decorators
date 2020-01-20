import { ManagedApi, Api, ApiGetMethod, ApiQueryParam, ApiPutMethod } from 'ts-api-decorators-azure-function';

@Api
class MyApi {
	@ApiGetMethod('/hello')
	greet(
		@ApiQueryParam() name?: string
	) {
		if (name) {
			return `Hello ${name}!`;
		}
console.log('Apiinvoked');
		return 'Hello World!';
	}

	@ApiPutMethod('/hello')
	greetPut(
		@ApiQueryParam() name?: string
	) {
		if (name) {
			return `Hello ${name}!`;
		}

		return 'Hello World!';
	}
}