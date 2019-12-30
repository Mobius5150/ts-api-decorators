import { Api, ApiGetMethod } from "../../../src";
import { ApiQueryParam } from "../../../src/decorators/QueryParams";

@Api
class MyApi {

	@ApiGetMethod<string>('/hello')
	greet(
		@ApiQueryParam() name: () => void,
	) {
		return '';
	}

}