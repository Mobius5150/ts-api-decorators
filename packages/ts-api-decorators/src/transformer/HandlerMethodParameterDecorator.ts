import * as ts from 'typescript';
import { IParameterDecoratorDefinition, DecoratorType, IDecoratorMagicFuncAssignment } from './DecoratorDefinition';
import { ITransformedTreeElement, HandlerTreeNodeType, IHandlerTreeNodeParameter, IHandlerTreeNode } from './HandlerTree';
import { InternalObjectTypeDefinition, InternalTypeDefinition, InternalTypeUtil, __ApiParamArgs } from '../apiManagement/InternalTypes';
import { ITransformContext } from './ITransformContext';
import { ITransformerMetadata, getMetadataValueByDescriptor, BuiltinMetadata } from './TransformerMetadata';
import { Decorator, DecoratorNodeType } from './Decorator';
import { ExpressionWrapper, ParamArgsInitializer } from './ExpressionWrapper';
import { CompilationError } from '../Util/CompilationError';
import { IApiParamDefinition } from '../apiManagement/ApiDefinition';
import { TypeSerializer } from './TypeSerializer';

export class HandlerMethodParameterDecorator
	extends Decorator<ts.ParameterDeclaration, IParameterDecoratorDefinition>
	implements IParameterDecoratorDefinition
{
	constructor(definition: Omit<IParameterDecoratorDefinition, 'decoratorType'>) {
		super(
			{
				...definition,
				decoratorType: DecoratorType.MethodParameter,
			},
			DecoratorNodeType.Parameter,
		);
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

	public get paramId() {
		return this.definition.paramId;
	}

	public get bodyType() {
		return this.definition.bodyType;
	}

	public get skipOutputTypeDefinitions() {
		return !!this.definition.skipOutputTypeDefinitions;
	}

	public get overrideOutput() {
		return !!this.definition.overrideOutput;
	}

	public get isDestructuredObject() {
		return !!this.definition.isDestructuredObject;
	}

	public getDecoratorTreeElement(
		parent: IHandlerTreeNode | undefined,
		node: ts.ParameterDeclaration,
		decorator: ts.Decorator,
		context: ITransformContext,
	): ITransformedTreeElement<ts.Decorator> {
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
					validationFunc: getMetadataValueByDescriptor(argumentResult.metadata, BuiltinMetadata.ValidationFunction),
					properties: getMetadataValueByDescriptor(argumentResult.metadata, BuiltinMetadata.DestructuredObjectProperties),
				},
				parameterIndex: node.parent.parameters.indexOf(node),
				propertyKey: this.getParameterName(node),
				type: this.definition.parameterType,
				transportTypeId: this.transportTypeId,
				paramId: this.paramId,
				bodyType: this.bodyType,
				overrideOutput: this.overrideOutput,
				isDestructuredObject: this.isDestructuredObject,
			} as IApiParamDefinition,
			metadata: argumentResult.metadata,
		};

		decoratorTreeNode.metadata = decoratorTreeNode.metadata.concat(context.metadataManager.getApiMetadataForApiMethodParam(decoratorTreeNode, node, this));

		return {
			decoratorTreeNode,
			transformedDecorator: argumentResult.decorator,
		};
	}

	protected *getDefaultMetadataGetters() {
		yield* super.getDefaultMetadataGetters();
		yield (node, decorator, context) => this.getNodeTyperefMetadata(node, decorator, context);
		yield (node, decorator, context) => this.getNodeTypedefMetadata(node, decorator, context);
		yield (node, decorator, context) => this.getNodeDestructuredPropertiesMetadata(node, decorator, context);
		yield (node, decorator, context) => this.getNodeOptionalMetadata(node, decorator, context);
		yield (node, decorator, context) => this.getNodeInitializerMetadata(node, decorator, context);
		yield (node, decorator, context) => this.getNodeDescriptionMetadata(node, decorator, context);
		yield (node, decorator, context) => this.getNodeParameterIndexMetadata(node, decorator, context);
		yield (node, decorator, context) => this.getNodePropertyKeyMetadata(node, decorator, context);
	}

	private getNodeTyperefMetadata(node: ts.ParameterDeclaration, decorator: ts.Decorator, context: ITransformContext): ITransformerMetadata {
		if (this.skipOutputTypeDefinitions) {
			return;
		}

		let internalType: InternalTypeDefinition = {
			type: 'any',
		};

		if (node.type) {
			const type = context.typeChecker.getTypeFromTypeNode(node.type);
			internalType = context.typeSerializer.getInternalTypeRepresentation(node.type, type);
			if (!internalType) {
				internalType = InternalTypeUtil.TypeAny;
			}
			if (this.parameterTypeRestrictions) {
				const typedef = this.parameterTypeRestrictions.find((t) => t.type === internalType.type || t.type === 'any');
				if (!typedef) {
					throw new CompilationError(`Invalid type for decorator '${this.magicFunctionName}': ${internalType.type}`, node);
				}

				if (typedef.assertValid) {
					typedef.assertValid(internalType, node);
				}
			}
		}

		return {
			...BuiltinMetadata.Typedef,
			value: internalType,
		};
	}

	private getNodeTypedefMetadata(node: ts.ParameterDeclaration, decorator: ts.Decorator, context: ITransformContext): ITransformerMetadata {
		if (this.skipOutputTypeDefinitions) {
			return;
		}

		if (node.type) {
			const type = context.typeChecker.getTypeFromTypeNode(node.type);
			let internalType = context.typeSerializer.getInternalTypeRepresentation(node.type, type);
			if (!internalType) {
				internalType = InternalTypeUtil.TypeAny;
			}
			if (this.parameterTypeRestrictions && !this.parameterTypeRestrictions.find((t) => t.type === internalType.type || t.type === 'any')) {
				throw new CompilationError(`Invalid type for decorator '${this.magicFunctionName}': ${internalType.type}`, node);
			}

			if (internalType.type === 'object' && type.isClass() && ts.isTypeReferenceNode(node.type)) {
				if (ts.isIdentifier(node.type.typeName)) {
					return {
						...BuiltinMetadata.Typeref,
						value: new ExpressionWrapper(node.type.typeName),
					};
				}
			}
		}
	}

	private getNodeDestructuredPropertiesMetadata(node: ts.ParameterDeclaration, decorator: ts.Decorator, context: ITransformContext): ITransformerMetadata {
		if (!this.isDestructuredObject) {
			return;
		}

		let internalType: InternalObjectTypeDefinition = {
			type: 'object',
		};

		if (node.type) {
			const type = context.typeChecker.getTypeFromTypeNode(node.type);
			internalType = context.typeSerializer.getInternalTypeRepresentation(node.type, type) as InternalObjectTypeDefinition;
			if (!internalType) {
				throw new CompilationError(`Invalid type for decorator '${this.magicFunctionName}': any`, node);
			}

			if (internalType.type !== 'object') {
				throw new CompilationError(`Invalid type for decorator '${this.magicFunctionName}': ${internalType.type}`, node);
			}

			if (this.parameterTypeRestrictions) {
				const typedef = this.parameterTypeRestrictions.find((t) => t.type === internalType.type || t.type === 'any');
				if (!typedef) {
					throw new CompilationError(`Invalid type for decorator '${this.magicFunctionName}': ${internalType.type}`, node);
				}

				if (typedef.assertValid) {
					typedef.assertValid(internalType, node);
				}
			}
		}

		if (internalType.type !== 'object') {
			throw new CompilationError(`Invalid type for decorator '${this.magicFunctionName}': ${internalType.type}`, node);
		}

		let schema = internalType.schema;
		if (schema.$ref) {
			const ref = TypeSerializer.getRefDefName(schema.$ref);
			const def = schema.definitions[ref];
			if (!def) {
				throw new CompilationError(`Invalid type definition: schema reference '${schema.$ref}' not found`, node);
			}

			schema = {
				...schema,
				...def,
			};
		}

		if (schema?.type !== 'object') {
			throw new CompilationError('Invalid type definition: expected object', node);
		}
		if (!schema?.properties) {
			throw new CompilationError(
				`Could not determine property types for destructured object decorator '${this.magicFunctionName}': ${internalType.type}`,
				node,
			);
		}

		const value: __ApiParamArgs[] = Object.entries(schema.properties).map(([n, p]) => {
			const prop: __ApiParamArgs = {
				name: n,
				optional: !schema.required?.includes(n),
				typedef: {
					type: 'object',
					schema: p,
				},
			};

			return prop;
		});

		return {
			...BuiltinMetadata.DestructuredObjectProperties,
			value,
		};
	}

	private getNodeOptionalMetadata(node: ts.ParameterDeclaration, decorator: ts.Decorator, context: ITransformContext): ITransformerMetadata {
		let optional: boolean = !!node.questionToken;
		if (optional) {
			return {
				...BuiltinMetadata.Optional,
				value: optional,
			};
		}
	}

	private getNodeInitializerMetadata(node: ts.ParameterDeclaration, decorator: ts.Decorator, context: ITransformContext): ITransformerMetadata {
		if (node.initializer) {
			let parenExpr = this.parenthesizeExpression(node.initializer);
			return {
				...BuiltinMetadata.Initializer,
				value: new ExpressionWrapper(ts.factory.createArrowFunction(undefined, undefined, [], undefined, undefined, parenExpr)),
			};
		}
	}

	private getNodeDescriptionMetadata(node: ts.ParameterDeclaration, decorator: ts.Decorator, context: ITransformContext): ITransformerMetadata {
		let description = this.getParamDescription(node);
		if (description) {
			return {
				...BuiltinMetadata.Description,
				value: description,
			};
		}
	}

	private getNodeParameterIndexMetadata(node: ts.ParameterDeclaration, decorator: ts.Decorator, context: ITransformContext): ITransformerMetadata {
		return {
			...BuiltinMetadata.ParameterIndex,
			value: node.parent.parameters.indexOf(node),
		};
	}

	private getNodePropertyKeyMetadata(node: ts.ParameterDeclaration, decorator: ts.Decorator, context: ITransformContext): ITransformerMetadata {
		return {
			...BuiltinMetadata.PropertyKey,
			value: this.getParameterName(node),
		};
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
			return typeof paramTags[0].comment === 'string' ? paramTags[0].comment : paramTags[0].comment?.map((c) => c.text).join(' ');
		}

		return undefined;
	}
}
