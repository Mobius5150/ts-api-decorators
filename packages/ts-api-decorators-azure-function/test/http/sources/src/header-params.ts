import { Api, ApiGetMethod, ApiHeaderParam, ManagedApi, ApiPostMethod, ApiPutMethod, ApiDeleteMethod } from "../../../../dist";

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
		@ApiHeaderParam() name: string,
		@ApiHeaderParam() times: number = 1,
		@ApiHeaderParam() optional?: string,
	) {
		return this.getResult({name, times, optional});
	}

	@ApiPostMethod('/hello')
	greetPost(
		@ApiHeaderParam() name: string,
		@ApiHeaderParam() times: number = 1,
		@ApiHeaderParam() optional?: string,
	) {
		return this.getResult({name, times, optional});
	}

	@ApiPutMethod('/hello')
	greetPut(
		@ApiHeaderParam() name: string,
		@ApiHeaderParam() times: number = 1,
		@ApiHeaderParam() optional?: string,
	) {
		return this.getResult({name, times, optional});
	}

	@ApiDeleteMethod('/hello')
	greetDelete(
		@ApiHeaderParam() name: string,
		@ApiHeaderParam() times: number = 1,
		@ApiHeaderParam() optional?: string,
	) {
		return this.getResult({name, times, optional});
	}

	@ApiGetMethod('/echo')
	echo(
		@ApiHeaderParam('x-echo') str: string,
	) {
		return str;
	}

	@ApiPostMethod('/echo')
	echoPost(
		@ApiHeaderParam('x-echo') str: string,
	) {
		return str;
	}

	@ApiPutMethod('/echo')
	echoPut(
		@ApiHeaderParam('x-echo') str: string,
	) {
		return str;
	}

	@ApiDeleteMethod('/echo')
	echoDelete(
		@ApiHeaderParam('x-echo') str: string,
	) {
		return str;
	}

	@ApiGetMethod('/echoCase')
	echoCase(
		@ApiHeaderParam('X-Echo') str: string,
	) {
		return str;
	}

	@ApiPostMethod('/echoCase')
	echoCasePost(
		@ApiHeaderParam('X-Echo') str: string,
	) {
		return str;
	}

	@ApiPutMethod('/echoCase')
	echoCasePut(
		@ApiHeaderParam('X-Echo') str: string,
	) {
		return str;
	}

	@ApiDeleteMethod('/echoCase')
	echoCaseDelete(
		@ApiHeaderParam('X-Echo') str: string,
	) {
		return str;
	}
}