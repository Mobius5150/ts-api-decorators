import { Api, ApiGetMethod, ApiBodyParam, ApiQueryParamNumber, ApiQueryParamString } from "../../../src";
import { ApiInjectedDependencyParam, ApiInjectedDependency } from "../../../src/decorators/DependencyParams";
import { TestManagedApi } from "../../TestTransport";

@Api
class MyApi {
	@ApiGetMethod('/numberMin')
	numberMin(
		@ApiQueryParamNumber(undefined, 0) num: number
	) {
		return num.toString()
	}

	@ApiGetMethod('/numberMax')
	numberMax(
		@ApiQueryParamNumber(undefined, undefined, 0) num: number
	) {
		return num.toString()
	}

	@ApiGetMethod('/numberMinMax')
	numberMinMax(
		@ApiQueryParamNumber(undefined, 5, 10) num: number
	) {
		return num.toString()
	}

	@ApiGetMethod('/stringRegex')
	string(
		@ApiQueryParamString(undefined, /^[a-z]+$/) str: string
	) {
		return str;
	}

}

const testApi = new TestManagedApi();
testApi.addHandlerClass(MyApi);
export default testApi;