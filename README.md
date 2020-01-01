# Typescript API Decorators
This library provides a simple way to use typescript decorators to define APIs. The benefits of this approach are many-fold:

- __Automatic Runtime Type Safety and Validation__: The library automatically checks that inputs you accept comply with the type definitions in your code. Extended validation also supports deep, customizable validation that helps you simplify your handlers while making them robust.
- __Easy Logging and Security__: A built in hook system allows you to easily write functions that execute around your handlers - providing simple ways to perform logging or integrate security mechanisms.
- __Platform-Agnostic Implementation__: You can easily compile the same API code to work in many environments: an Express web server, an Azure Function, ...
- __Automatic Swagger Generation__: The library provides tools to automatically generate swagger definitions for your API, which can be used to automatically generate client SDKs.
- __API Validation__: The library can be run in a type checking mode that ensures that all API responses conform to specification.

## Quick Start
The fastest way to get started is to check out the docs or samples for the transport/hosting technology that you use:

- Express.js: [Documentation](packages/ts-api-decorators-express) / [Samples](examples/express/simple)

Or you can read on to learn about the capabilities.

# Contents
1. [Basic Usage](#usage-defining-an-api)
	1. [Query string parameters](#defining-an-api-that-takes-a-query-string-parameter)
	1. [Body parameters](#defining-an-api-that-takes-a-body-parameter)
	1. [Headers](#working-with-headers)
	1. [Error Handling](#error-handling)
	1. [Asynchronous Patterns](#asyncronous-patterns)
1. [Dependency Injection](#dependency-injection)
1. [Advanced Validation (WIP)](#advanced-parameter-validation)
1. [Custom Hooks (WIP)](#custom-hooks)

## Usage (Defining an API)
APIs are defined as methods on a class:
```typescript
@Api
class MyApi {
	@ApiGetMethod('/hello')
	greet() {
		return 'Hello World!';
	}
}
```

This defines an API that exposes a single `GET` handler at `/hello` that returns the string `Hello World!`. To hook this up with your desired transport you'll need to pick and install one of the supported transport packages:
- [`ts-api-decorators-express`](packages/ts-api-decorators-express)
- `ts-api-decorators-azure-function` (WIP)
- `ts-api-decorators-aws-lambda` (WIP)

> You can also write your own to hook up to your preferred environment.

### Defining an API that takes a query string parameter
An API can accept parameters in the querystring:
```typescript
@Api
class MyApi {
	@ApiGetMethod('/hello')
	greet(
		@ApiQueryParam() name: string
	) {
		return `Hello ${name}!`;
	}
}
```

When this API is called at `/hello?name=SuperDeveloper` the following response is returned:
```
200 OK
Hello SuperDeveloper!
```

However, because the query parameter is required, then if this param is ommited the API returns:
```
400 Bad Request
Missing query parameter 'name'
```

We can make the parameter optional by changing the function argument to be optional:
```typescript
@Api
class MyApi {
	@ApiGetMethod('/hello')
	greet(
		@ApiQueryParam() name?: string
	) {
		if (name) {
			return `Hello ${name}!`;
		}

		return 'Hello!';
	}

}
```

```
GET /hello
200 OK
Hello!
```

#### Robust type checking
Because ManagedApis have robust type checking and casting, we can also take other value-type parameters in query strings:
```typescript
@Api
class MyApi {
	@ApiGetMethod('/hello')
	greet(
		@ApiQueryParam() name: string,
		@ApiQueryParam() times: number = 1,
	) {
		for (let i = 0; i < times; ++i) {
			return `Hi ${name}! `;
		}
	}
}
```

This defines an optional `times` parameter that specifies the number of times to greet. The parameter is optional because it has a default value (you can also specify `times?: number` to make it optional in the definition).

> Note that the `name` parameter is not optional because in the function definition it is required.

You can also perform more robust checking on the values:
```typescript
@Api
class MyApi {
	@ApiGetMethod('/hello')
	greet(
		@ApiQueryParamString(/^[a-zA-Z]{2,100}$/) name: string,
		@ApiQueryParamNumber(1, 10, 5) times?: number,
	) {
		for (const i = 0; i < times; ++i) {
			return `Hi ${name}! `;
		}
	}
}
```

This will assert that the `name` parameter is required and that it matches the regular expression `^[a-zA-Z]{2,100}$`, and that the number parameter is optional and must be between 1 and 10 (inclusive). If the number parameter is omitted, it will be set to 5.

You can also use the `Date` type in query string parameters:
```typescript
@Api
class MyApi {
	@ApiGetMethod('/day')
	greet(
		@ApiQueryParam() date: Date,
	) {
		return `The specified day is ${date.toDateString()}`;
	}
}
```

Examples:
```
GET /day?date=1566329594
200 Ok
The specified day is Tue Aug 20 2019

GET /day?date=2019-08-02T05:17:53
200 Ok
The specified day is Fri Aug 02 2019

GET /day
400 Bad Request
Missing query parameter 'date'

GET /day?date=
400 Bad Request
Invalid value for query parameter 'date'. Must be a valid date string.

GET /day?date=My2019Custom08Format02
400 Bad Request
Invalid value for query parameter 'date'. Must be a valid date string.
```

### Defining an API that takes a body parameter
APIs can also accept complex body parameters. Take the following API which expects an object in the response:

```typescript
interface IBodyContents {
	name: string;
}

@Api
class MyApi {
	@ApiPostMethod('/hello')
	greet(
		@ApiBodyParam() contents: IBodyContents
	) {
		return `Hello ${contents.name}!`;
	}
}
```

When called with the following:
```
POST /hello
{ "name": "SuperDev" }
```

The API returns:
```
200 Ok
Hello SuperDev!
```

However if called with the following:
```
POST /hello
{ "myName": "SuperDev" }
```

The API returns:
```
400 Bad Request
Parameter '$.name' missing in body.
```

This also supports complex, multi-level objects:
```typescript
interface IOccupation {
	profession: string;
	title: string;
}

interface IBodyContents {
	name: string;
	formalGreeting?: boolean;
	occupation: IOccupation;
}

@Api
class MyApi {
	@ApiPostMethod('/hello')
	greet(
		@ApiBodyParam() contents: IBodyContents
	) {
		if (contents.formalGreeting) {
			return `Greetings ${contents.name} (${contents.occupation.title})`;
		} else {
			return `Howdy ${contents.name}! I see you're an ${contents.occupation.profession}. Welcome!`;
		}
	}
}
```

Calling with the following body:
```
POST /hello
{ "name": "Mike", "occupation": { "profession": "Developer", "title": "Sr. Developer" } }
```

Results in the following response:
```
200 Ok
Greetings Mike (Sr. Developer)
```

Importantly, the API does deep validation on the input to ensure that it confirms to the typescript type you've defined:

```
POST /hello
{ "name": "Mike", "occupation": { "profession": "Developer" }, "formalGreeting": "yes" }
```

```
400 Bad Request
Parameter $.formalGreeting is expected to be a boolean.
Parameter $.occupation.title is missing.
```

### Working with headers
Because different platforms have different ways of getting and setting headers, we provide a simple way to access them:

```typescript
import { ManagedApi } from 'ts-api-decorators-*';

@Api
class MyApi {
	// Using the `getHeader` / `setHeader` functions:
	@ApiGetMethod('/hello')
	greet() {
		const greetHeader = ManagedApi.getHeader('x-name');
		ManagedApi.setHeader('x-name-response', greetHeader);
		return `Hello ${greetHeader}!`;
	}

	// Using the `ApiHeaderParam` descriptor
	@ApiGetMethod('/hello2')
	greet2(
		@ApiHeaderParam('x-name') greetHeader: string
	) {
		ManagedApi.setHeader('x-name-response', greetHeader);
		return `Hello ${greetHeader}!`;
	}
}
```

Example:
```
GET /hello
X-Name: HeaderDev

200 Ok
X-Name-Response: HeaderDev
Hello HeaderDev!
```

### Error Handling
ManagedApis handle errors using thrown or passed exceptions. When you throw an exception, managed api will look for a `statusCode` or `code` value on the thrown exception that will give an HTTP status code to be returned. When this is present the error can be auto formatted.

We also provide some standard exceptions that can be used.

```typescript
import { HttpBadRequestException } from 'ts-api-decorators-*';

@Api
class MyApi {
	@ApiPostMethod('/hello')
	greet(@ApiQueryParam() name: string) {
		if (name.length >= 10) {
			throw new HttpBadRequestException('name must be fewer than 10 characters');
		}

		return `Hello ${name}!`;
	}
}
```

Example:
```
GET /hello?name=InigoMontoya

400 Bad Request
name must be 10 or fewer characters
```

You can also create your own exception classes:
```typescript
import {HttpError} from 'ts-api-decorators-*';

class HttpTeapotError extends HttpError {
    constructor(m: string = "I'm a teapot") {
        super(m, 418, {});

        // Must set the prototype explicitly!
        Object.setPrototypeOf(this, HttpTeapotError.prototype);
    }
}
```


#### JSON Error Responses
> Note! This section details features which may not be fully implemented.
If you'd prefer the API return detailed json responses for errors, this is simple:
```typescript
import { ManagedApi, ApiErrorFormatterJsonDetailed } from 'ts-api-decorators-*';
const api = new ManagedApi({
	errorFormatter: ApiErrorFormatterJsonDetailed,
});
```

Then, using the previous example the errors become:
```
POST /hello
{ "name": "Mike", "occupation": { "profession": "Developer" }, "formalGreeting": "yes" }
```

```json
400 Bad Request
{
	"code": 400,
	"message": "Bad Request",
	"errors": [
		{
			"type": "ValidationError",
			"parameter": "$.formalGreeting",
			"error": "$.formalGreeting is expected to be a boolean."
		},
		{
			"type": "ValidationError",
			"parameter": "$.occupation.title",
			"error": "$.occupation.title is missing."
		},
	]
}
```

The following error formatters are in development:
- ApiErrorFormatterJsonDetailed
- ApiErrorFormatterJsonSimple

### Asyncronous Patterns
Two asyncronous patterns are supported for handlers: promises and callbacks. Promises are the preferred pattern.

#### Promises
ManagedApi supports async/await and Promises out of the box:

```typescript
@Api
class MyApi {

	@ApiInjectedDependency
	private db: MyPromiseDatabase;

	@ApiGetMethod('/hello')
	async greet() {
		return await this.db.getDefaultGreeting();
	}

}
```

Rejected promises are also handled gracefully.

#### Callbacks
ManagedApi supports callbacks using the `ApiCallback` decorator:
```typescript
@Api
class MyApi {

	@ApiInjectedDependency
	private db: MyCallbackDatabase;

	@ApiGetMethod<void, IGreetingResponse>('/hello')
	greet(@ApiCallback() callback: ApiMethodCallbackFunction<IGreetingResponse>) {
		this.db.getDefaultGreeting((err, result) => {
			if (err) {
				callback(err);
			} else {
				callback(null, result.greeting);
			}
		});
	}

}
```

## Dependency Injection
When writing an api you often need to inject dependencies (such as a database connection) that are used to complete the request. `ManagedApi` can take care of this for you:

```typescript
class MyDatabase {
	public get(greeting: string) {
		switch (greeting) {
			case 'cowboy-greeting':
				return 'Howdy!';

			default:
				return 'Hello!';
		}
	}
}

@Api
class MyApi {

	@ApiInjectedDependency()
	private db: MyDatabase;

	@ApiGetMethod('/hello')
	greet() {
		return this.db.get('cowboy-greeting');
	}

}

@Api
class MyApi {

	constructor(
		@ApiInjectedDependencyParam()
		private readonly db: MyDatabase;
	) {}

	@ApiGetMethod('/hello')
	greet() {
		return this.db.get('cowboy-greeting');
	}

}

@Api
class MyApi {

	@ApiGetMethod('/hello')
	greet(
		@ApiInjectedDependencyParam() db: MyDatabase;
	) {
		return db.get('cowboy-greeting');
	}

}

const db = new MyDatabase();
const api = new ManagedApi();
api.addDependency(db);
```

Because of the `@ApiInjectedDependency` on the `MyApi` class, and the registration for a matching dependency on the ManagedApi, `ManagedApi` will ensure that the dependency is available before the API is invoked. If the dependency hadn't been registered an error would be thrown during initialization because the dependency couldn't be initialized.

You can also provide dependencies with a name in case you have multiple dependencies of the same type:

```typescript
@Api
class MyApi {

	@ApiInjectedDependency('greetings')
	private greetingDb: MyDatabase;

	@ApiInjectedDependency('friends')
	private greetingDb: MyDatabase;

	// ...

}

const greetingsDb = new MyDatabase('db.greetings');
const friendsDb = new MyDatabase('db.friends');
const api = new ManagedApi();
api.addDependency(greetingsDb, 'greetings');
api.addDependency(friendssDb, 'friends');
```

This allows you to have multiple dependencies that have the same type, but may connect to different underlying resources. The dependency injector will also perform type checking before injection of a named dependency and will throw an exception if it is of an incompatible type.

## Advanced Parameter Validation
> Note! This section details features which may not be fully implemented.
Body parameters support advanced validation in two ways: a IParamValidationDefinition, or a custom function:

### Validation with IParamValidationDefinition
```typescript
interface IBodyContents {
	phoneNumber: string;
	name: string;
	age: number;
}

const BodyContentsValidationDef: IParamValidationDefinition<IBodyContents> = {
	phoneNumber: {
		validationRegex: /^[2-9]\d{2}-\d{3}-\d{4}$/
	},
	name: {
		minLength: 2
	},
	age: {
		min: 13,
		max: 150
	}
}

@Api
class MyApi {

	@ApiPostMethod('/phoneNumber')
	greet(@ApiBodyParam(BodyContentsValidationDef) contents: IBodyContents) {
		// Contents will be validated against the definition and the types before
		// this function is invoked.
	}

}
```

### Validation with Custom Function
```typescript
interface IBodyContents {
	phoneNumber: string;
	name: string;
	age: number;
}

const BodyContentsValidationFunc = (contents: IBodyContents) => {
	// This function performs detailed validation for IBodyContents.
	// Type safety is already checked against the interface IBodyContents
	// before this function is executed.
	if (!contents.phoneNumber.match(/^[2-9]\d{2}-\d{3}-\d{4}$/)) {
		throw new HttpBadRequestException('Invalid phone number');
	}

	if (contents.name.length < 2) {
		throw new HttpBadRequestException('Name must be at least 2 characters');
	}

	if (contents.age < 13) {
		throw new HttpBadRequestException('Age must be at least 13');
	}
	
	if (contents.age > 150) {
		throw new HttpBadRequestException('Age must be at least 150');
	}
};

@Api
class MyApi {

	@ApiPostMethod('/phoneNumber')
	greet(@ApiBodyParam(BodyContentsValidationFunc) contents: IBodyContents) {
		// Contents will be validated by the functions and the types before
		// this function is invoked.
	}

}
```

## Custom Hooks
> Note! This section details features which may not be fully implemented.
Custom hooks execute at various points during the execution lifecycle and allow you to run custom code around the invocation of a function. The below example uses a stopwatch to time the execution of a handler:

```typescript
function stopWatchStart(context: ManagedApiRequestContext) {
	context.custom.stopWatchStart = Date.now();
}

function stopWatchEnd(context: ManagedApiRequestContext) {
	const elapsed = Date.now() - context.custom.stopWatchStart;
	console.log(`${context.method} ${context.path} execution took ${elapsed}ms`);
}

const api = new ManagedApi();
api.addHook('handler-preinvoke', stopWatchStart);
api.addHook('handler-completed', stopWatchEnd);
```

Sample output:
```
GET /hello execution took 5ms
POST /customer/123 execution took 23ms
DELETE /invoice/456 execution took 17ms
```

The following hooks are available:
> TODO: convert to table
- handler-preinvoke
- handler-error
- handler-success
- handler-completed
