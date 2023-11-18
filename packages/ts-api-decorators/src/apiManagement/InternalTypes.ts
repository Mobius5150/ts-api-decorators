import { IJsonSchema } from "openapi-types";
import { ClassConstructor } from "../Util/ClassConstructors";

export type ApiParamValidationFunction = (name: string, parsed: any) => void;

export interface __ApiParamArgsBase {
	name: string;
	typedef?: InternalTypeDefinition;
	optional?: boolean;
	description?: string;
}

type Func<T1, R> = (t1: T1) => R;
export interface __ApiParamArgsFuncs {
	initializer?: () => any;
	validationFunc?: ApiParamValidationFunction;
	regexp?: RegExp | Func<string, RegExp>;
	typeref?: ClassConstructor;
	numberMin?: number;
	numberMax?: number;
}

export type BuiltinTypeNames = 'Buffer' | 'Promise';

export interface __ApiParamArgs extends __ApiParamArgsBase, __ApiParamArgsFuncs {
}

export interface IntrinsicTypeDefinition extends IntrinsicNamedType {
	type: 'regex' | 'boolean' | 'void' | 'any';
}

export interface IntrinsicNamedType {
	typename?: string;
	uniqueTypename?: string;
}

export interface IntrinsicTypeDefinitionString extends IntrinsicNamedType{
	type: 'string';
	validationRegex?: RegExp;
	schema?: { enum?: string[]; } | { const?: string; };
	typename?: string;
}

export interface IntrinsicTypeDefinitionNumber extends IntrinsicNamedType{
	type: 'number';
	schema?: { enum?: number[]; } | { const?: number; };
	typename?: string;
}

export type InternalTypeDefinition =
	IntrinsicTypeDefinition
	| IntrinsicTypeDefinitionString
	| IntrinsicTypeDefinitionNumber
	| InternalObjectTypeDefinition
	| InternalExternalSchemaTypeDefinition
	| InternalBuiltinObjectTypeDefinition
	| InternalUnionTypeDefinition
	| InternalIntersectionTypeDefinition
	| InternalArrayTypeDefinition
	| InternalDateTypeDefinition
	| InternalFunctionTypeDefinition
	| InternalEnumTypeDefinition;

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

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }
export interface InternalExternalSchemaTypeDefinition extends IntrinsicNamedType {
	type: 'external';
	schema: WithRequired<IJsonSchemaWithRefs, '$schema'>;
}

export interface InternalEnumTypeDefinition extends IntrinsicNamedType {
	type: 'enum';
	schema?: { enum?: Array<string | number>; };
	typename?: string;
}

export interface InternalBuiltinObjectTypeDefinition extends IntrinsicNamedType {
	type: BuiltinTypeNames;
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

	public static readonly TypeEnum: InternalEnumTypeDefinition = {
		type: 'enum',
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

	public static readonly TypeAnyArray: InternalArrayTypeDefinition = {
		type: 'array',
		elementType: {
			type: 'any',
		},
	};

	public static readonly TypeNumberArray: InternalArrayTypeDefinition = {
		type: 'array',
		elementType: {
			type: 'number',
		},
	};

	public static readonly TypeAnyFunction: InternalFunctionTypeDefinition = {
		type: 'function',
	};

	public static readonly TypeAny: IntrinsicTypeDefinition = {
		type: 'any',
	};

	public static readonly TypeBuffer: InternalBuiltinObjectTypeDefinition = {
		type: 'Buffer',
	};
}