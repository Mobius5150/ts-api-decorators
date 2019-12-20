export type ApiParamValidationFunction = (name: string, parsed: any) => void;

export interface __ApiParamArgs {
	name: string;
	typedef: InternalTypeDefinition;
	optional?: boolean;
	initializer?: () => any;
	validationFunction?: ApiParamValidationFunction;
}

export interface IntrinsicTypeDefinition {
	type: 'boolean' | 'any';
}

export interface IntrinsicTypeDefinitionString {
	type: 'string';
	validationRegex?: RegExp;
}

export interface IntrinsicTypeDefinitionNumber {
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

export interface InternalObjectTypeDefinition {
	type: 'object';
	schema: object;
}

export interface InternalUnionTypeDefinition {
	type: 'union';
	types: InternalTypeDefinition[];
}

export interface InternalArrayTypeDefinition {
	type: 'array';
	elementType: InternalTypeDefinition;
}

// TODO: The intersection type will probably yield less-than optimal results or longer validation runtime. Should see if it can be collapased to the single resulting type
export interface InternalIntersectionTypeDefinition {
	type: 'intersection';
	types: InternalTypeDefinition[];
}