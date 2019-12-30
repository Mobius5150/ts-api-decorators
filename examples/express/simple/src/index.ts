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

// Instantiate ManagedApi and add our customer handler
const api = new ManagedApi();
api.addHandlerClass(MyApi);

// Setup express
const app = express();
app.use(api.init());
app.listen(process.env.port || 3000);