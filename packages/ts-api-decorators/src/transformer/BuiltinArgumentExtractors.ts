import * as ts from 'typescript';
import { IDecoratorArgument } from "./DecoratorDefinition";
import { InternalTypeUtil, InternalTypeDefinition } from "../apiManagement/InternalTypes";
import { BuiltinMetadata } from "./TransformerMetadata";
import { ITransformContext } from './ITransformContext';
import { ExpressionWrapper } from './ExpressionWrapper';
import { ApiProcessorTime, ApiProcessorScope } from '../apiManagement/ApiProcessing/ApiProcessing';
import { DefaultApiResponseCode } from '../Constants';

export abstract class BuiltinArgumentExtractors {
	public static readonly RouteArgument: IDecoratorArgument = {
		type: InternalTypeUtil.TypeString,
		metadataExtractor: (args) => ({
			...BuiltinMetadata.Route,
			value: args.transformContext.typeSerializer.compileExpressionToStringConstant(args.argumentExpression),
		}),
	};

	public static readonly ResponseCodesArgument: IDecoratorArgument = {
		type: InternalTypeUtil.TypeNumberArray,
		defaultExpression: ts.createArrayLiteral([ts.createNumericLiteral(DefaultApiResponseCode.toString())]),
		metadataExtractor: (args) => ({
			...BuiltinMetadata.ResponseCodes,
			value: args.transformContext.typeSerializer.compileExpressionToArrayConstant(args.argumentExpression),
		}),
	};

	public static readonly ApiProcessorStageArgument: IDecoratorArgument = {
		type: {
			...InternalTypeUtil.TypeEnum,
			schema: { enum: [ ApiProcessorTime.StagePreInvoke, ApiProcessorTime.StagePostInvoke ] },
		},
		metadataExtractor: (args) => ({
			...BuiltinMetadata.ApiProcessorStage,
			value: args.transformContext.typeSerializer.compileExpressionToStringConstant(args.argumentExpression),
		}),
	};

	public static readonly ApiProcessorScopeArgument: IDecoratorArgument = {
		optional: true,
		type: {
			...InternalTypeUtil.TypeEnum,
			schema: { enum: [ ApiProcessorScope.ScopeGlobal, ApiProcessorScope.ScopeClass ] },
		},
		metadataExtractor: (args) => ({
			...BuiltinMetadata.ApiProcessorScope,
			value: args.transformContext.typeSerializer.compileExpressionToStringConstant(args.argumentExpression),
		}),
	};

	public static readonly NameArgument: IDecoratorArgument = {
		type: InternalTypeUtil.TypeString,
		metadataExtractor: (args) => ({
			...BuiltinMetadata.Name,
			value: args.transformContext.typeSerializer.compileExpressionToStringConstant(args.argumentExpression),
		}),
	};

	public static readonly OptionalNameArgument: IDecoratorArgument = {
		...BuiltinArgumentExtractors.NameArgument,
		optional: true,
	};

	public static readonly MimeTypeArgument: IDecoratorArgument = {
		type: InternalTypeUtil.TypeString,
		metadataExtractor: (args) => ({
			...BuiltinMetadata.MimeType,
			value: args.transformContext.typeSerializer.compileExpressionToStringConstant(args.argumentExpression),
		}),
	};

	public static readonly OptionalMimeTypeArgument: IDecoratorArgument = {
		...BuiltinArgumentExtractors.MimeTypeArgument,
		optional: true,
	};

	public static readonly DependencyScopeArgument: IDecoratorArgument = {
		type: InternalTypeUtil.TypeString,
		optional: true,
		metadataExtractor: (args) => ({
			...BuiltinMetadata.DependencyScope,
			value: args.transformContext.typeSerializer.compileExpressionToStringConstant(args.argumentExpression),
		}),
	};

	public static readonly RegexpArgument: IDecoratorArgument = {
		type: InternalTypeUtil.TypeRegex,
		optional: true,
		metadataExtractor: (args) => {
			if (!ts.isRegularExpressionLiteral(args.argumentExpression)) {
				throw new Error('Regular expression must be a regex literal');
			}

			return {
				...BuiltinMetadata.ValidationRegExp,
				value: new ExpressionWrapper(args.argumentExpression),
			}
		},
	};

	public static readonly NumberMinArgument: IDecoratorArgument = {
		type: InternalTypeUtil.TypeNumber,
		optional: true,
		metadataExtractor: (args) => {
			return {
				...BuiltinMetadata.NumberMin,
				value: args.transformContext.typeSerializer.compileExpressionToNumericConstant(args.argumentExpression),
			}
		},
	};

	public static readonly NumberMaxArgument: IDecoratorArgument = {
		type: InternalTypeUtil.TypeNumber,
		optional: true,
		metadataExtractor: (args) => {
			return {
				...BuiltinMetadata.NumberMax,
				value: args.transformContext.typeSerializer.compileExpressionToNumericConstant(args.argumentExpression),
			}
		},
	};

	public static readonly BoolUndefinedIfOmitted: IDecoratorArgument = {
		type: InternalTypeUtil.TypeBoolean,
		optional: true,
		metadataExtractor: (args) => {
			return {
				...BuiltinMetadata.UndefinedIfOmitted,
				value: args.transformContext.typeSerializer.compileExpressionToNumericConstant(args.argumentExpression),
			}
		},
	};

	public static readonly ValidationFunctionArgument: IDecoratorArgument = {
		type: InternalTypeUtil.TypeAnyFunction,
		optional: true,
		metadataExtractor: (args) => {
			return {
				...BuiltinMetadata.ValidationFunction,
				value: new ExpressionWrapper(BuiltinArgumentExtractors.parenthesizeExpression(args.argumentExpression)),
			}
		},
	};

	public static readonly ReturnSchemaArgument: IDecoratorArgument = {
		type: { type: 'any' },
		optional: true,
		metadataExtractor: (args) => {
			let returnType = BuiltinArgumentExtractors.GetNodeReturnType(args.node, args.transformContext);
			if (returnType) {
				return {
					...BuiltinMetadata.ReturnSchema,
					value: returnType
				}
			}
		},
		transformer: (args) => {
			let returnType = BuiltinArgumentExtractors.GetNodeReturnType(args.node, args.transformContext);
			if (returnType) {
				return args.transformContext.typeSerializer.objectToLiteral(returnType);
			}
		}
	}

	private static GetNodeReturnType(node: ts.Node, context: ITransformContext): InternalTypeDefinition {
		if (ts.isMethodDeclaration(node)) {
			const type = context.typeChecker.getTypeAtLocation(node);
			const callSignatures = type.getCallSignatures();
			if (callSignatures.length === 1) {
				return context.typeSerializer.getInternalTypeRepresentation(
					node.type,
					context.typeChecker.getReturnTypeOfSignature(callSignatures[0]));
			} else if (callSignatures.length > 1) {
				throw new Error('Cannot handle method with multiple call signatures');
			}
		}
	}

	private static parenthesizeExpression(expression: ts.Expression) {
		return ts.isParenthesizedExpression(expression)
			? expression
			: ts.createParen(expression);
    }
}