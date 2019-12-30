import { IJsonSchema } from "openapi-types";

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
}

export interface __ApiParamArgs extends __ApiParamArgsBase, __ApiParamArgsFuncs {
}

export interface IntrinsicTypeDefinition extends IntrinsicNamedTped {
	type: 'boolean' | 'any';
}

export interface IntrinsicNamedTped {
	typename?: string;
	uniqueTypename?: string;
}

export interface IntrinsicTypeDefinitionString extends IntrinsicNamedTped{
	type: 'string';
	validationRegex?: RegExp;
}

export interface IntrinsicTypeDefinitionNumber extends IntrinsicNamedTped{
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
	| InternalArrayTypeDefinition;

export interface InternalObjectTypeDefinition extends IntrinsicNamedTped{
	type: 'object';
	schema: IJsonSchemaWithRefs;
}

export interface InternalUnionTypeDefinition extends IntrinsicNamedTped{
	type: 'union';
	types: InternalTypeDefinition[];
}

export interface InternalArrayTypeDefinition extends IntrinsicNamedTped{
	type: 'array';
	elementType: InternalTypeDefinition;
}

// TODO: The intersection type will probably yield less-than optimal results or longer validation runtime. Should see if it can be collapased to the single resulting type
export interface InternalIntersectionTypeDefinition extends IntrinsicNamedTped{
	type: 'intersection';
	types: InternalTypeDefinition[];
}

export interface IJsonSchemaWithRefs extends IJsonSchema {
	$ref?: string;
}