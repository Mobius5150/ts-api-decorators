import * as ts from 'typescript';
import transformer, { ITransformerArguments, registerDefaultDecorators } from 'ts-api-decorators/dist/transformer';
import { DecoratorResolver } from 'ts-api-decorators/dist/transformer/DecoratorResolver';

export function getTransformerArguments(): ITransformerArguments {
	const decoratorResolver = new DecoratorResolver([
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