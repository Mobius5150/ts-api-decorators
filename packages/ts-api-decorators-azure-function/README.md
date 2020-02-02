# Azure Function API Decorators
This library allows you to use [Typescript API Decorators](https://github.com/Mobius5150/ts-api-decorators) with the Azure Functions.

## Installation
This library performs preprocessing on APIs during the typescript compilation step. See [Configuring Transformers](../../ConfiguringTransformers.md) for how to set this up. If you want to get started faster, check out the simple example in [examples/azure/simple](../../examples/azure/simple).

## Usage (Defining an API)
APIs are defined as methods on a class:
```typescript
import { Api, ApiGetMethod } from 'ts-api-decorators-azure-function';

@Api
class MyApi {
	@ApiGetMethod('/hello')
	greet() {
		return 'Hello World!';
	}
}
```

This defines an API that exposes a single `GET` handler at `/hello` that returns the string `Hello World!`. To call the API, build your project and then use `tsapi` to generate the Azure Function binding files:
```
tsc
npx tsapi azfunc-generate . functions
```

This command will output the functions definitions to a new folder called `functions` (the last argument). The resulting directory structure will look like this:
```
dist/
	myApi.js
functions/hello/
	function.json
	index.js
src/
	myApi.ts
tsconfig.json
```

> The `dist` folder above was generate by the `tsc` build and is the compiled version of `src/myApi.ts`.

To start your Azure Function server, run the below using the [Azure Functions Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local):
```
cd functions
func start
```

For complete documentation on `ts-api-decorators` functionality, [see the README at the root of the repo](../../). Continue reading for Azure Functions-specific features and examples.

### Examples

See the [examples](/examples/azure-function) directory for the following examples:

- [Simple Azure Functions example](/examples/azure-function/simple)

## Non-Http Triggers and Bindings
You can also define functions that use non-HTTP triggers and input/output bindings. The table below shows the list of supported triggers and bindings:

| Type | Trigger | Input | Output |
| ---- | :------: | :---: | :----: |
| [Blob storage](../articles/azure-functions/functions-bindings-storage-blob.md)          |❌|❌|❌|
| [Cosmos DB](../articles/azure-functions/functions-bindings-documentdb.md)               |❌|❌|❌|
| [Event Grid](../articles/azure-functions/functions-bindings-event-grid.md)              |❌| | |
| [Event Hubs](../articles/azure-functions/functions-bindings-event-hubs.md)              |❌| |❌|
| [HTTP & webhooks](../articles/azure-functions/functions-bindings-http-webhook.md)             |✅| |✅|
| [IoT Hub](../articles/azure-functions/functions-bindings-event-iot.md)             |❌| |❌|
| [Microsoft Graph<br/>Excel tables](../articles/azure-functions/functions-bindings-microsoft-graph.md)   | |❌|❌|
| [Microsoft Graph<br/>OneDrive files](../articles/azure-functions/functions-bindings-microsoft-graph.md) | |❌|❌|
| [Microsoft Graph<br/>Outlook email](../articles/azure-functions/functions-bindings-microsoft-graph.md)  | | |❌|
| [Microsoft Graph<br/>events](../articles/azure-functions/functions-bindings-microsoft-graph.md)         |❌|❌|❌|
| [Microsoft Graph<br/>Auth tokens](../articles/azure-functions/functions-bindings-microsoft-graph.md)    | |❌| |
| [Mobile Apps](../articles/azure-functions/functions-bindings-mobile-apps.md)             | |❌|❌|
| [Notification Hubs](../articles/azure-functions/functions-bindings-notification-hubs.md) || |❌|
| [Queue storage](../articles/azure-functions/functions-bindings-storage-queue.md)         |❌| |❌|
| [SendGrid](../articles/azure-functions/functions-bindings-sendgrid.md)                   ||  |❌|
| [Service Bus](../articles/azure-functions/functions-bindings-service-bus.md)             |❌| |❌|
| [SignalR](../articles/azure-functions/functions-bindings-signalr-service.md)              ||❌|❌|
| [Table storage](../articles/azure-functions/functions-bindings-storage-table.md)         | |❌|❌|
| [Timer](./docs/bindings/timer.md)                         |✅| | |
| [Twilio](../articles/azure-functions/functions-bindings-twilio.md)                       | | |❌|


## Access Azure Context Functionality
You can access the Azure Context object using the `@AzureApiContextParam` decorator.
```typescript
import { Api, ApiGetMethod, AzureApiContextParam } from 'ts-api-decorators-azure-function';
import { Context } from "@azure/functions";

@Api
class MyApi {
	@ApiGetMethod('/hello')
	greet(
		@AzureApiContextParam() context: Context,
	) {
		// ...
	}
}
```