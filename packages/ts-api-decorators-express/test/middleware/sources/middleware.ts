import { Api, ApiGetMethod, ManagedApi, ExpressApiMiddleware } from "../../../src";
import { ITestServer } from '../../TestServer';
import * as express from 'express';
import * as http from 'http';

function middleware(req: express.Request, res: express.Response, next: express.NextFunction) {
	if (req.query['goodbye']) {
		res.status(200).send('Goodbye');
	} else {
		next();
	}
}

@Api
class MyApi {
	@ApiGetMethod('/hello')
	@ExpressApiMiddleware(middleware)
	greet() {
		return 'Hello';
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
		server.close();
	},
};