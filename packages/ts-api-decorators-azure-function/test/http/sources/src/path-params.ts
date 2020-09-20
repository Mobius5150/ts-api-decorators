import { Api, ApiGetMethod, ApiPathParam, ManagedApi, ApiPostMethod, ApiPutMethod, ApiDeleteMethod } from "../../../../dist";

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

	@ApiGetMethod('/hello/:name/:times?/:optional?')
	greet(
		@ApiPathParam() name: string,
		@ApiPathParam() times: number = 1,
		@ApiPathParam() optional?: string,
	) {
		return this.getResult({name, times, optional});
	}

	@ApiPostMethod('/hello/:name/:times?/:optional?')
	greetPost(
		@ApiPathParam() name: string,
		@ApiPathParam() times: number = 1,
		@ApiPathParam() optional?: string,
	) {
		return this.getResult({name, times, optional});
	}

	@ApiPutMethod('/hello/:name/:times?/:optional?')
	greetPut(
		@ApiPathParam() name: string,
		@ApiPathParam() times: number = 1,
		@ApiPathParam() optional?: string,
	) {
		return this.getResult({name, times, optional});
	}

	@ApiDeleteMethod('/hello/:name/:times?/:optional?')
	greetDelete(
		@ApiPathParam() name: string,
		@ApiPathParam() times: number = 1,
		@ApiPathParam() optional?: string,
	) {
		return this.getResult({name, times, optional});
	}
	
}