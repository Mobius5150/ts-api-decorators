# Configuring A Typescript Transformer
This page shows several ways to configure your project for use with `ts-api-decorators-*`, depending on what other frameworks you're using. Replace `ts-api-decorators-*` below with the name of the package you're using - e.g. `ts-api-decorators-express`.

## ttypescript
The simplest way is to use [`ttypescript`](https://github.com/cevek/ttypescript) to compile instead of `tsc` directly.

**Step 1: Install Dependencies**
First, install `ttypescript` as a dev dependency. Also be sure you have the correct tsapi package installed (e.g. `ts-api-decorators-express`).
```
npm i --save-dev ttypescript
```

**Step 2: Update your tsconfig.json**
```json
// tsconfig.json
{
  "compilerOptions": {
    "plugins": [
      { "transform": "ts-api-decorators-*/transformer" }
    ]
  },
}
```

**Step 3: Update your Build Script**
If you've been building your typescript by running `tsc`, then just replace `tsc` with `ttypescript`. The recommended way is to add a command in your `package.json`, like this:
```json
// package.json
{
    "scripts": {
        "build": "ttypescript"
    }
}
```

Now you can build with `npm run build`.

## Webpack

See [examples/webpack](examples/webpack) for detail.

```js
// webpack.config.js
const tsapiTransformer = require('ts-api-decorators-express/transformer').default;

module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          getCustomTransformers: program => ({
              before: [
                  tsapiTransformer(program)
              ]
          })
        }
      }
    ]
  }
};

```

## TypeScript API

See [test](test) for detail.
You can try it with `$ npm test`.

```js
const ts = require('typescript');
const tsapiTransformer = require('ts-api-decorators-express/transformer').default;

const program = ts.createProgram([/* your files to compile */], {
    module: ts.ModuleKind.CommonJS,
    noEmitOnError: true,
    noImplicitAny: false,
    experimentalDecorators: true,
    target: ts.ScriptTarget.ES2019,
    downlevelIteration: true,
    sourceMap: true,
});

const transformers = {
    before: [tsapiTransformer(program)],
    after: []
};
const { emitSkipped, diagnostics } = program.emit(undefined, undefined, undefined, false, transformers);

if (emitSkipped) {
    throw new Error(diagnostics.map(diagnostic => diagnostic.messageText).join('\n'));
}
```