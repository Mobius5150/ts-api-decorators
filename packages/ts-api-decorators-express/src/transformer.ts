import * as ts from 'typescript';
import transformer, { ITransformerArguments, registerDefaultDecorators } from 'ts-api-decorators/dist/transformer';
import { DecoratorResolver } from 'ts-api-decorators/dist/transformer/DecoratorResolver';
import {
	GetExpressApiParamDecorator,
	ExpressApiRequestParam,
	ExpressApiResponseParam,
	ExpressApiMiddleware,
	GetExpressApiModifierDecorator,
	ExpressApiRequestUserParam,
	ApiAbortSignalParam,
} from './decorators';

export function getTransformerArguments(): ITransformerArguments {
	const decoratorResolver = new DecoratorResolver([
		GetExpressApiParamDecorator(ExpressApiRequestParam),
		GetExpressApiParamDecorator(ExpressApiRequestUserParam),
		GetExpressApiParamDecorator(ExpressApiResponseParam),
		GetExpressApiParamDecorator(ApiAbortSignalParam),
		GetExpressApiModifierDecorator(ExpressApiMiddleware),
	]);

	registerDefaultDecorators(decoratorResolver);

	return {
		decoratorResolver,
		registerBuiltindecorators: false,
	};
}

export default function azFuncTransformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
	return transformer(program, getTransformerArguments());
}
