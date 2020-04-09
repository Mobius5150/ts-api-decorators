import { Api, ApiGetMethod, ApiQueryParam } from "../../../src";

/**
 * @tags apis All apis
 */
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
		@ApiQueryParam() times: number = 1,
		@ApiQueryParam() optional?: string,
	): string {
		let result = optional ? optional : '';
		for (let i = 0; i < times; ++i) {
			result += `Hi ${name}! `;
		}

		return result;
	}
}