import { Api, ApiGetMethod, ApiQueryParam, ManagedApi, ApiPostMethod, ApiPutMethod, ApiDeleteMethod } from "../../../src";
import { ITestServer } from '../../TestServer';
import * as express from 'express';
import * as http from 'http';

@Api
class MyApi {
	@ApiGetMethod('/hello')
	greet(
		@ApiQueryParam() name: string,
		@ApiQueryParam() times: number = 1,
		@ApiQueryParam() optional?: string,
	) {
		let result = optional ? optional : '';
		for (let i = 0; i < times; ++i) {
			result += `Hi ${name}! `;
		}

		return result;
	}

	@ApiPostMethod('/hello')
	greetPost(
		@ApiQueryParam() name: string,
		@ApiQueryParam() times: number = 1,
		@ApiQueryParam() optional?: string,
	) {
		let result = optional ? optional : '';
		for (let i = 0; i < times; ++i) {
			result += `Hi ${name}! `;
		}

		return result;
	}

	@ApiPutMethod('/hello')
	greetPut(
		@ApiQueryParam() name: string,
		@ApiQueryParam() times: number = 1,
		@ApiQueryParam() optional?: string,
	) {
		let result = optional ? optional : '';
		for (let i = 0; i < times; ++i) {
			result += `Hi ${name}! `;
		}

		return result;
	}

	@ApiDeleteMethod('/hello')
	greetDelete(
		@ApiQueryParam() name: string,
		@ApiQueryParam() times: number = 1,
		@ApiQueryParam() optional?: string,
	) {
		let result = optional ? optional : '';
		for (let i = 0; i < times; ++i) {
			result += `Hi ${name}! `;
		}

		return result;
	}
}

let app: express.Express;
let server: http.Server;
export default <ITestServer>{
	start: (port, started) => {
		const api = new ManagedApi();
		app = express();
		app.use(api.init());
		server = app.listen(port, () => {
			started(null, server);
		});
	},
	stop: () => {
		server.close();
	},
};