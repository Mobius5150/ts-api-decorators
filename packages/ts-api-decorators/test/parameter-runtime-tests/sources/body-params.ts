import { Api, ApiPostMethod, ApiBodyParam, HttpBadRequestError, ApiBodyParamNumber, ApiBodyParamString, readStreamToStringUtil } from "../../../src";
import { TestManagedApi } from "../../../src/Testing/TestTransport";
import { ApiBodyParamStream } from "../../../src/decorators/BodyParams";
import { Readable } from "stream";

interface MyBodyData {
	data: string;
}

@Api
class MyApi {
	@ApiPostMethod('/jsonData')
	jsonData(
		@ApiBodyParam() body: MyBodyData,
	) {
		return body.data.toString()
	}

	@ApiPostMethod('/number')
	number(
		@ApiBodyParam() body: number,
	) {
		return body.toString()
	}

	@ApiPostMethod('/numberMin')
	numberMin(
		@ApiBodyParamNumber(0) body: number,
	) {
		return body.toString()
	}

	@ApiPostMethod('/numberMax')
	numberMax(
		@ApiBodyParamNumber(undefined, 0) num: number
	) {
		return num.toString()
	}

	@ApiPostMethod('/numberMinMax')
	numberMinMax(
		@ApiBodyParamNumber(5, 10) num: number
	) {
		return num.toString()
	}

	@ApiPostMethod('/stringRegex')
	string(
		@ApiBodyParamString(/^[a-z]+$/) str: string
	) {
		return str;
	}

	@ApiPostMethod('/validationFunc')
	validationFunc(
		@ApiBodyParam((_, i) => {
			if (i !== 'valid') {
				throw new HttpBadRequestError('Expected str to be valid');
			}
		}) str: string
	) {
		return str;
	}

	@ApiPostMethod('/bodyStream')
	bodyStream(
		@ApiBodyParamStream() body: Readable,
	): Promise<string> {
		return readStreamToStringUtil(body)();
	}

	@ApiPostMethod('/objectStreamWithMimeType')
	async objectStreamWithMimeType(
		@ApiBodyParamStream('application/json') body: Readable,
	): Promise<string> {
		const contents = await readStreamToStringUtil(body)();
		const json = JSON.parse(contents);
		return json.data.toString();
	}
}

const testApi = new TestManagedApi();
testApi.addHandlerClass(MyApi);
export default testApi;