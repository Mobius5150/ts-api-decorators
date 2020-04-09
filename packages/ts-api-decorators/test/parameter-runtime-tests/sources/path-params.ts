import { Api, ApiGetMethod, ApiBodyParam, ApiPathParamNumber, ApiPathParamString, ApiPathParam, HttpBadRequestError } from "../../../src";
import { ApiInjectedDependencyParam, ApiInjectedDependency } from "../../../src/decorators/DependencyParams";
import { TestManagedApi } from "../../../src/Testing/TestTransport";

@Api
class MyApi {
	@ApiGetMethod('/numberMin/:num')
	numberMin(
		@ApiPathParamNumber(undefined, 0) num: number
	) {
		return num.toString()
	}

	@ApiGetMethod('/numberMax/:num')
	numberMax(
		@ApiPathParamNumber(undefined, undefined, 0) num: number
	) {
		return num.toString()
	}

	@ApiGetMethod('/numberMinMax/:num')
	numberMinMax(
		@ApiPathParamNumber(undefined, 5, 10) num: number
	) {
		return num.toString()
	}

	@ApiGetMethod('/stringRegex/:str')
	string(
		@ApiPathParamString(undefined, /^[a-z]+$/) str: string
	) {
		return str;
	}

	@ApiGetMethod('/validationFunc/:str')
	validationFunc(
		@ApiPathParam(undefined, (_, i) => {
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