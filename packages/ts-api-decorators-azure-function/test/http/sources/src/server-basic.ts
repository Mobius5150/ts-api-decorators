import { Api, ApiGetMethod, ApiPostMethod, ApiPutMethod, ApiDeleteMethod, ApiQueryParam, ApiBodyParam } from "../../../../dist";

interface IGreetArgs {
	name: string;
	times: number;

	/**
	 * @defaultValue 1
	 */
	optional?: string;
}

@Api
class MyApi {

	private getResult(args: IGreetArgs) {
		let result = args.optional ? args.optional : '';
		for (let i = 0; i < args.times; ++i) {
			result += `Hi ${args.name}! `;
		}

		return result;
	}

	@ApiGetMethod('/hello')
	greet(
		@ApiQueryParam() name: string,
		@ApiQueryParam() times: number = 1,
		@ApiQueryParam() optional?: string,
	) {
		return this.getResult({name, times, optional});
	}

	@ApiPostMethod('/hello')
	greetPost(
		@ApiQueryParam() name: string,
		@ApiQueryParam() times: number = 1,
		@ApiQueryParam() optional?: string,
	) {
		return this.getResult({name, times, optional});
	}

	@ApiPostMethod('/helloBody')
	greetPostBody(
		@ApiBodyParam() body: IGreetArgs,
	) {
		return this.getResult({ times: 1, ...body });
	}

	@ApiPutMethod('/hello')
	greetPut(
		@ApiQueryParam() name: string,
		@ApiQueryParam() times: number = 1,
		@ApiQueryParam() optional?: string,
	) {
		return this.getResult({name, times, optional});
	}

	@ApiPutMethod('/helloBody')
	greetPutBody(
		@ApiBodyParam() body: IGreetArgs,
	) {
		return this.getResult({ times: 1, ...body });
	}

	@ApiDeleteMethod('/hello')
	greetDelete(
		@ApiQueryParam() name: string,
		@ApiQueryParam() times: number = 1,
		@ApiQueryParam() optional?: string,
	) {
		return this.getResult({name, times, optional});
	}

	@ApiGetMethod('/echo')
	echo(
		@ApiQueryParam('echo') str: string,
	) {
		return str;
	}

	@ApiPostMethod('/echo')
	echoPost(
		@ApiQueryParam('echo') str: string,
	) {
		return str;
	}

	@ApiPutMethod('/echo')
	echoPut(
		@ApiQueryParam('echo') str: string,
	) {
		return str;
	}

	@ApiDeleteMethod('/echo')
	echoDelete(
		@ApiQueryParam('echo') str: string,
	) {
		return str;
	}
}