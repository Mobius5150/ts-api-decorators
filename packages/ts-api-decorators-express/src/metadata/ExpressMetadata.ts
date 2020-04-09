import { IMetadataDescriptor, IMetadataType } from "ts-api-decorators/dist/transformer/TransformerMetadata";

export abstract class ExpressMetadata {
	public static readonly Component = 'ts-api-decorators-express';

	public static readonly MiddlewareArgument: IMetadataDescriptor = {
        type: IMetadataType.Plugin,
        component: ExpressMetadata.Component,
        key: 'middleware',
    }
}