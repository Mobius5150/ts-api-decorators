import { Api, ApiGetMethod, ApiBodyParam } from "../../../src";
import { ApiInjectedDependencyParam, ApiInjectedDependency } from "../../../src/decorators";
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

class Database3 {
	public getResponse() { return 'db3'; }
}

const db3Instance = new Database3();

class Database4 {
	public getResponse() { return 'db4'; }
}

const db4Instance = new Database4();

@Api
class MyApi {
	constructor(
		@ApiInjectedDependencyParam() private readonly db: Database,
		@ApiInjectedDependencyParam() private readonly db3: Database3,
		@ApiInjectedDependencyParam() private readonly db4: Database4,
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

	/**
	 * Tests a dependency that was initialized
	 * @returns The string 'db3'
	 */
	@ApiGetMethod('/hellodb3')
	greetDb3() {
		if (this.db3 !== db3Instance) {
			throw new Error('Got unexpected instance');
		}
		
		return this.db3.getResponse();
	}

	/**
	 * Tests a dependency that was initialized with an initializer function
	 * @returns The string 'db4'
	 */
	@ApiGetMethod('/hellodb4')
	greetDb4() {
		if (this.db4 !== db4Instance) {
			throw new Error('Got unexpected instance');
		}

		return this.db4.getResponse();
	}
}

const testApi = new TestManagedApi();
testApi.addDependency(Database);
testApi.addDependency(Database2);
testApi.addDependency(Database3, db3Instance);
testApi.addDependency(Database4, () => db4Instance);
testApi.addHandlerClass(MyApi);
export default testApi;