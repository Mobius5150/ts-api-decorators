import { IDecoratorArgument } from "ts-api-decorators/dist/transformer/DecoratorDefinition";
import { InternalTypeUtil } from "ts-api-decorators/dist/apiManagement/InternalTypes";
import { AzFuncMetadata } from "../../../metadata/AzFuncMetadata";
import { BuiltinMetadata } from "ts-api-decorators/dist/transformer/TransformerMetadata";

export abstract class BlobStorageArgumentExtractors {
	public static readonly PathArgument: IDecoratorArgument = {
		type: InternalTypeUtil.TypeString,
		metadataExtractor: (args) => ({
			...BuiltinMetadata.Route,
			value: args.transformContext.typeSerializer.compileExpressionToStringConstant(args.argumentExpression),
		}),
	};

	public static readonly ConnectionArgument: IDecoratorArgument = {
		type: InternalTypeUtil.TypeString,
		optional: true,
		metadataExtractor: (args) => ({
			...AzFuncMetadata.BlobStorageConnection,
			value: args.transformContext.typeSerializer.compileExpressionToStringConstant(args.argumentExpression),
		}),
	};
}