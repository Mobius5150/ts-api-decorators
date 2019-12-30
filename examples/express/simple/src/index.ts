import * as express from 'express';
import { ManagedApi, Api, ApiGetMethod, ApiQueryParam } from 'ts-api-decorators-express';

@Api
class MyApi {
	@ApiGetMethod('/hello')
	greet(
		@ApiQueryParam() name?: string
	) {
		if (name) {
			return `Hello ${name}!`;
		}

		return 'Hello World!';
	}
}

// We'll use express in this sample, but many other transports are supported
const app = express();

// Instantiate ManagedApi
const api = new ManagedApi();
api.addHandlerClass(MyApi);

// Hook things up and start the app
app.use(api.init());
app.listen(process.env.port || 3000);