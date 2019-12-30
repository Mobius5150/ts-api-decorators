import { Api, ApiGetMethod, ApiBodyParam, ApiPostMethod, ApiQueryParamString, ApiQueryParamNumber } from "../../../src";
import { ApiQueryParam } from "../../../src/decorators/QueryParams";

const validator = (name: string, value: string) => {};

interface IGreetArgs {
	name: string;
	times: number;

	/**
	 * @defaultValue 1
	 */
	optional?: string;
}

interface IGreetResponse {
	response: string;
}

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
		@ApiQueryParam('name', validator) name: string,
		@ApiQueryParam() times: number = 1,
		@ApiQueryParam() optional?: string,
	): string {
		let result = optional ? optional : '';
		for (let i = 0; i < times; ++i) {
			result += `Hi ${name}! `;
		}

		return result;
	}

	/**
	 * Greets the caller
	 * @param name The name of the caller
	 * @param times The number of times to repeat the greeting
	 * @param optional An optional preamble
	 * @tags greeters A group of methods for greeting
	 * @returns The greeting
	 */
	@ApiGetMethod<string>('/helloTypedQueryParam')
	greetWithParamValidation(
		@ApiQueryParamString('name', /^[a-zA-Z]{2,100}$/) name: string,
		@ApiQueryParamNumber('times', undefined, 100) times: number = 1,
		@ApiQueryParam() optional?: string,
	): string {
		let result = optional ? optional : '';
		for (let i = 0; i < times; ++i) {
			result += `Hi ${name}! `;
		}

		return result;
	}

	/**
	 * Greets the caller
	 * @param name The name of the caller
	 * @param times The number of times to repeat the greeting
	 * @param optional An optional preamble
	 * @tags greeters A group of methods for greeting
	 * @returns The greeting
	 */
	@ApiGetMethod<string>('/helloTypedNumberQueryParam')
	greetWithNumberParamValidation(
		@ApiQueryParamNumber('times0') times0: number = 1,
		@ApiQueryParamNumber('times1', 0) times1: number = 1,
		@ApiQueryParamNumber('times2', 0, null) times2: number = 1,
		@ApiQueryParamNumber('times3', 0, undefined) times3: number = 1,
		@ApiQueryParamNumber('times4', 0, 100) times4: number = 1,
		@ApiQueryParamNumber('times5', null, 100) times5: number = 1,
		@ApiQueryParamNumber('times6', undefined, 100) times6: number = 1,
		@ApiQueryParamNumber('times7', undefined, undefined) times7: number = 1,
		@ApiQueryParamNumber('times8', null, null) times8: number = 1,
		@ApiQueryParam() optional?: string,
	): string {
		return JSON.stringify({
			times0,
			times1,
			times2,
			times3,
			times4,
			times5,
			times6,
			times7,
			times8,
		});
	}

	/**
	 * Greets the caller
	 * @param name The name of the caller
	 * @param times The number of times to repeat the greeting
	 * @param optional An optional preamble
	 * @tags greeters A group of methods for greeting
	 * @returns The greeting
	 */
	@ApiGetMethod<string>('/helloTypedStringQueryParam')
	greetWithStringParamValidation(
		@ApiQueryParamString(undefined, null) name0: string,
		@ApiQueryParamString(undefined, undefined) name1: string,
		@ApiQueryParamString(undefined, /^[a-zA-Z]{2,100}$/) name2: string,
		@ApiQueryParamString(undefined, (null)) name3: string,
		@ApiQueryParamString(undefined, ((null))) name4: string,
		@ApiQueryParamString(undefined, (undefined)) name5: string,
		@ApiQueryParamString(undefined, ((undefined))) name6: string,
	): string {
		return JSON.stringify({
			name0,
			name1,
			name2,
			name3,
			name4,
			name5,
			name6,
		});
	}

	/**
	 * Greets the caller using body parameters
	 * @param body The greeting options
	 * @tags greeters A group of methods for greeting
	 * @returns The greeting as an object
	 */
	@ApiPostMethod<IGreetResponse>('/hello')
	greetObject(
		@ApiBodyParam() body: IGreetArgs
	): IGreetResponse {
		return {
			response: this.greet(body.name, body.times, body.optional),
		};
	}

}