# Timer Trigger
The timer trigger is used to execute a method on a schedule. Timer triggers are defined using the `@AzFuncTimerTrigger()` decorator, with the first argument being a cron expression. For details, see the official [Azure Functions Timer Trigger documentation](https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-timer?tabs=javascript#usage).
```typescript
import { Api, AzFuncTimerTrigger, IAzureFunctionsTimer } from 'ts-api-decorators-azure-function';

@Api
class MyApi {
	@AzFuncTimerTrigger('*/5 * * * * *')
	timer(
		@AzFuncTimerParam() timer: IAzureFunctionsTimer,
	) {
		console.log(`Timer trigger fired ${timer.IsPastDue ? 'off' : 'on'} schedule.`);
	}
}
```

The `@AzFuncTimerParam()` can optionally be used to get the timer information that the Azure Functions library provides, as shown above.