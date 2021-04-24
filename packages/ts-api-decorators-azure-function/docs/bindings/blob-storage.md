# Blob Storage


## Trigger
The code below is invoked when a blob is added or updated to the `samples-workitems` container. 
```typescript
import { Api, ApiGetMethod } from 'ts-api-decorators-azure-function';

@Api
class MyApi {
	@AzFuncBlob('samples-workitems/{name}')
	greet(
		@ApiPathParam() name: string,
	) {
		return `Blob was added or updated in container: ${name}`;
	}
}
```

By default, the storage account is specified by the `AzureWebJobsStorage` environment variable. You can specify a storage connection name by using an optional second parameter to `@AzureApiBlob()`.

This sample correlates to the official [Azure Functions Blob Trigger Docs](https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-storage-blob?tabs=javascript#trigger)

## Input and Output
The sample below shows how to use a blob as an input or output parameter. The function is triggered by an Azure Queue message which contains the name of a blob. The blob is then copied to a new blob with the same name, but "-Copy" appended to the name.

[This corresponds to this sample in the official documentation.](https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-storage-blob?tabs=javascript#input)

```typescript
import { Api, ApiGetMethod } from 'ts-api-decorators-azure-function';

@Api
class MyApi {
	@AzFuncBlob('myqueue-items')
	@AzFuncBlobOutput('samples-workitems/{queueTrigger}-Copy')
	greet(
		@AzFuncBlobParam() inputBlob: TbdAzureBlobType,
	): TbdAzureBlobType {
		return inputBlob;
	}
}
```

# Multiple Outputs
You can configure multiple outputs for a function using the [Multiple Output](./multiple-outputs) guide.