# Typescript API Decorators
This library provides a simple way to use typescript decorators to define APIs. The benefits of this approach are many-fold:

- __Automatic Runtime Type Safety and Validation__: The library automatically checks that inputs you accept comply with the type definitions in your code. Extended validation also supports deep, customizable validation that helps you simplify your handlers while making them robust.
- __Easy Logging and Security__: A built in hook system allows you to easily write functions that execute around your handlers - providing simple ways to perform logging or integrate security mechanisms.
- __Platform-Agnostic Implementation__: You can easily compile the same API code to work in many environments: an Express web server, an Azure Function, ...
- __Automatic Swagger Generation__: The library provides tools to automatically generate swagger definitions for your API, which can be used to automatically generate client SDKs.
- __API Validation__: The library can be run in a type checking mode that ensures that all API responses conform to specification.

## Quick Start
To get started, check out the [library for the transport or hosting technology of your choice](https://github.com/Mobius5150/ts-api-decorators).