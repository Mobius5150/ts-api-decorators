import 'reflect-metadata';
import { ManagedApiInternal } from "../apiManagement/ManagedApiInternal";
import { ApiMethodDecoratorGetFunction, ApiDecorator, DecoratorParentNameDependency } from "./DecoratorUtil";
import { HandlerMethodDecorator } from "../transformer/HandlerMethodDecorator";
import { BuiltinMetadata } from "../transformer/TransformerMetadata";
import { BuiltinArgumentExtractors } from "../transformer/BuiltinArgumentExtractors";
import { ApiProcessorTime, IApiPreProcessor, IApiPostProcessor, IApiGlobalProcessor, ApiProcessorScope } from '../apiManagement/ApiProcessing/ApiProcessing';
import { Api } from './API';

export type ApiMethodDecoratorReturnType<T, K = (...args: any[]) => T> = (
	target: object,
	propertyKey: string,
	descriptor: TypedPropertyDescriptor<K>
) => void;

abstract class ApiProcessingDecorators {
	public static ApiProcessor(stage: ApiProcessorTime.StagePreInvoke, scope?: ApiProcessorScope): ApiMethodDecoratorReturnType<never, IApiPreProcessor['processor']>;
	public static ApiProcessor(stage: ApiProcessorTime.StagePostInvoke, scope?: ApiProcessorScope): ApiMethodDecoratorReturnType<never, IApiPostProcessor['processor']>;
	@ApiDecorator(HandlerMethodDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		provider: BuiltinMetadata.BuiltinComponent,
		arguments: [
			BuiltinArgumentExtractors.RouteArgument,
			BuiltinArgumentExtractors.ReturnSchemaArgument,
		],
		metadata: [],
		transformArgumentsToObject: false,
	})
	public static ApiProcessor(stage: ApiProcessorTime, scope: ApiProcessorScope = ApiProcessorScope.ScopeGlobal): ApiMethodDecoratorReturnType<never, IApiGlobalProcessor['processor']> {
		return (
			target: object,
			propertyKey: string,
			descriptor: TypedPropertyDescriptor<IApiGlobalProcessor['processor']>
		) => {
			ManagedApiInternal.AddGlobalApiProcessorMetadataToObject(
				{
					stage,
					scope,
					processorKey: propertyKey,
					processor: descriptor.value,
				},
				target.constructor);
		}
	}
}

export const GetApiProcessorDecorator = ApiMethodDecoratorGetFunction<HandlerMethodDecorator>(ApiProcessingDecorators);

export const ApiProcessor = ApiProcessingDecorators.ApiProcessor;