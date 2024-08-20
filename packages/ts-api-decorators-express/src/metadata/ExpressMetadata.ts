import { IMetadataDescriptor, IMetadataType } from 'ts-api-decorators/dist/transformer/TransformerMetadata';

export abstract class ExpressMetadata {
	public static readonly Component = 'ts-api-decorators-express';

	public static readonly MiddlewareArgument: IMetadataDescriptor = {
		type: IMetadataType.Plugin,
		component: ExpressMetadata.Component,
		key: 'middleware',
	};

	public static readonly WrapPromiseArgument: IMetadataDescriptor = {
		type: IMetadataType.Plugin,
		component: ExpressMetadata.Component,
		key: 'wrapPromise',
	};

	public static readonly TransportTypeRequestParam = 'express.request';
	public static readonly TransportTypeResponseParam = 'express.response';
	public static readonly TransportTypeRequestUserParam = 'express.request.user';
	public static readonly TransportTypeRequestAbortSignalParam = 'express.request.abort';
}
