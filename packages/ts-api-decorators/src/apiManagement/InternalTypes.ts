import { IJsonSchema } from "openapi-types";
import { ClassConstructor } from "../Util/ClassConstructors";

export type ApiParamValidationFunction = (name: string, parsed: any) => void;

export interface __ApiParamArgsBase {
	name: string;
	typedef: InternalTypeDefinition;
	optional?: boolean;
	description?: string;
}

type Func<T1, R> = (t1: T1) => R;
export interface __ApiParamArgsFuncs {
	initializer?: () => any;
	validationFunction?: ApiParamValidationFunction;
	regexp?: RegExp | Func<string, RegExp>;
	typeref?: ClassConstructor;
}

export interface __ApiParamArgs extends __ApiParamArgsBase, __ApiParamArgsFuncs {
}

export interface IntrinsicTypeDefinition extends IntrinsicNamedType {
	type: 'regex' | 'boolean' | 'any';
}

export interface IntrinsicNamedType {
	typename?: string;
	uniqueTypename?: string;
}

export interface IntrinsicTypeDefinitionString extends IntrinsicNamedType{
	type: 'string';
	validationRegex?: RegExp;
}

export interface IntrinsicTypeDefinitionNumber extends IntrinsicNamedType{
	type: 'number';
	minVal?: number;
	maxVal?: number;
}

export type InternalTypeDefinition =
	IntrinsicTypeDefinition
	| IntrinsicTypeDefinitionString
	| IntrinsicTypeDefinitionNumber
	| InternalObjectTypeDefinition
	| InternalUnionTypeDefinition
	| InternalIntersectionTypeDefinition
	| InternalArrayTypeDefinition
	| InternalDateTypeDefinition
	| InternalFunctionTypeDefinition;

export interface InternalFunctionTypeDefinition extends IntrinsicNamedType {
	type: 'function';
	// TODO: function arguments
}

export interface InternalDateTypeDefinition extends IntrinsicNamedType {
	type: 'date';
}

export interface InternalObjectTypeDefinition extends IntrinsicNamedType {
	type: 'object';
	schema?: IJsonSchemaWithRefs;
}

export interface InternalUnionTypeDefinition extends IntrinsicNamedType {
	type: 'union';
	types: InternalTypeDefinition[];
}

export interface InternalArrayTypeDefinition extends IntrinsicNamedType {
	type: 'array';
	elementType: InternalTypeDefinition;
}

// TODO: The intersection type will probably yield less-than optimal results or longer validation runtime. Should see if it can be collapased to the single resulting type
export interface InternalIntersectionTypeDefinition extends IntrinsicNamedType{
	type: 'intersection';
	types: InternalTypeDefinition[];
}

export interface IJsonSchemaWithRefs extends IJsonSchema {
	$ref?: string;
}

export abstract class InternalTypeUtil {
	public static readonly TypeString: IntrinsicTypeDefinitionString = {
		type: 'string',
	};

	public static readonly TypeNumber: IntrinsicTypeDefinitionNumber = {
		type: 'number',
	};

	public static readonly TypeRegex: IntrinsicTypeDefinition = {
		type: 'regex',
	};

	public static readonly TypeDate: InternalDateTypeDefinition = {
		type: 'date',
	};

	public static readonly TypeBoolean: IntrinsicTypeDefinition = {
		type: 'boolean',
	};

	public static readonly TypeAnyObject: InternalObjectTypeDefinition = {
		type: 'object',
	};

	public static readonly TypeAnyFunction: InternalFunctionTypeDefinition = {
		type: 'function',
	};
}