import { ManagedApiInternal } from "../apiManagement";
import { __ApiParamArgs, InternalTypeUtil } from '../apiManagement/InternalTypes';
import { ApiParamType, ApiRawBodyParamType } from "../apiManagement/ApiDefinition";
import { ApiDecorator, DecoratorParentNameDependency, ApiMethodDecoratorGetFunction } from "./DecoratorUtil";
import { HandlerMethodParameterDecorator } from "../transformer/HandlerMethodParameterDecorator";
import { BuiltinArgumentExtractors } from "../transformer/BuiltinArgumentExtractors";
import { BuiltinMetadata } from "../transformer/TransformerMetadata";
import { Api } from "./API";

abstract class OutParams {
	/**
	 * Decorates a body parameter that receives a writable stream to which the output should be written
	 */
	public static ApiOutParamStream(mimeType?: string);
	@ApiDecorator(HandlerMethodParameterDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		parameterType: ApiParamType.Out,
		parameterTypeRestrictions: [ InternalTypeUtil.TypeAnyObject ],
		provider: BuiltinMetadata.BuiltinComponent,
		transformArgumentsToObject: true,
		skipOutputTypeDefinitions: true,
		overrideOutput: true,
		arguments: [],
	})
	public static ApiOutParamStream(a?: any) {
		const args = <__ApiParamArgs>a;
		return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
			ManagedApiInternal.AddApiHandlerParamMetadataToObject(
				{
					...a,
					args,
					parameterIndex,
					propertyKey,
					type: ApiParamType.Out,
					overrideOutput: true,
				},
				target.constructor);
		}
	}
}

export const GetOutParamDecorator = ApiMethodDecoratorGetFunction<HandlerMethodParameterDecorator>(OutParams);

export const ApiOutParamStream = OutParams.ApiOutParamStream;