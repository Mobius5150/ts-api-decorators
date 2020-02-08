# Simple Azure Functions Sample
This folder contains a minimal sample for using TS API Decorators with Azure Functions. The goal of this sample is to show you how to setup your project for use with this library.

## Run the Sample
To run the sample, run the following commands in the sample directory.

```
npm i
npm run build
npm run start
```

This will start the Azure Function host on port `7071`. From another terminal, try to send a request:
```
curl http://localhost:7071/hello
```

You should receive the following response:
```
Hello World!
```

Then try using the optional query parameter `name`:
```
curl http://localhost:7071/hello?name=Developer
```

You should receive the response:
```
Hello Developer!
```

## Generate Swagger Documentation
One of the benefits of using this library, is that it makes generation of documentation and client libraries very easy. For example, let's get a Swagger/OpenAPI specification for the sample API. Run the following command:
```
npx tsapi extract ./src
```

The output should look something like:
```yaml
swagger: '2.0'
info:
  title: ts-api-decorators-examples-azure-function-simple
  version: 1.0.0
  description: A simple example API using Express and ts-api-decorators-azure-function
  license:
    name: Apache-2.0
paths:
  /hello:
    get:
      operationId: greet
      parameters:
        - name: name
          in: query
          required: false
          type: string
      responses:
        default:
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
                "transform": "ts-api-decorators/dist/transformer"
            }
        ]
    }
}
```

This configuration tells ttypescript which transformer to run. ttypescript is invoked using our build script from `package.json`:
```json
// package.json
{
    "scripts": {
        "build": "ttsc && npm run build:azfunc_files",
        "build:azfunc_files": "npx tsapi azfunc-generate src function --tsconfig ./tsconfig.json"
        // ...
    }
}
```

The `build:azfunc_files` script defined in `package.json` is invoked after a successful build. This is responsible for generating the function file definitions that the Azure Function host looks for.

This causes the `ts-api-decorators-azure-function` library to be invoked during compilation so that it can do it's magic. Curious about what it does? Check out the output in `dist/index.js` after building:
```javascript
// dist/index.js
// ...
__decorate([
    ts_api_decorators_azure_function_1.ApiGetMethod('/hello', { type: "string" }),
    __param(0, ts_api_decorators_azure_function_1.ApiQueryParam({ name: "name", typedef: { type: "string" }, optional: true }))
], MyApi.prototype, "greet", null);
// ...
```

Note the above call to `__decorate`. See how the arguments differ from the `ApiGetMethod` and `ApiQueryParam` decorators used in `index.ts`? This is the library pulling out type definitions from the typescript source so that they're available to the runtime. Try changing or playing with the parameters to the function and seeing how the compilation output changes.