import * as ts from 'typescript';
import transformer, { ITransformerArguments } from 'ts-api-decorators/dist/transformer';
import { DecoratorResolver } from 'ts-api-decorators/dist/transformer/DecoratorResolver';
import { AzFuncApiRequestParam, AzFuncParamDecorator, AzFuncApiResponseParam, AzFuncTimerTrigger, AzFuncTimerParam } from './decorators';
import { AzFuncTimerMethodDecorator, AzFuncTimerParamDecorator } from './decorators/ExtensionDecorators/TimerTrigger/TimerTrigger';

export function getTransformerArguments(): ITransformerArguments {
	const decoratorResolver = new DecoratorResolver([
		AzFuncParamDecorator(AzFuncApiRequestParam),
		AzFuncParamDecorator(AzFuncApiResponseParam),
		AzFuncTimerMethodDecorator(AzFuncTimerTrigger),
		AzFuncTimerParamDecorator(AzFuncTimerParam),
	]);
	
	return {
		decoratorResolver,
		registerBuiltindecorators: true,
	};
}

export default function azFuncTransformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
	return transformer(program, getTransformerArguments());
}