import { Api, ApiGetMethod, ApiQueryParam, AzFuncTimerTrigger, AzFuncTimerParam, IAzureFunctionsTimer } from 'ts-api-decorators-azure-function';

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

	@AzFuncTimerTrigger('*/5 * * * * *')
	timer(
		@AzFuncTimerParam() timer: IAzureFunctionsTimer,
	) {
		console.log(`Timer trigger fired ${timer.IsPastDue ? 'off' : 'on'} schedule.`);
	}
}