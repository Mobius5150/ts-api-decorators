# Simple Express Sample
This folder contains a minimal sample for using TS API Decorators with the Express framework. The goal of this sample is to show you how to setup your project for use with this library.

## Run the Sample
To run the sample, run the following commands in the sample directory:

```
yarn
yarn build
node dist/index.js
```

This will start an express server on port `3000` of localhost. In another terminal, try the following request:
```
curl http://localhost:3000/hello
```

You should receive the following response:
```
Hello World!
```

Then try using the optional query parameter `name`:
```
curl http://localhost:3000/hello?name=Developer
```

You should receive the response:
```
Hello Developer!
```

## Generate OpenApi Documentation
One of the benefits of using this library, is that it makes generation of documentation and client libraries very easy. For example, let's get a Swagger/OpenAPI specification for the sample API. Run the following command:
```
npx tsapi extract --type openapiv3 ./src
```

The output should look something like:
```yaml
openapi: 3.0.1
info:
  title: ts-api-decorators-examples-express-simple
  version: 1.0.0
  description: A simple example API using Express and ts-api-decorators-express
  license:
    name: Apache-2.0
  contact: {}
servers:
  - url: undefined
paths:
  /hello:
    get:
      operationId: greet
      description: A friendly greeter method!
      summary: A friendly greeter method!
      tags: []
      parameters:
        - name: name
          in: query
          required: false
          description: The name to greet
          schema:
            type: string
      responses:
        '200':
          description: A friendly greeting
          content:
            text/plain:
              schema:
                type: string
```

With the above definition, you can then consider another tool such as [`openapi-generator`](https://github.com/openapitools/openapi-generator) to generate a client SDK in the language of your choice that can call the API.

## About the Sample
There are a few key parts of this sample that are needed for the project to work.

Firstly, in the `tsconfig.json`, `experimentalDecorators` must be set to `true` in order to use decorators. Also, note the `plugins` value enabling the transformer: `ts-api-decorators/dist/transformer`.
```json
// tsconfig.json
{
    "compilerOptions": {
        "experimentalDecorators": true,
        "plugins": [
            {
                "transform": "ts-api-decorators-express/dist/transformer"
            }
        ]
    }
}
```

This configuration tells ts-patch which transformer to run. `tspc` is invoked using our build script from `package.json`:
```json
// package.json
{
    "scripts": {
        "build": "tspc",
    }
}
```

This causes the `ts-api-decorators-express` library to be invoked during compilation so that it can do it's magic. Curious about what it does? Check out the output in `dist/index.js` after building:
```javascript
// dist/index.js
// ...
__decorate([
    ts_api_decorators_express_1.ApiGetMethod('/hello', { type: "string" }),
    __param(0, ts_api_decorators_express_1.ApiQueryParam({ name: "name", typedef: { type: "string" }, optional: true }))
], MyApi.prototype, "greet", null);
// ...
```

Note the above call to `__decorate`. See how the arguments differ from the `ApiGetMethod` and `ApiQueryParam` decorators used in `index.ts`? This is the library pulling out type definitions from the typescript source so that they're available to the runtime. Try changing or playing with the parameters to the function and seeing how the compilation output changes.