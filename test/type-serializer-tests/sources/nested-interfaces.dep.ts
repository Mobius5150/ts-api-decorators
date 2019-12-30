import { Api, ApiGetMethod, ApiBodyParam } from "../../../src";
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

interface IResponseBody {
	message: string;
}

@Api
export default class MyApi {

	/**
	 * Tests a request body with an interface
	 * @param body The request body
	 * @returns The string 'response'
	 */
	@ApiGetMethod<IResponseBody>('/helloDep')
	greet(
		@ApiBodyParam() body: IRequestBody,
	): IResponseBody {
		return {
			message: 'response',
		};
	}

}