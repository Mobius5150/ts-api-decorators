import * as ts from 'typescript';
import { IMethodDecoratorDefinition, DecoratorType } from './DecoratorDefinition';
import { ITransformedTreeElement, HandlerTreeNodeType, IHandlerTreeNodeHandlerModifier, IHandlerTreeNode } from './HandlerTree';
import { ITransformContext } from './ITransformContext';
import { Decorator, DecoratorNodeType } from './Decorator';

export class HandlerMethodModifierDecorator extends Decorator<ts.MethodDeclaration, IMethodDecoratorDefinition> implements IMethodDecoratorDefinition {
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
		const decoratorTreeNode: IHandlerTreeNodeHandlerModifier = {
			type: HandlerTreeNodeType.HandlerModifier,
			decorator: this.definition,
			children: [],
			parent,
			location: this.getNodeLocation(node),
			metadata: argumentResult.metadata,
		};
		
		return {
			decoratorTreeNode,
			transformedDecorator: argumentResult.decorator,
		};
	}
}
