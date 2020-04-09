import * as ts from 'typescript';
import { IClassDecoratorDefinition, DecoratorType } from './DecoratorDefinition';
import { ITransformedTreeElement, HandlerTreeNodeType, IHandlerTreeNode, IHandlerTreeNodeHandlerCollection } from './HandlerTree';
import { Decorator, DecoratorNodeType } from './Decorator';
import { ITransformContext } from './ITransformContext';

export class ClassDecorator extends Decorator<ts.ClassDeclaration, IClassDecoratorDefinition> implements IClassDecoratorDefinition {
	public constructor(
		definition: Omit<IClassDecoratorDefinition, 'decoratorType'>,
		private treeNodeType: HandlerTreeNodeType.HandlerCollection | HandlerTreeNodeType.Dependency,
	) {
		super({
			...definition,
			decoratorType: DecoratorType.Class,
		}, DecoratorNodeType.Class);
	}
	
	public getDecoratorTreeElement(parent: IHandlerTreeNode | undefined, node: ts.ClassDeclaration, decorator: ts.Decorator, context: ITransformContext): ITransformedTreeElement<ts.Decorator> {
		let argumentResult = this.applyArguments(node, decorator, context);
		const decoratorResponse = {
			transformedDecorator: argumentResult.decorator,
			decoratorTreeNode: <IHandlerTreeNodeHandlerCollection>{
				type: this.treeNodeType,
				decorator: this.definition,
				children: [],
				location: this.getNodeLocation(node),
				parent,
				metadata: argumentResult.metadata,
			}
		};

		decoratorResponse.decoratorTreeNode.metadata = decoratorResponse.decoratorTreeNode.metadata.concat(
			context.metadataManager.getApiMetadataForApiMethodCollection(decoratorResponse.decoratorTreeNode, node, this));

		return decoratorResponse;
	}
}