# Express API Decorators
This library allows you to use [Typescript API Decorators](https://github.com/Mobius5150/ts-api-decorators) with the Express framework.

## Installation
This library performs preprocessing on APIs during the typescript compilation step. See [Configuring Transformers](../../ConfiguringTransformers.md) for how to set this up. If you want to get started faster, check out the simple example in (examples/express/simple)[../../examples/express/simple].

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

This defines an API that exposes a single `GET` handler at `/hello` that returns the string `Hello World!`. Next, create an instance of `ManagedApi` to handle requests:
```typescript
import express from 'express';
import { ManagedApi } from 'ts-api-decorators-express';

// We'll use express in this sample, but many other transports are supported
const app = express();

// Instantiate ManagedApi
const api = new ManagedApi();

// Hook things up and start the app
app.use(api.init());
app.listen(3000);
```

By default, `ManagedApi` will discover all APIs in your solution tagged with `@Api`. If you prefer less magic, then you can import APIs manually:
```typescript
// Instantiate ManagedApi
const api = new ManagedApi(false);
api.addHandlerClass(MyApi);
```