import { Api, ApiGetMethod, ApiPathParam, ManagedApi, ApiPostMethod, ApiPutMethod, ApiDeleteMethod, ApiBodyParam } from "../../../src";
import { ITestServer } from '../../TestServer';
import * as express from 'express';
import * as http from 'http';

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

let app: express.Express;
let server: http.Server;
export default <ITestServer>{
	start: (port, started) => {
		const api = new ManagedApi();
        api.addHandlerClass(MyApi);
		app = express();
		app.use(api.init());
		server = app.listen(port, () => {
			started(null, server);
		});
	},
	stop: () => {
		return new Promise((resolve, reject) => {
			server.once('close', (e?: any) => {
				if (e) {
					reject(e);
				} else {
					setTimeout(resolve, 1);
				}
			});

			server.close();
		});
	},
};