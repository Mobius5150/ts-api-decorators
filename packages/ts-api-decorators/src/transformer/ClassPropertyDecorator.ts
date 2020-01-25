import * as ts from 'typescript';
import { DecoratorType, IClassPropertyDecoratorDefinition } from './DecoratorDefinition';
import { ITransformedTreeElement, HandlerTreeNodeType, IHandlerTreeNode } from './HandlerTree';
import { Decorator, DecoratorNodeType } from './Decorator';
import { ITransformContext } from './ITransformContext';
import { ITransformerMetadata, BuiltinMetadata } from './TransformerMetadata';
import { InternalTypeDefinition } from '../apiManagement/InternalTypes';
import { ExpressionWrapper } from './ExpressionWrapper';

export class ClassPropertyDecorator extends Decorator<ts.PropertyDeclaration, IClassPropertyDecoratorDefinition> implements IClassPropertyDecoratorDefinition {
	public constructor(
		definition: Omit<IClassPropertyDecoratorDefinition, 'decoratorType'>,
	) {
		super({
			...definition,
			decoratorType: DecoratorType.ClassProperty,
		}, DecoratorNodeType.ClassProperty);
	}

	public get memberTypeRestrictions() {
		return this.definition.memberTypeRestrictions;
	}
	
	public getDecoratorTreeElement(parent: IHandlerTreeNode | undefined, node: ts.PropertyDeclaration, decorator: ts.Decorator, context: ITransformContext): ITransformedTreeElement<ts.Decorator> {
		let argumentResult = this.applyArguments(node, decorator, context);
		return {
			transformedDecorator: argumentResult.decorator,
			decoratorTreeNode: {
				type: HandlerTreeNodeType.DependencyProperty,
				decorator: this.definition,
				children: [],
				location: this.getNodeLocation(node),
				parent,
				metadata: argumentResult.metadata,
			}
		};
	}

	protected * getDefaultMetadataGetters() {
		yield * super.getDefaultMetadataGetters();
		yield (node, decorator, context) => this.getNodeTyperefMetadata(node, decorator, context);
		yield (node, decorator, context) => this.getNodeTypedefMetadata(node, decorator, context);
		yield (node, decorator, context) => this.getNodeOptionalMetadata(node, decorator, context);
		yield (node, decorator, context) => this.getNodeInitializerMetadata(node, decorator, context);
	}

	private getNodeTyperefMetadata(node: ts.PropertyDeclaration, decorator: ts.Decorator, context: ITransformContext): ITransformerMetadata {
		let internalType: InternalTypeDefinition = {
			type: 'any',
		};

		if (node.type) {
			const type = context.typeChecker.getTypeFromTypeNode(node.type);
			internalType = context.typeSerializer.getInternalTypeRepresentation(node.type, type);
			if (this.memberTypeRestrictions
				&& !this.memberTypeRestrictions.find(t => t.type === internalType.type || t.type === 'any')) {
				throw new Error('Invalid type for decorator: ' + internalType.type);
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
			if (this.memberTypeRestrictions
				&& !this.memberTypeRestrictions.find(t => t.type === internalType.type || t.type === 'any')) {
				throw new Error('Invalid type for decorator: ' + internalType.type);
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
}
