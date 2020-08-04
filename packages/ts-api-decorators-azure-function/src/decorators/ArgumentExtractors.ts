import { IDecoratorArgument } from "ts-api-decorators/dist/transformer/DecoratorDefinition";
import { InternalTypeUtil } from "ts-api-decorators/dist/apiManagement/InternalTypes";
import { AzFuncMetadata } from "../metadata/AzFuncMetadata";

export abstract class AzFuncArgumentExtractors {
	public static readonly OutParamArgument: IDecoratorArgument = {
		type: InternalTypeUtil.TypeString,
		metadataExtractor: (args) => ({
			...AzFuncMetadata.OutField,
			value: args.transformContext.typeSerializer.compileExpressionToStringConstant(args.argumentExpression),
		}),
	};
}