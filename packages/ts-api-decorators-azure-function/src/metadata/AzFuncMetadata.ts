import { IMetadataDescriptor, IMetadataType, BuiltinMetadata, ITransformerMetadata } from "ts-api-decorators/dist/transformer/TransformerMetadata";

export abstract class AzFuncMetadata {
    public static readonly Component = 'ts-api-decorators-azure-function';
    
    public static readonly ApiMethodTypeQueue: ITransformerMetadata = {
        ...BuiltinMetadata.ApiMethodType,
        value: 'queue',
	}
}