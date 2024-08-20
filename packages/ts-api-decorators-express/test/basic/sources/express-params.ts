import {
	Api,
	ApiGetMethod,
	ApiQueryParam,
	ManagedApi,
	ApiPostMethod,
	ApiPutMethod,
	ApiDeleteMethod,
	ExpressApiRequestParam,
	ExpressApiResponseParam,
	ExpressApiMiddleware,
	ExpressApiRequestUserParam,
	ApiAbortSignalParam,
} from '../../../src';
import { ITestServer } from '../../TestServer';
import * as express from 'express';
import * as http from 'http';

@Api
class MyApi {
	@ApiGetMethod('/hello')
	greet(@ExpressApiRequestParam() req: Express.Request, @ExpressApiResponseParam() resp: Express.Response) {
		if (!req) {
			throw new Error('No request param');
		}

		if (!resp) {
			throw new Error('No response param');
		}

		return 'response';
	}

	@ApiPutMethod('/hello')
	greetPut(@ExpressApiRequestParam() req: Express.Request, @ExpressApiResponseParam() resp: Express.Response) {
		if (!req) {
			throw new Error('No request param');
		}

		if (!resp) {
			throw new Error('No response param');
		}

		return 'response';
	}

	@ApiPostMethod('/hello')
	greetPost(@ExpressApiRequestParam() req: Express.Request, @ExpressApiResponseParam() resp: Express.Response) {
		if (!req) {
			throw new Error('No request param');
		}

		if (!resp) {
			throw new Error('No response param');
		}

		return 'response';
	}

	@ApiDeleteMethod('/hello')
	greetDelete(@ExpressApiRequestParam() req: Express.Request, @ExpressApiResponseParam() resp: Express.Response) {
		if (!req) {
			throw new Error('No request param');
		}

		if (!resp) {
			throw new Error('No response param');
		}

		return 'response';
	}

	@ApiGetMethod('/helloUser')
	@ExpressApiMiddleware((req, res, next) => {
		(<any>req).user = { name: 'Developer' };
		next();
	})
	greetUser(@ExpressApiRequestUserParam() user: { name: string }) {
		return `Hello ${user.name}!`;
	}

	private aborted = false;
	@ApiGetMethod<string>('/helloAbort')
	greetAbort(@ApiAbortSignalParam() signal: AbortSignal) {
		// Return a promise that never resolves
		return new Promise<string>((resolve, reject) => {
			signal.onabort = () => {
				this.aborted = true;
			};
		});
	}

	@ApiGetMethod<string>('/checkWasAborted')
	checkWasAborted() {
		return this.aborted.toString();
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
