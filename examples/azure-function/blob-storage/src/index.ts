import { Api, AzFuncBlob, AzFuncBlobParam, IAzureStorageBlobProperties, ApiPathParam, AzFuncBlobPropertiesParam, AzFuncBlobOutput } from 'ts-api-decorators-azure-function';

@Api
class MyApi {
	/**
	 * This method shows how to register for a blob creation/update event and get path parameters from the event.
	 */
	@AzFuncBlob('testblob/{blobName}.{blobExt}')
	blobChanged(
		// @AzFuncBlobParam() blob: IAzureStorageBlob
		@ApiPathParam() blobName: string,
		@ApiPathParam() blobExt: string,
	) {
		console.log(`Blob trigger executed for blob: ${blobName}.${blobExt}`);
	}

	/**
	 * This method shows how to use `AzFuncBlobParam` to get a buffer with the contents of the blob.
	 */
	@AzFuncBlob('testblob2/{blobName}.{blobExt}')
	blobChangedWithContents(
		@ApiPathParam() blobName: string,
		@ApiPathParam() blobExt: string,
		@AzFuncBlobParam() blob: Buffer
	) {
		console.log(`New blob ${blobName}.${blobExt} contents: `, blob.toString().substr(0, 300));
	}

	/**
	 * This method shows how to use `AzFuncBlobPropertiesParam` to get a buffer with the contents of the blob.
	 */
	@AzFuncBlob('testblob3/{blobName}.{blobExt}')
	@AzFuncBlobOutput('blobOut', 'testblob3/{blobName}.{blobExt}.copy')
	blobChangedWithProps(
		@ApiPathParam() blobName: string,
		@ApiPathParam() blobExt: string,
		@AzFuncBlobPropertiesParam() blob: IAzureStorageBlobProperties
	): { blobOut: object } {
		console.log(`Blob trigger executed for blob: ${blobName}.${blobExt} with properties: `, blob);
		return { blobOut: blob };
	}
}