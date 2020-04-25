import { Api, ApiPostMethod, ApiBodyParam, HttpBadRequestError, ApiBodyParamNumber, ApiBodyParamString } from "../../../src";
import { TestManagedApi } from "../../../src/Testing/TestTransport";

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

}

const testApi = new TestManagedApi();
testApi.addHandlerClass(MyApi);
export default testApi;