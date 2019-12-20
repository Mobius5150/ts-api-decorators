import { Api, ApiGetMethod } from "../../../src";
import { ApiQueryParam } from "../../../src/decorators/QueryParams";

const validator = (name: string, value: string) => {};

@Api
class MyApi {

	@ApiGetMethod<string>('/hello')
	greet(
		@ApiQueryParam(validator) name: string,
		@ApiQueryParam() times: number = 1,
		@ApiQueryParam() optional?: string,
	) {
		let result = optional ? optional : '';
		for (let i = 0; i < times; ++i) {
			result += `Hi ${name}! `;
		}

		return result;
	}

}