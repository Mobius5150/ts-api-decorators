import { Api, ApiPathParam, AzFuncBlob, AzFuncBlobOutput } from "../../../src";

@Api
class MyBlobApi {
	@AzFuncBlob('inPath', 'inConnectionStr')
	@AzFuncBlobOutput('blobContents', 'outPath', 'outConnectionStr')
	blobChanged(
		@ApiPathParam() blobName: string,
		@ApiPathParam() blobExt: string,
	) : { blobContents: object } {
		return {
			blobContents: { blobName, blobExt }
		}
	}
}