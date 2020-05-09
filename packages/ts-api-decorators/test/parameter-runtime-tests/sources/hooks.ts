import { Api, ApiGetMethod, ApiQueryParam } from "../../../src";
import { TestManagedApi } from "../../../src/Testing/TestTransport";

@Api
class MyApi {

	/**
	 * Greets the caller
	 * @param name The name of the caller
	 * @param times The number of times to repeat the greeting
	 * @param optional An optional preamble
	 * @tags greeters A group of methods for greeting
	 * @returns The greeting
	 */
	@ApiGetMethod<string>('/hello')
	greet(
		@ApiQueryParam() name: string,
	): string {
		return `Hi ${name}`;
	}

}

const testApi = new TestManagedApi();
testApi.addHandlerClass(MyApi);
export default testApi;