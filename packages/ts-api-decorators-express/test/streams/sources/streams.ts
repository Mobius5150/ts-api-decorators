import { Api, ApiGetMethod, ManagedApi, ApiQueryParam } from "../../../src";
import { ITestServer } from '../../TestServer';
import * as express from 'express';
import * as http from 'http';
import * as stream from 'stream';
import * as streamBuffer from 'stream-buffers';

@Api
class MyApi {
	@ApiGetMethod<stream.Readable>('/hello')
	greet(
		@ApiQueryParam() name: string,
	): stream.Readable {
		return stream.Readable.from(this.getStreamChunks(name));
	}

	@ApiGetMethod<stream.Readable>('/helloTimedRelease')
	greatTimedRelease(
		@ApiQueryParam() name: string
	): stream.Readable {
		const sb = new streamBuffer.ReadableStreamBuffer();
		const chunks = this.getStreamChunks(name);
		for (let i = 0; i < chunks.length; ++i) {
			setTimeout(() => {
				sb.put(chunks[i], 'utf8');
				if (i === chunks.length - 1) {
					sb.stop();
				}
			}, i * 2 + 2);
		}

		return sb;
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