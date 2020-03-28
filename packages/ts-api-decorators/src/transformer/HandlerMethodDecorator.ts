import * as ts from 'typescript';
import { IMethodDecoratorDefinition, DecoratorType } from './DecoratorDefinition';
import { ITransformedTreeElement, HandlerTreeNodeType, IHandlerTreeNodeHandler, IHandlerTreeNode } from './HandlerTree';
import { ITransformContext } from './ITransformContext';
import { getMetadataValueByDescriptor, BuiltinMetadata } from './TransformerMetadata';
import { ApiMethod } from '../apiManagement';
import { Decorator, DecoratorNodeType } from './Decorator';

export class HandlerMethodDecorator extends Decorator<ts.MethodDeclaration, IMethodDecoratorDefinition> implements IMethodDecoratorDefinition {
	constructor(
		definition: Omit<IMethodDecoratorDefinition, 'decoratorType'>,
	) {
		super({
			...definition,
			decoratorType: DecoratorType.Method,
		}, DecoratorNodeType.Method);
	}

	public get returnTypeRestriction() {
		return this.definition.returnTypeRestrictions;
	}

	public getDecoratorTreeElement(parent: IHandlerTreeNode | undefined, node: ts.MethodDeclaration, decorator: ts.Decorator, context: ITransformContext): ITransformedTreeElement<ts.Decorator> {
		let argumentResult = this.applyArguments(node, decorator, context);
		const apiMethod = getMetadataValueByDescriptor<ApiMethod>(argumentResult.metadata, BuiltinMetadata.ApiMethod);
		const route = getMetadataValueByDescriptor(argumentResult.metadata, BuiltinMetadata.Route);
		if (typeof apiMethod !== 'string') {
			throw new Error('Handler did not have apiMethod metadata');
		}

		if (typeof route !== 'string') {
			throw new Error('Handler did not have route metadata');
		}

		const decoratorTreeNode: IHandlerTreeNodeHandler = {
			type: HandlerTreeNodeType.Handler,
			decorator: this.definition,
			children: [],
			location: this.getNodeLocation(node),
			apiMethod,
			route,
			parent,
			metadata: argumentResult.metadata,
		};

		decoratorTreeNode.metadata = decoratorTreeNode.metadata.concat(
			context.metadataManager.getApiMetadataForApiMethod(decoratorTreeNode, node, this));
		
		return {
			decoratorTreeNode,
			transformedDecorator: argumentResult.decorator,
		};
	}
}
