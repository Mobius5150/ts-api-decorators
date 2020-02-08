import * as ts from 'typescript';
import { IParameterDecoratorDefinition, DecoratorType, IDecoratorMagicFuncAssignment } from './DecoratorDefinition';
import { ITransformedTreeElement, HandlerTreeNodeType, IHandlerTreeNodeParameter, IHandlerTreeNode } from './HandlerTree';
import { InternalTypeDefinition, InternalTypeUtil } from '../apiManagement/InternalTypes';
import { ITransformContext } from './ITransformContext';
import { ITransformerMetadata, getMetadataValueByDescriptor, BuiltinMetadata } from './TransformerMetadata';
import { Decorator, DecoratorNodeType } from './Decorator';
import { ExpressionWrapper, ParamArgsInitializer } from './ExpressionWrapper';

export class HandlerMethodParameterDecorator extends Decorator<ts.ParameterDeclaration, IParameterDecoratorDefinition> implements IParameterDecoratorDefinition {
	constructor(
		definition: Omit<IParameterDecoratorDefinition, 'decoratorType'>,
	) {
		super({
			...definition,
			decoratorType: DecoratorType.MethodParameter,
		}, DecoratorNodeType.Parameter);
	}

	public get parameterTypeRestrictions() {
		return this.definition.parameterTypeRestrictions;
	}

	public get parameterType() {
		return this.definition.parameterType;
	}

	public get transportTypeId() {
		return this.definition.transportTypeId;
	}

	public getDecoratorTreeElement(parent: IHandlerTreeNode | undefined, node: ts.ParameterDeclaration, decorator: ts.Decorator, context: ITransformContext): ITransformedTreeElement<ts.Decorator> {
		const argumentResult = this.applyArguments(node, decorator, context);
		const decoratorTreeNode: IHandlerTreeNodeParameter = {
			type: HandlerTreeNodeType.HandlerParameter,
			decorator: this.definition,
			children: [],
			parent,
			location: this.getNodeLocation(node),
			paramDef: {
				args: {
					name: getMetadataValueByDescriptor(argumentResult.metadata, BuiltinMetadata.Name),
					optional: getMetadataValueByDescriptor(argumentResult.metadata, BuiltinMetadata.Optional),
					typedef: getMetadataValueByDescriptor(argumentResult.metadata, BuiltinMetadata.Typedef),
					description: getMetadataValueByDescriptor(argumentResult.metadata, BuiltinMetadata.Description),
					initializer: getMetadataValueByDescriptor(argumentResult.metadata, BuiltinMetadata.Initializer),
					regexp: getMetadataValueByDescriptor(argumentResult.metadata, BuiltinMetadata.ValidationRegExp),
					typeref: getMetadataValueByDescriptor(argumentResult.metadata, BuiltinMetadata.Typeref),
					validationFunction: getMetadataValueByDescriptor(argumentResult.metadata, BuiltinMetadata.ValidationFunction),
				},
				parameterIndex: node.parent.parameters.indexOf(node),
				propertyKey: this.getParameterName(node),
				type: this.definition.parameterType,
				transportTypeId: this.transportTypeId,
			},
			metadata: argumentResult.metadata,
		};

		return {
			decoratorTreeNode,
			transformedDecorator: argumentResult.decorator,
		};
	}

	protected * getDefaultMetadataGetters() {
		yield * super.getDefaultMetadataGetters();
		yield (node, decorator, context) => this.getNodeTyperefMetadata(node, decorator, context);
		yield (node, decorator, context) => this.getNodeTypedefMetadata(node, decorator, context);
		yield (node, decorator, context) => this.getNodeOptionalMetadata(node, decorator, context);
		yield (node, decorator, context) => this.getNodeInitializerMetadata(node, decorator, context);
		yield (node, decorator, context) => this.getNodeDescriptionMetadata(node, decorator, context);
		yield (node, decorator, context) => this.getNodeParameterIndexMetadata(node, decorator, context);
		yield (node, decorator, context) => this.getNodePropertyKeyMetadata(node, decorator, context);
	}

