import * as ts from 'typescript';
import transformer from 'ts-api-decorators/dist/transformer';
import { DecoratorResolver } from 'ts-api-decorators/dist/transformer/DecoratorResolver';
import { AzFuncApiRequestParam, AzFuncParamDecorator, AzFuncApiResponseParam } from './decorators';

export default function azFuncTransformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
	const decoratorResolver = new DecoratorResolver([
		AzFuncParamDecorator(AzFuncApiRequestParam),
		AzFuncParamDecorator(AzFuncApiResponseParam),
	]);
	
	return transformer(program, {
		decoratorResolver,
		registerBuiltindecorators: true,
	});
}