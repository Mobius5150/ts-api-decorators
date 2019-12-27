import { Api, ApiGetMethod, ApiBodyParam } from "../../../src";
import { ApiQueryParam } from "../../../src/decorators/QueryParams";
import { IBodyParams as IBodyParams2 } from './nested-interfaces';

interface IRequestBody {
	version: string;
	params: IBodyParams;
	params2: IBodyParams2;
}

interface IBodyParams {
	params: string[];
	source: 'b';
}

@Api
export default class MyApi {

	/**
	 * Tests a request body with an interface
	 * @param body The request body
	 * @returns The string 'response'
	 */
	@ApiGetMethod('/helloDep')
	greet(
		@ApiBodyParam() body: IRequestBody,
	) {
		return 'reponse';
	}

}