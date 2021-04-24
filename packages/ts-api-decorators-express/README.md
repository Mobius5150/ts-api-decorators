# Express API Decorators
This library allows you to use [Typescript API Decorators](https://github.com/Mobius5150/ts-api-decorators) with the Express framework.

## Installation
This library performs preprocessing on APIs during the typescript compilation step. See [Configuring Transformers](../../ConfiguringTransformers.md) for how to set this up. If you want to get started faster, check out the simple example in [examples/express/simple](../../examples/express/simple).

## Usage (Defining an API)
APIs are defined as methods on a class:
```typescript
import { Api, ApiGetMethod } from 'ts-api-decorators-express';

@Api
class MyApi {
	@ApiGetMethod('/hello')
	greet() {
		return 'Hello World!';
	}
}
```

This defines an API that exposes a single `GET` handler at `/hello` that returns the string `Hello World!`. Next, create an instance of `ManagedApi` to handle requests:
```typescript
import express from 'express';
import { ManagedApi } from 'ts-api-decorators-express';

// Instantiate ManagedApi
const api = new ManagedApi();
api.addHandlerClass(MyApi);

// Instantiate Express
const app = express();
app.use(api.init());
app.listen(3000);
```

For complete documentation on functionality, [see the README at the root of the repo.](../../).

## Access Express Functionality
You can access the Express request and response objects using Decorators:
```typescript
import { Api, ApiGetMethod, ExpressApiRequestParam, ExpressApiResponseParam } from 'ts-api-decorators-express';
import * as express from 'express';

@Api
class MyApi {
	@ApiGetMethod('/hello')
	greet(
		@ExpressApiRequestParam() req: Express.Request,
		@ExpressApiResponseParam() res: Express.Response,
	) {
		// ...
	}
}
```
