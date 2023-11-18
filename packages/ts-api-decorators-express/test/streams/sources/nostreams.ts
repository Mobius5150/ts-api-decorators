import { Api, ApiGetMethod, ManagedApi, ApiQueryParam, StreamCoercionMode } from "../../../src";
import { ITestServer } from '../../TestServer';
import * as express from 'express';
import * as http from 'http';

@Api
class MyApi {
	@ApiGetMethod('/helloNoStream')
	greatTimedRelease(
		@ApiQueryParam() name: string
	) {
		return this.getStreamChunks(name).join('');
	}

	private getStreamChunks(name: string): string[] {
		return [
			'Hello',
			' ',
			name,
			'!',
		];
	}
}

let app: express.Express;
let server: http.Server;
export default <ITestServer>{
	start: (port, started) => {
		const api = new ManagedApi();
		api.coerceStreamsMode(StreamCoercionMode.None);
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