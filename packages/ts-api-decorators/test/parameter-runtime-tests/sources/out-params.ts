import { Api, ApiOutParamStream, ApiGetMethod, ApiQueryParam, HttpBadRequestError } from "../../../src";
import { TestManagedApi } from "../../../src/Testing/TestTransport";
import { Writable } from "stream";

@Api
class MyApi {
	@ApiGetMethod<void>('/basicOutStream')
	basicOutStream(
		@ApiQueryParam() name: string,
		@ApiOutParamStream() outStream: Writable,
	) {
		for (const chunk of this.getStreamChunks(name)) {
			outStream.write(chunk, 'utf8');
		}

		outStream.end();
	}

	@ApiGetMethod<void>('/timedOutStream')
	timedOutStream(
		@ApiQueryParam() name: string,
		@ApiOutParamStream() outStream: Writable,
	) {
		this.timedOutStreamThatFinishes(name, outStream);
	}

	@ApiGetMethod<void>('/timedOutStreamThatFinishes')
	timedOutStreamThatFinishes(
		@ApiQueryParam() name: string,
		@ApiOutParamStream() outStream: Writable,
	): Promise<void> {
		return new Promise((resolve, reject) => {
			try {
				let i = 2;
				for (const chunk of this.getStreamChunks(name)) {
					setTimeout(() => {
						outStream.write(chunk, 'utf8');
					}, i);

					i += 2;
				}

				setTimeout(() => {
					outStream.end();
					resolve();
				}, i);
			} catch (e) {
				reject(e);
			}
		});
	}

	private getStreamChunks(name: string): string[] {
		if (name === 'bad') {
			throw new HttpBadRequestError();
		}

		return [
			'Hello',
			' ',
			name,
			'!',
		];
	}
}

const testApi = new TestManagedApi();
testApi.addHandlerClass(MyApi);
export default testApi;