import { Api, ApiGetMethod, ApiBodyParam } from "../../../src";

interface IRequestBody {
	prompt: string;
}

interface IResponseBody {
	response: string;
}

@Api
export default class MyApi {

	/**
	 * Tests a request and response body that is an array
	 * @param body The request body
	 * @returns An array with a response for each request
	 */
	@ApiGetMethod<IResponseBody[]>('/hello')
	greet(
		@ApiBodyParam() body: IRequestBody[],
	): IResponseBody[] {
		return body.map(req => ({ response: req.prompt + '!' }));
	}

	/**
	 * Tests a request and response body that is an array
	 * @param body The request body
	 * @returns An array with a response for each request
	 */
	 @ApiGetMethod<IResponseBody[]>('/helloPromise')
	 async greetPromise(
		 @ApiBodyParam() body: IRequestBody[],
	 ): Promise<IResponseBody[]> {
		 return body.map(req => ({ response: req.prompt + '!' }));
	 }
}