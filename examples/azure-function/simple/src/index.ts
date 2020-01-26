import { Api, ApiGetMethod, ApiQueryParam, AzFuncTimerTrigger } from 'ts-api-decorators-azure-function';

@Api
class MyApi {
	@ApiGetMethod('/hello')
	greet(
		@ApiQueryParam() name?: string
	) {
		if (name) {
			return `Hello ${name}!`;
		}

		return 'Hello World!';
	}

	@AzFuncTimerTrigger('*/20 * * * * *')
	timer() {
		console.log('This timer works!');
	}
}