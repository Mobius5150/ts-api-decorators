import * as ts from 'typescript';
import { IParameterDecoratorDefinition, DecoratorType } from './DecoratorDefinition';
import { ITransformedTreeElement, HandlerTreeNodeType, IHandlerTreeNodeParameter, IHandlerTreeNode } from './HandlerTree';
import { InternalTypeDefinition } from '../../apiManagement/InternalTypes';
import { ITransformContext } from './ITransformContext';
import { ITransformerMetadata, getMetadataValueByDescriptor } from '../TransformerMetadata';
import { ExpressionWrapper, ParamArgsInitializer } from '../DecoratorTransformer';
import { Decorator, DecoratorNodeType } from './Decorator';

export class HandlerMethodParameterDecorator extends Decorator<ts.ParameterDeclaration, IParameterDecoratorDefinition> implements IParameterDecoratorDefinition {
	constructor(
		definition: Omit<IParameterDecoratorDefinition, 'decoratorType'>,
	) {
		super({
			...definition,
			decoratorType: DecoratorType.MethodParameter,
		}, DecoratorNodeType.Method);
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
		const paramArgs = this.getParamArgs(node, argumentResult.metadata, context);
		const decoratorTreeNode: IHandlerTreeNodeParameter = {
			type: HandlerTreeNodeType.HandlerParameter,
			decorator: this.definition,
			children: [],
			parent,
			location: this.getNodeLocation(node),
			paramDef: {
				args: paramArgs,
				parameterIndex: node.parent.parameters.indexOf(node),
				propertyKey: this.getParameterName(node),
				type: this.definition.parameterType,
				transportTypeId: this.transportTypeId,
			},
		};

		let outputDecorator: ts.Decorator = argumentResult.decorator;
		if (this.definition.transformArgumentsToObject) {
			if (!ts.isCallExpression(outputDecorator)) {
				throw new Error('When transforming arguments to object, decorator must be a call expression');
			}

			if (Array.isArray(this.definition.transformArgumentsToObject)) {
				for (const descr of this.definition.transformArgumentsToObject) {
					if (!descr.key) {
						throw new Error('When transforming param args to object, descriptor must have key set');
					}

					paramArgs[descr.key] = getMetadataValueByDescriptor(argumentResult.metadata, descr);
				}
			} else {
				for (const metadata of argumentResult.metadata) {
					if (!metadata.key) {
						continue;
					}
					paramArgs[metadata.key] = metadata.value;
				}
			}

			(<ts.CallExpression>outputDecorator.expression).arguments = ts.createNodeArray([context.typeSerializer.objectToLiteral(paramArgs)]);
		}

		return {
			decoratorTreeNode,
			transformedDecorator: argumentResult.decorator,
		};
	}

	private getParamArgs(node: ts.ParameterDeclaration, argumentMetadata: ITransformerMetadata[], context: ITransformContext) {
		let internalType: InternalTypeDefinition = {
			type: 'any',
		};

		let typeref: ExpressionWrapper = null;
		if (node.type) {
			const type = context.typeChecker.getTypeFromTypeNode(node.type);
			internalType = context.typeSerializer.getInternalTypeRepresentation(node.type, type);
			if (!this.parameterTypeRestrictions
				|| !this.parameterTypeRestrictions.find(t => t.type === internalType.type || t.type === 'any')) {
				throw new Error('Invalid type for decorator: ' + internalType.type);
			}

			if (internalType.type === 'object' && type.isClass() && ts.isTypeReferenceNode(node.type)) {
				if (ts.isIdentifier(node.type.typeName)) {
					typeref = new ExpressionWrapper(node.type.typeName);
				}
			}
		}

		// Parse argument name
		let name: string = this.getParameterName(node);

		// Parse initializer
		let initializer: ts.Expression | undefined;
		if (node.initializer) {
			// Only wrap the expression if it's not already parenthesized
			let parenExpr = this.parenthesizeExpression(node.initializer);
			initializer = ts.createArrowFunction(undefined, undefined, [], undefined, undefined, parenExpr);
		}

		// Parse optional
		let optional: boolean = !!node.questionToken;

		// Construct param decorator args
		const args: ParamArgsInitializer = {
			name,
			typedef: internalType,
		};

		let description = this.getParamDescription(node);
		if (description) {
			args.description = description;
		}

		if (optional) {
			args.optional = optional;
		}

		if (typeref) {
			args.typeref = typeref;
		}

		if (initializer) {
			args.initializer = new ExpressionWrapper(initializer);
		}

		return args;
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
