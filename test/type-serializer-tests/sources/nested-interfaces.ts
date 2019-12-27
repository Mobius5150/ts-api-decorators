import { Api, ApiGetMethod, ApiBodyParam } from "../../../src";

interface IRequestBody {
	version: string;
	params: IBodyParams;
}

export interface IBodyParams {
	params: string[];
	source: 'a';
}

@Api
export default class MyApi {

	/**
	 * Tests a request body with an interface
	 * @param body The request body
	 * @returns The string 'response'
	 */
	@ApiGetMethod('/hello')
	greet(
		@ApiBodyParam() body: IRequestBody,
	) {
		return 'reponse';
	}

}