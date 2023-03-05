import * as ts from 'typescript';
import { InternalTypeDefinition } from '../apiManagement/InternalTypes';
import { ITransformerMetadata, IMetadataDescriptor } from './TransformerMetadata';
import { ITransformContext } from './ITransformContext';
import { ApiParamType, ApiRawBodyParamType } from '../apiManagement/ApiDefinition';
import { Func1 } from '../Util/Func';
import { IHandlerTreeNode } from './HandlerTree';

export enum DecoratorType {
	Class,
	ClassProperty,
	Method,
	MethodParameter,
	Constructor,
	ConstructorParameter,
}

// Decorator type definition
export interface IDecorationFunctionTransformInfoBase {
	magicFunctionName: string;
	indexTs: string;
	provider: string;
}

export enum DecoratorNodeTreeHierarchyType {
	Child,
	Modifier,
}

export interface IDecoratorDefinitionBase extends IDecorationFunctionTransformInfoBase {
	decoratorType: DecoratorType;
	dependencies: Array<IDecoratorDependency | Func1<IHandlerTreeNode, IDecoratorDependency[] | void>>;
	arguments: IDecoratorArgument[];
	metadata?: ITransformerMetadata[];
	isCallExpression?: boolean;
	treeHierarchyType?: DecoratorNodeTreeHierarchyType;
	
	/**
	 * If set, all arguments will be transformed to object keys
	 */
	transformArgumentsToObject?: IMetadataDescriptor[] | boolean;
}

export interface IDecoratorMagicFuncAssignment {
	assignToMagicFuncName(name: string): void;
}

export interface IParameterDecoratorDefinition extends IDecoratorDefinitionBase {
	decoratorType: DecoratorType.MethodParameter | DecoratorType.ConstructorParameter;
	parameterType: ApiParamType;

	/**
	 * If the parameterType is `Transport`, the transport type id
	 */
	transportTypeId?: string;

	/**
	 * If the parameterType is `Custom`, the param id
	 */
	paramId?: string;

	/**
	 * If the parameterType is `RawBody`, the type of raw body
	 */
	bodyType?: ApiRawBodyParamType;

	/**
	 * If set, parameter type must match at least one of the type restrictions
	 */
	parameterTypeRestrictions?: InternalTypeDefinition[];

	/**
	 * If true, the library will not output typeref or typedef metadata
	 */
	skipOutputTypeDefinitions?: boolean;

	/** 
	 * If true, this parameter overrides the return value of the function
	 */
	overrideOutput?: boolean;
}

export interface IClassPropertyDecoratorDefinition extends IDecoratorDefinitionBase {
	decoratorType: DecoratorType.ClassProperty | DecoratorType.ConstructorParameter;

	/**
	 * If set, parameter type must match at least one of the type restrictions
	 */
	memberTypeRestrictions?: InternalTypeDefinition[];
}

export interface IClassDecoratorDefinition extends IDecoratorDefinitionBase {
	decoratorType: DecoratorType.Class;
}

export interface IMethodDecoratorDefinition extends IDecoratorDefinitionBase {
	decoratorType: DecoratorType.Method;

	/**
	 * If set, parameter type must match at least one of the type restrictions
	 */
	returnTypeRestrictions?: InternalTypeDefinition[];
}

export interface IConstructorDecoratorDefinition extends IDecoratorDefinitionBase {
	decoratorType: DecoratorType.Method | DecoratorType.Constructor;
}

export type IDecoratorDefinition =
	IParameterDecoratorDefinition
	| IConstructorDecoratorDefinition
	| IClassPropertyDecoratorDefinition
	| IClassDecoratorDefinition
	| IMethodDecoratorDefinition
;

export enum DecoratorDependencyType {
	NameDependency, // Dependency is on the `name` field of the IDecoratorDefinition.
	ProviderDependency, // Dependency is on the `provider` field of the IDecoratorDefinition.
}

export enum DecoratorDependencyLocation {
	Parent, // Dependency is on a parent of the current decorator
	Peer, // Dependency is on a peer of the current decorator
}

export interface IDecoratorDependency {
	type: DecoratorDependencyType;
	dependency: string;
	location: DecoratorDependencyLocation;
}

export interface IDecoratorArgument {
	type: InternalTypeDefinition;

	/**
	 * Whether the argument is optional. Defaults to false;
	 */
	optional?: boolean; // Defaults to false

	/**
	 * A default value if the argument is not specified.
	 */
	defaultExpression?: ts.Expression;

	/**
	 * Function called to transform the argument
	 */
	transformer?: IDecoratorArgumentTransformerFunction; // Defaults to false

	/**
	 * Function called to extract metadata from the argument
	 */
	metadataExtractor?: IArgumentMetadataExtractorFunction;
}

export interface IDecoratorArgumentProcessorArgs {
	node: ts.Node,
	transformContext: ITransformContext;
	argumentExpression: ts.Expression;
	argument: IDecoratorArgument;
	index: number;
}

export type IDecoratorArgumentTransformerFunction = (args: IDecoratorArgumentProcessorArgs) => ts.Expression | void;

export type IArgumentMetadataExtractorFunction = (args: IDecoratorArgumentProcessorArgs) => ITransformerMetadata | void;