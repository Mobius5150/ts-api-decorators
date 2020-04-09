import { IDecoratorArgument } from "ts-api-decorators/dist/transformer/DecoratorDefinition";
import { InternalTypeUtil } from "ts-api-decorators/dist/apiManagement/InternalTypes";
import { ExpressionWrapper } from "ts-api-decorators/dist/transformer/ExpressionWrapper";
import { ExpressMetadata } from "./ExpressMetadata";

export abstract class ExpressArgumentExtractors {
	public static readonly MiddlewareArgument: IDecoratorArgument = {
		type: InternalTypeUtil.TypeAnyFunction,
		metadataExtractor: (args) => ({
			...ExpressMetadata.MiddlewareArgument,
			value: new ExpressionWrapper(args.argumentExpression),
		}),
	};
}