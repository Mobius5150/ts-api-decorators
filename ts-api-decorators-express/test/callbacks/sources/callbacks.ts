import { Api, ApiGetMethod, ApiQueryParam, ManagedApi, ApiPostMethod, ApiPutMethod, ApiDeleteMethod, ApiBodyParam, ApiCallbackParam } from "../../../src";
import { ITestServer } from '../../TestServer';
import * as express from 'express';
import * as http from 'http';
import { ApiMethodCallbackFunction } from "ts-api-decorators/src/apiManagement/ApiDefinition";
import { HttpError, HttpTeapotError } from "ts-api-decorators/src";

interface IGreetArgs {
	name: string;
	times: number;

	/**
	 * @defaultValue 1
	 */
	optional?: string;
}

interface IEchoResponse {
	str: string;
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

	@ApiGetMethod<void, string>('/hello')
	greet(
		@ApiCallbackParam() callback: ApiMethodCallbackFunction<string>,
		@ApiQueryParam() name: string,
		@ApiQueryParam() times: number = 1,
		@ApiQueryParam() optional?: string,
		@ApiQueryParam() throwError?: boolean,
	) {
		setTimeout(() => {
			if (throwError) {
				callback(new HttpTeapotError());
			} else {
				callback(null, this.getResult({name, times, optional}));
			}
		}, 0);
	}

	@ApiPostMethod<void, string>('/hello')
	greetPost(
		@ApiCallbackParam() callback: ApiMethodCallbackFunction<string>,
		@ApiQueryParam() name: string,
		@ApiQueryParam() times: number = 1,
		@ApiQueryParam() optional?: string,
		@ApiQueryParam() throwError?: boolean,
	) {
		setTimeout(() => {
			if (throwError) {
				callback(new HttpTeapotError());
			} else {
				callback(null, this.getResult({name, times, optional}));
			}
		}, 0);
	}

	@ApiPutMethod<void, string>('/hello')
	greetPut(
		@ApiCallbackParam() callback: ApiMethodCallbackFunction<string>,
		@ApiQueryParam() name: string,
		@ApiQueryParam() times: number = 1,
		@ApiQueryParam() optional?: string,
		@ApiQueryParam() throwError?: boolean,
	) {
		setTimeout(() => {
			if (throwError) {
				callback(new HttpTeapotError());
			} else {
				callback(null, this.getResult({name, times, optional}));
			}
		}, 0);
	}

	@ApiDeleteMethod<void, string>('/hello')
	greetDelete(
		@ApiCallbackParam() callback: ApiMethodCallbackFunction<string>,
		@ApiQueryParam() name: string,
		@ApiQueryParam() times: number = 1,
		@ApiQueryParam() optional?: string,
		@ApiQueryParam() throwError?: boolean,
	) {
		setTimeout(() => {
			if (throwError) {
				callback(new HttpTeapotError());
			} else {
				callback(null, this.getResult({name, times, optional}));
			}
		}, 0);
	}

	@ApiGetMethod<void, string>('/unexpectedError')
	unexpectedError(
		@ApiCallbackParam() callback: ApiMethodCallbackFunction<string>,
	) {
		throw new HttpTeapotError();
	}

	@ApiPutMethod<void, string>('/unexpectedError')
	unexpectedErrorPut(
		@ApiCallbackParam() callback: ApiMethodCallbackFunction<string>,
	) {
		throw new HttpTeapotError();
	}

	@ApiPostMethod<void, string>('/unexpectedError')
	unexpectedErrorPost(
		@ApiCallbackParam() callback: ApiMethodCallbackFunction<string>,
	) {
		throw new HttpTeapotError();
	}

	@ApiDeleteMethod<void, string>('/unexpectedError')
	unexpectedErrorDelete(
		@ApiCallbackParam() callback: ApiMethodCallbackFunction<string>,
	) {
		throw new HttpTeapotError();
	}

	@ApiGetMethod<void, IEchoResponse>('/echo')
	echo(
		@ApiCallbackParam() callback: ApiMethodCallbackFunction<IEchoResponse>,
		@ApiQueryParam('echo') str: string,
	) {
		callback(null, {str});
	}

	@ApiPostMethod<void, IEchoResponse>('/echo')
	echoPost(
		@ApiCallbackParam() callback: ApiMethodCallbackFunction<IEchoResponse>,
		@ApiQueryParam('echo') str: string,
	) {
		callback(null, {str});
	}

	@ApiPutMethod<void, IEchoResponse>('/echo')
	echoPut(
		@ApiCallbackParam() callback: ApiMethodCallbackFunction<IEchoResponse>,
		@ApiQueryParam('echo') str: string,
	) {
		callback(null, {str});
	}

	@ApiDeleteMethod<void, IEchoResponse>('/echo')
	echoDelete(
		@ApiCallbackParam() callback: ApiMethodCallbackFunction<IEchoResponse>,
		@ApiQueryParam('echo') str: string,
	) {
		callback(null, {str});
	}
}

let app: express.Express;
let server: http.Server;
export default <ITestServer>{
	start: (port, started) => {
		const api = new ManagedApi(false);
        api.addHandlerClass(MyApi);
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