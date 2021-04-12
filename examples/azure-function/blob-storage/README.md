# Azure Functions Blob Storage Sample
This folder contains a minimal sample for handling blob storage triggers, inputs, and outputs.

## Build the Sample
To build the sample with npm:
```bash
npm install
npm run build
```

## Run the Sample
Before you run this sample, you'll need to [create an Azure Storage Account](https://docs.microsoft.com/azure/storage/common/storage-account-create?tabs=azure-portal). Once you do, [copy the connection string](https://docs.microsoft.com/azure/storage/common/storage-configure-connection-string) and paste it into the `Values.AzureWebJobsStorage` field of `function/local.settings.json`:

```json
{
	"IsEncrypted": false,
	"Values": {
		"languageWorkers:node:arguments": "--inspect=9229",
		"AzureWebJobsStorage": "paste-your-storage-account-here"
	}
}
````

Once that's configured, start the sample with:
```bash
npm run start
```

To test that it's actually working, you'll need to create some blobs! To start, create three containers in your storage account: `testblob`, `testblob2`, `testblob3` (this can be done in the portal, the CLI, or all of the SDKs).

Once done, create or update any blob file in that container (the blob must have an extension), and see the console messages when your trigger files!

![Sample run showing a user uploading a file with name `package.json` to Azure Storage and the Azure Function binding firing.](./sample-run.gif)

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
                "transform": "ts-api-decorators-azure-function/dist/transformer"
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

The `build:azfunc_files` script defined in `package.json` is invoked after a successful build. This is responsible for generating the function file definitions that the Azure Function host looks for. This causes the `ts-api-decorators-azure-function` library to be invoked during compilation so that it can do it's magic.