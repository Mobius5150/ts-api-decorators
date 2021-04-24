import { Api, AzFuncBlob, ApiPathParam, AzFuncBlobOutput, AzFuncBlobPropertiesParam, AzFuncBlobParam, IAzureStorageBlobProperties } from "ts-api-decorators-azure-function";

interface BlobReturn {
	blobContents: object;
}

@Api
class MyBlobStorageApi {
	private static readonly outputBlobName: string = 'testoutput/{func}/{blobName}/{blobExt}'

	private getBlobOutputName(func: string, blobName: string, blobExt: string) {
		return (MyBlobStorageApi.outputBlobName
			.replace('{func}', func)
			.replace('{blobName}', blobName)
			.replace('{blobExt}', blobExt))
	}

	/**
	 * This method shows how to register for a blob creation/update event and get path parameters from the event.
	 */
	@AzFuncBlob('testblobchanged/{blobName}.in')
	@AzFuncBlobOutput('blobContents', 'testblobchanged/{blobName}.out')
	blobChanged(
		@ApiPathParam() blobName: string,
		@ApiPathParam() blobExt: string = 'in',
	) : BlobReturn {
		return {
			blobContents: { blobName, blobExt }
		}
	}

	/**
	 * This method shows how to use `AzFuncBlobParam` to get a buffer with the contents of the blob.
	 */
	@AzFuncBlob('testblobchangedwithcontents/{blobName}.in')
	@AzFuncBlobOutput('blobContents', 'testblobchangedwithcontents/{blobName}.out')
	blobChangedWithContents(
		@ApiPathParam() blobName: string,
		@AzFuncBlobParam() blob: Buffer,
		@ApiPathParam() blobExt: string = 'in',
	) {
		return {
			blobContents: { blobName, blobExt, contents: blob.toString() }
		}
	}

	/**
	 * This method shows how to use `AzFuncBlobPropertiesParam` to get a buffer with the contents of the blob.
	 */
	@AzFuncBlob('testblobchangedwithprops/{blobName}.in')
	@AzFuncBlobOutput('blobContents', 'testblobchangedwithprops/{blobName}.out')
	blobChangedWithProps(
		@ApiPathParam() blobName: string,
		@ApiPathParam() blobExt: string = 'in',
		@AzFuncBlobPropertiesParam() props: IAzureStorageBlobProperties
	) {
		return {
			blobContents: { blobName, blobExt, props }
		}
	}
}