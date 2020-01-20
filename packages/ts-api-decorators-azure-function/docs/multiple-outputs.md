# Multiple Outputs from a Single Handler
In some cases, you want to return multiple outputs from the same handler. The goal of the pattern shown below is to always be strongly typed.

The below example is triggered by a queue message, which contains the path to a blob in storage. When invoked it:
- Creates a copy of the blob from the queue message with "-Copy" appended to the name
- Sends a queue message with the name of the new blob
- Sends an event grid event with the name of the old and new blobs

```typescript
import { Api, ApiGetMethod } from 'ts-api-decorators-azure-function';

interface MyComplexReturnType {
	blobCopy: TbdAzureBlobType;
	queueMessage: TbdAzureQueueType;
	event: TbdEventGridEventType;
}

@Api
class MyApi {
	@AzureApiQueue('myqueue-items')
	@AzureApiBlobOutput('samples-workitems/{queueTrigger}-Copy', undefined, 'blobCopy')
	@AzureApiQueueOutput('myqueue-modifieditems', undefined, 'queueMessage')
	@AzureApiEventGridEventOutput('myEventGrid', undefined, 'event')
	copyBlob(
		@AzureApiQueueInput() inputBlobName: string,
		@AzureApiBlobInput('samples-workitems/{queueTrigger}') inputBlob: TbdAzureBlobType,
	): MyComplexReturnType {
		const newName = `${inputBlobName}-Copy`;
		return {
			blobCopy: inputBlob,
			queueMessage: newName,
			event: {
				new: newName,
				old: inputBlobName
			}
		};
	}
}
```

Note that for each of the `@AzureApi...Output()` decorators, the final argument corresponds to the name of that object in the output data type. At compilation time the library will verify that the name of this argument corresponds to the name of a field on `MyComplexReturnType` and that the types match what is expected for that type.