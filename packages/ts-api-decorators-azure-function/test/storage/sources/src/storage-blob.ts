import { Api, AzFuncBlob, ApiPathParam, AzFuncBlobOutput, AzFuncBlobPropertiesParam, AzFuncBlobParam, IAzureStorageBlobProperties } from "../../../../dist";

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
	@AzFuncBlob('testBlobChanged/{blobName}.{blobExt}')
	@AzFuncBlobOutput('blobContents', 'testoutput/blobChanged/{blobName}/{blobExt}')
	blobChanged(
		@ApiPathParam() blobName: string,
		@ApiPathParam() blobExt: string,
	) : BlobReturn {
		console.log(`Blob trigger executed for blob: ${blobName}.${blobExt}`);
		return {
			blobContents: { blobName, blobExt }
		}
	}

	// /**
	//  * This method shows how to use `AzFuncBlobParam` to get a buffer with the contents of the blob.
	//  */
	// @AzFuncBlob('testBlobChangedWithContents/{blobName}.{blobExt}')
	// blobChangedWithContents(
	// 	@ApiPathParam() blobName: string,
	// 	@ApiPathParam() blobExt: string,
	// 	@AzFuncBlobParam() blob: Buffer
	// ) {
	// 	console.log(`New blob ${blobName}.${blobExt} contents: `, blob.toString().substr(0, 300));
	// }

	// /**
	//  * This method shows how to use `AzFuncBlobPropertiesParam` to get a buffer with the contents of the blob.
	//  */
	// @AzFuncBlob('testBlobChangedWithProps/{blobName}.{blobExt}')
	// blobChangedWithProps(
	// 	@ApiPathParam() blobName: string,
	// 	@ApiPathParam() blobExt: string,
	// 	@AzFuncBlobPropertiesParam() blob: IAzureStorageBlobProperties
	// ) {
	// 	console.log(`Blob trigger executed for blob: ${blobName}.${blobExt} with properties: `, blob);
	// }
	
}