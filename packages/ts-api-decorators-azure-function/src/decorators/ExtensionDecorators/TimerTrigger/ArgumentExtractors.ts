import { IDecoratorArgument } from "ts-api-decorators/dist/transformer/DecoratorDefinition";
import { InternalTypeUtil } from "ts-api-decorators/dist/apiManagement/InternalTypes";
import { AzFuncMetadata } from "../../../metadata/AzFuncMetadata";

export abstract class TimerArgumentExtractors {
	public static readonly ScheduleArgument: IDecoratorArgument = {
		type: InternalTypeUtil.TypeString,
		metadataExtractor: (args) => ({
			...AzFuncMetadata.TimerSchedule,
			value: args.transformContext.typeSerializer.compileExpressionToStringConstant(args.argumentExpression),
		}),
	};

	public static readonly RunOnStartupArgument: IDecoratorArgument = {
		type: InternalTypeUtil.TypeBoolean,
		optional: true,
		metadataExtractor: (args) => ({
			...AzFuncMetadata.TimerRunOnStartup,
			value: args.transformContext.typeSerializer.compileExpressionToBooleanConstant(args.argumentExpression),
		}),
	};

	public static readonly UseMonitorArgument: IDecoratorArgument = {
		type: InternalTypeUtil.TypeBoolean,
		optional: true,
		metadataExtractor: (args) => ({
			...AzFuncMetadata.TimerUseMonitor,
			value: args.transformContext.typeSerializer.compileExpressionToBooleanConstant(args.argumentExpression),
		}),
	};
}