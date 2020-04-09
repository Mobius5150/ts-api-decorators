import { Api, ApiGetMethod, ApiBodyParam } from "../../../src";
import { ApiInjectedDependencyParam, ApiInjectedDependency } from "../../../src/decorators/DependencyParams";
import { TestManagedApi } from "../../../src/Testing/TestTransport";

class Database {
	public getResponse() { return 'response'; }
}

class Database2 {
	public constructor(
		@ApiInjectedDependencyParam() private readonly db: Database
	) {}
	public getResponse() { return this.db.getResponse() + this.db.getResponse(); }
}

@Api
class MyApi {
	constructor(
		@ApiInjectedDependencyParam() private readonly db: Database
	) {}

	@ApiInjectedDependency()
	private db2: Database2;

	/**
	 * Tests accessing an constructor-injected dependency
	 * @returns The string 'response'
	 */
	@ApiGetMethod('/hello')
	greet() {
		return this.db.getResponse();
	}

	/**
	 * Tests accessing an injected dependency
	 * @returns The string 'response'
	 */
	@ApiGetMethod('/hello2')
	greet2() {
		return this.db2.getResponse();
	}

	/**
	 * Tests accessing a parameter injectected dependency
	 * @returns The string 'response'
	 */
	@ApiGetMethod('/hello3')
	greet3(
		@ApiInjectedDependencyParam() database: Database
	) {
		return database.getResponse();
	}
}

const testApi = new TestManagedApi();
testApi.addDependency(Database);
testApi.addDependency(Database2);
testApi.addHandlerClass(MyApi);
export default testApi;