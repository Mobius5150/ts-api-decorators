import { Api, ApiGetMethod, ApiBodyParam } from "../../../src";
import { ApiInjectedDependencyParam } from "../../../src/decorators/DependencyParams";
import { TestManagedApi } from "../../TestTransport";

class Database {
	public getResponse() { return 'response'; }
}

@Api
class MyApi {
	constructor(
		@ApiInjectedDependencyParam() private readonly db: Database
	) {}

	/**
	 * Tests accessing an injected dependency
	 * @returns The string 'response'
	 */
	@ApiGetMethod('/hello')
	greet() {
		return this.db.getResponse();
	}
}

const testApi = new TestManagedApi();
testApi.addDependency(Database);
testApi.addHandlerClass(MyApi);
export default testApi;