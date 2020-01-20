import * as ts from 'typescript';
import { IDecoratorDefinitionBase, IDecoratorArgumentProcessorArgs } from './DecoratorDefinition';
import { ITransformedTreeElement, IHandlerLocation, IHandlerTreeNode } from './HandlerTree';
import { ITransformContext } from './ITransformContext';
import { ITransformerMetadata } from '../TransformerMetadata';

export enum DecoratorNodeType {
	Class,
	Method,
	Parameter,
}

export interface IDecorator<N extends ts.Node = ts.Node> extends IDecoratorDefinitionBase {
	nodeType: DecoratorNodeType;
	getDecoratorTreeElement(parent: IHandlerTreeNode | undefined, node: N, decorator: ts.Decorator, context: ITransformContext): ITransformedTreeElement<ts.Decorator>;
}

export abstract class Decorator<N extends ts.Node, DT extends IDecoratorDefinitionBase> implements IDecorator<N> {
	public get magicFunctionName() {
		return this.definition.magicFunctionName;
	}

	public get indexTs() {
		return this.definition.indexTs;
	}

	public get provider() {
		return this.definition.provider;
	}

	public get decoratorType(): DT['decoratorType'] {
		return this.definition.decoratorType;
	}

	public get dependencies() {
		return this.definition.dependencies;
	}

	public get arguments() {
		return this.definition.arguments;
	}

	public get metadata() {
		return this.definition.metadata || [];
	}

	constructor(
		protected definition: DT,
		public readonly nodeType: DecoratorNodeType,
	) {}

	public abstract getDecoratorTreeElement(parent: IHandlerTreeNode | undefined, node: N, decorator: ts.Decorator, context: ITransformContext): ITransformedTreeElement<ts.Decorator>;

	protected getNodeLocation(node: N): IHandlerLocation {
		const sourceFile = node.getSourceFile();
		const posDetails = sourceFile.getLineAndCharacterOfPosition(node.pos);
		return {
			...posDetails,
			file: sourceFile.fileName,
			position:node.pos,
		}
	}

	protected applyArguments(node: N, decorator: ts.Decorator, context: ITransformContext) {
		if (!ts.isCallExpression(decorator.expression)) {
			return {
				metadata: [],
				decorator,
			};
		}

		let metadata: ITransformerMetadata[] = this.metadata;
		const exprArguments: ts.Expression[] = [];
		for (let index = 0; index < this.arguments.length; ++index) {
			const argDef = this.arguments[index];
			const arg = decorator.expression.arguments[index];
			exprArguments[index] = arg;
			if (typeof arg === 'undefined') {
				if (argDef.optional) {
					if (!argDef.transformer) {
						break;
					}
				} else if (!argDef.optional) {
					throw new Error('Expected argument');
				}
			} else {
				this.checkTypeCompatibility();
			}

			if (argDef.metadataExtractor || argDef.transformer) {
				const processorArgs: IDecoratorArgumentProcessorArgs = {
					node,
					argument: argDef,
					argumentExpression: arg,
					index,
					transformContext: context,
				};

				if (argDef.metadataExtractor) {
					const m = argDef.metadataExtractor(processorArgs);
					if (m) {
						metadata.push(m);
					}
				}

				if (argDef.transformer) {
					let transformed = argDef.transformer(processorArgs);
					if (transformed) {
						exprArguments[index] = transformed;
					}
				}
			}
		}

		const clonedExpression: ts.CallExpression = { ...decorator.expression };
		clonedExpression.arguments = ts.createNodeArray(exprArguments);
		return {
			metadata,
			decorator: ts.createDecorator(clonedExpression),
		}
	}

	protected checkTypeCompatibility() {
		throw new Error("Method not implemented.");
	}

	protected parenthesizeExpression(expression: ts.Expression) {
		return ts.isParenthesizedExpression(expression)
			? expression
			: ts.createParen(expression);
    }
}