	private getNodeTyperefMetadata(node: ts.ParameterDeclaration, decorator: ts.Decorator, context: ITransformContext): ITransformerMetadata {
		let internalType: InternalTypeDefinition = {
			type: 'any',
		};

		if (node.type) {
			const type = context.typeChecker.getTypeFromTypeNode(node.type);
			internalType = context.typeSerializer.getInternalTypeRepresentation(node.type, type);
			if (!internalType) {
				internalType = InternalTypeUtil.TypeAny;
			}
			if (this.parameterTypeRestrictions
				&& !this.parameterTypeRestrictions.find(t => t.type === internalType.type || t.type === 'any')) {
				throw new Error(`Invalid type for decorator '${this.magicFunctionName}': ${internalType.type}`);
			}
		}

		return {
			...BuiltinMetadata.Typedef,
			value: internalType,
		}
	}

	private getNodeTypedefMetadata(node: ts.ParameterDeclaration, decorator: ts.Decorator, context: ITransformContext): ITransformerMetadata {
		if (node.type) {
			const type = context.typeChecker.getTypeFromTypeNode(node.type);
			let internalType = context.typeSerializer.getInternalTypeRepresentation(node.type, type);
			if (!internalType) {
				internalType = InternalTypeUtil.TypeAny;
			}
			if (this.parameterTypeRestrictions
				&& !this.parameterTypeRestrictions.find(t => t.type === internalType.type || t.type === 'any')) {
				throw new Error(`Invalid type for decorator '${this.magicFunctionName}': ${internalType.type}`);
			}

			if (internalType.type === 'object' && type.isClass() && ts.isTypeReferenceNode(node.type)) {
				if (ts.isIdentifier(node.type.typeName)) {
					return {
						...BuiltinMetadata.Typeref,
						value: new ExpressionWrapper(node.type.typeName),
					}
				}
			}
		}
	}

	private getNodeOptionalMetadata(node: ts.ParameterDeclaration, decorator: ts.Decorator, context: ITransformContext): ITransformerMetadata {
		let optional: boolean = !!node.questionToken;
		if (optional) {
			return {
				...BuiltinMetadata.Optional,
				value: optional,
			}
		}
	}

	private getNodeInitializerMetadata(node: ts.ParameterDeclaration, decorator: ts.Decorator, context: ITransformContext): ITransformerMetadata {
		if (node.initializer) {
			let parenExpr = this.parenthesizeExpression(node.initializer);
			return {
				...BuiltinMetadata.Initializer,
				value: new ExpressionWrapper(ts.createArrowFunction(undefined, undefined, [], undefined, undefined, parenExpr)),
			}
		}
	}

	private getNodeDescriptionMetadata(node: ts.ParameterDeclaration, decorator: ts.Decorator, context: ITransformContext): ITransformerMetadata {
		let description = this.getParamDescription(node);
		if (description) {
			return {
				...BuiltinMetadata.Description,
				value: description,
			}
		}
	}

	private getNodeParameterIndexMetadata(node: ts.ParameterDeclaration, decorator: ts.Decorator, context: ITransformContext): ITransformerMetadata {
		return {
			...BuiltinMetadata.ParameterIndex,
			value: node.parent.parameters.indexOf(node),
		}
	}

	private getNodePropertyKeyMetadata(node: ts.ParameterDeclaration, decorator: ts.Decorator, context: ITransformContext): ITransformerMetadata {
		return {
			...BuiltinMetadata.PropertyKey,
			value: this.getParameterName(node),
		}
	}

	private getParameterName(node: ts.ParameterDeclaration) {
		let name: string;
		if (typeof node.name === 'string') {
			name = node.name;
		} else if (ts.isIdentifier(node.name)) {
			name = node.name.text;
		} else {
			throw new Error('Unknown node name type');
		}

		return name;
	}
	
	private getParamDescription(param: ts.ParameterDeclaration): string | undefined {
		const paramTags = ts.getJSDocParameterTags(param);
		if (paramTags.length) {
			return paramTags[0].comment;
		}

		return undefined;
	}
}
