import { ManagedApiInternal } from "../apiManagement";
import { __ApiParamArgs, ApiParamValidationFunction, InternalTypeUtil } from '../apiManagement/InternalTypes';
import { ApiParamType, ApiRawBodyParamType } from "../apiManagement/ApiDefinition";
import { ApiDecorator, DecoratorParentNameDependency, ApiMethodDecoratorGetFunction } from "./DecoratorUtil";
import { HandlerMethodParameterDecorator } from "../transformer/HandlerMethodParameterDecorator";
import { BuiltinArgumentExtractors } from "../transformer/BuiltinArgumentExtractors";
import { BuiltinMetadata } from "../transformer/TransformerMetadata";
import { Api } from "./API";

abstract class BodyParams {
	/**
	 * Decorates a body parameter that should be validated with a regular expression.
	 * @param stringValidationRegex The regular expression to validate the input
	 */
	public static ApiBodyParamString(stringValidationRegex?: RegExp);
	@ApiDecorator(HandlerMethodParameterDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		parameterType: ApiParamType.Body,
		parameterTypeRestrictions: [ InternalTypeUtil.TypeString ],
		provider: BuiltinMetadata.BuiltinComponent,
		transformArgumentsToObject: true,
		arguments: [
			BuiltinArgumentExtractors.RegexpArgument,
		],
	})
	public static ApiBodyParamString(a?: any) {
		return this.ApiBodyParam(a);
	}

	/**
	 * Decorates a body parameter that should be cast to a number.
	 * @param numberMin The minimum value, undefined for no minimum.
	 * @param numberMax The maximum value, undefined for no maximum.
	 * @param numberDefault The default value, undefined will use the minimum value if defined, if not the maximum, if not then undefined.
	 */
	public static ApiBodyParamNumber(numberMin?: number, numberMax?: number);
	@ApiDecorator(HandlerMethodParameterDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		parameterType: ApiParamType.Body,
		parameterTypeRestrictions: [ InternalTypeUtil.TypeNumber ],
		provider: BuiltinMetadata.BuiltinComponent,
		transformArgumentsToObject: true,
		arguments: [
			BuiltinArgumentExtractors.NumberMinArgument,
			BuiltinArgumentExtractors.NumberMaxArgument,
		],
	})
	public static ApiBodyParamNumber(a?: any) {
		return this.ApiBodyParam(a);
	}

	/**
	 * Decorates a body parameter that receives a raw, readable stream for the request
	 * @param mimeType The valid mime type for the request.
	 */
	public static ApiBodyParamStream(mimeType?: string);
	@ApiDecorator(HandlerMethodParameterDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		parameterType: ApiParamType.RawBody,
		parameterTypeRestrictions: [ InternalTypeUtil.TypeAnyObject ],
		provider: BuiltinMetadata.BuiltinComponent,
		transformArgumentsToObject: true,
		skipOutputTypeDefinitions: true,
		arguments: [
			BuiltinArgumentExtractors.OptionalMimeTypeArgument,
		],
		metadata: [
			{
				...BuiltinMetadata.SchemaFormat,
				value: 'binary',
			}
		],
	})
	public static ApiBodyParamStream(a?: any) {
		const args = <__ApiParamArgs>a;
		return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
			ManagedApiInternal.AddApiHandlerParamMetadataToObject(
				{
					...a,
					args,
					parameterIndex,
					propertyKey,
					type: ApiParamType.RawBody,
					bodyType: ApiRawBodyParamType.Stream,
				},
				target.constructor);
		}
	}

	public static ApiBodyParamMultipartFormFileName(stringValidationRegex?: RegExp);
	@ApiDecorator(HandlerMethodParameterDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		parameterType: ApiParamType.FormFileSingle,
		parameterTypeRestrictions: [ InternalTypeUtil.TypeString ],
		provider: BuiltinMetadata.BuiltinComponent,
		transformArgumentsToObject: true,
		skipOutputTypeDefinitions: true,
		arguments: [
			BuiltinArgumentExtractors.RegexpArgument,
		],
	})
	public static ApiBodyParamMultipartFormFileName(a?: any) {
		const args = <__ApiParamArgs>a;
		return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
			ManagedApiInternal.AddApiHandlerParamMetadataToObject(
				{
					...a,
					args,
					parameterIndex,
					propertyKey,
					type: ApiParamType.Body,
					bodyType: ApiRawBodyParamType.Stream,
				},
				target.constructor);
		}
	}

	public static ApiBodyParamMultipartFormFileString(mimeType?: string);
	@ApiDecorator(HandlerMethodParameterDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		parameterType: ApiParamType.FormFileSingle,
		parameterTypeRestrictions: [ InternalTypeUtil.TypeString ],
		provider: BuiltinMetadata.BuiltinComponent,
		transformArgumentsToObject: true,
		arguments: [
			BuiltinArgumentExtractors.OptionalMimeTypeArgument,
		],
		metadata: [
			{
				...BuiltinMetadata.FormDataFieldName,
				value: 'fileName',
			},
			{
				...BuiltinMetadata.SchemaFormat,
				value: 'binary',
			},
		],
	})
	public static ApiBodyParamMultipartFormFileString(a?: any) {
		const args = <__ApiParamArgs>a;
		return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
			ManagedApiInternal.AddApiHandlerParamMetadataToObject(
				{
					...a,
					args,
					parameterIndex,
					propertyKey,
					type: ApiParamType.Body,
					bodyType: ApiRawBodyParamType.String,
				},
				target.constructor);
		}
	}

	public static ApiBodyParamMultipartFormFileStream(mimeType?: string);
	@ApiDecorator(HandlerMethodParameterDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		parameterType: ApiParamType.FormFileSingle,
		parameterTypeRestrictions: [ InternalTypeUtil.TypeAnyObject ],
		provider: BuiltinMetadata.BuiltinComponent,
		transformArgumentsToObject: true,
		arguments: [
			BuiltinArgumentExtractors.OptionalMimeTypeArgument,
		],
		metadata: [
			{
				...BuiltinMetadata.FormDataFieldName,
				value: 'fileName',
			},
			{
				...BuiltinMetadata.SchemaFormat,
				value: 'binary',
			},
		],
	})
	public static ApiBodyParamMultipartFormFileStream(a?: any) {
		const args = <__ApiParamArgs>a;
		return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
			ManagedApiInternal.AddApiHandlerParamMetadataToObject(
				{
					...a,
					args,
					parameterIndex,
					propertyKey,
					type: ApiParamType.Body,
					bodyType: ApiRawBodyParamType.Stream,
				},
				target.constructor);
		}
	}

	/**
	 * Decorates a body parameter that receives an unparsed string representing the request body.
	 * @param mimeType The valid mime type for the request.
	 */
	public static ApiBodyParamRawString(mimeType?: string);
	@ApiDecorator(HandlerMethodParameterDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		parameterType: ApiParamType.RawBody,
		parameterTypeRestrictions: [ InternalTypeUtil.TypeString ],
		provider: BuiltinMetadata.BuiltinComponent,
		transformArgumentsToObject: true,
		skipOutputTypeDefinitions: true,
		arguments: [
			BuiltinArgumentExtractors.OptionalMimeTypeArgument,
		],
	})
	public static ApiBodyParamRawString(a?: any) {
		const args = <__ApiParamArgs>a;
		return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
			ManagedApiInternal.AddApiHandlerParamMetadataToObject(
				{
					...a,
					args,
					parameterIndex,
					propertyKey,
					type: ApiParamType.RawBody,
					bodyType: ApiRawBodyParamType.String,
				},
				target.constructor);
		}
	}

	/**
	 * The request body.
	 * @param validator A validation function to validate the body contents
	 */
	public static ApiBodyParam(): ParameterDecorator;
	public static ApiBodyParam(validator?: ApiParamValidationFunction): ParameterDecorator;
	@ApiDecorator(HandlerMethodParameterDecorator, {
		indexTs: __filename,
		dependencies: [ DecoratorParentNameDependency(Api.name) ],
		parameterType: ApiParamType.Body,
		parameterTypeRestrictions: [
			InternalTypeUtil.TypeNumber,
			InternalTypeUtil.TypeString,
			InternalTypeUtil.TypeDate,
			InternalTypeUtil.TypeAnyObject,
			InternalTypeUtil.TypeAnyArray,
			InternalTypeUtil.TypeAny,
		],
		provider: BuiltinMetadata.BuiltinComponent,
		transformArgumentsToObject: true,
		arguments: [
			BuiltinArgumentExtractors.ValidationFunctionArgument,
		],
	})
	public static ApiBodyParam(a?: any): ParameterDecorator {
		const args = <__ApiParamArgs>a;
		return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
			ManagedApiInternal.AddApiHandlerParamMetadataToObject(
				{
					args,
					parameterIndex,
					propertyKey,
					type: ApiParamType.Body,
				},
				target.constructor);
		}
	}
}

export const GetBodyParamDecorator = ApiMethodDecoratorGetFunction<HandlerMethodParameterDecorator>(BodyParams);

export const ApiBodyParam = BodyParams.ApiBodyParam;
export const ApiBodyParamString = BodyParams.ApiBodyParamString;
export const ApiBodyParamNumber = BodyParams.ApiBodyParamNumber;
export const ApiBodyParamStream = BodyParams.ApiBodyParamStream;
export const ApiBodyParamRawString = BodyParams.ApiBodyParamRawString;
// export const ApiBodyParamMultipartFormFileName = BodyParams.ApiBodyParamMultipartFormFileName;
// export const ApiBodyParamMultipartFormFileString = BodyParams.ApiBodyParamMultipartFormFileString;
// export const ApiBodyParamMultipartFormFileStream = BodyParams.ApiBodyParamMultipartFormFileStream;