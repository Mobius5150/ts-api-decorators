import { Api, ApiGetMethod, ApiHeaderParamNumber, ApiHeaderParamString, ApiHeaderParam, HttpBadRequestError } from "../../../src";
import { TestManagedApi } from "../../../src/Testing/TestTransport";

@Api
class MyApi {
	@ApiGetMethod('/numberMin')
	numberMin(
		@ApiHeaderParamNumber(undefined, 0) num: number
	) {
		return num.toString()
	}

	@ApiGetMethod('/numberMax')
	numberMax(
		@ApiHeaderParamNumber(undefined, undefined, 0) num: number
	) {
		return num.toString()
	}

	@ApiGetMethod('/numberMinMax')
	numberMinMax(
		@ApiHeaderParamNumber(undefined, 5, 10) num: number
	) {
		return num.toString()
	}

	@ApiGetMethod('/stringRegex')
	string(
		@ApiHeaderParamString(undefined, /^[a-z]+$/) str: string
	) {
		return str;
	}

	@ApiGetMethod('/validationFunc')
	validationFunc(
		@ApiHeaderParam(undefined, (_, i) => {
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