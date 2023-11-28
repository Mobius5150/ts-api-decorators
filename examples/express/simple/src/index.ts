import * as express from 'express';
import { ManagedApi, Api, ApiGetMethod, ApiQueryParam } from 'ts-api-decorators-express';

@Api
class MyApi {

	/**
	 * A friendly greeter method!
	 * @param name The name to greet
	 * @returns A friendly greeting
	 */
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
const port = process.env.PORT || 3000;
const app = express();
app.use(api.init());
app.listen(port);
console.log(`Listening on port ${port}`);