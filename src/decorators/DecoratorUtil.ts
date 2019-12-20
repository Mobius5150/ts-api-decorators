import "reflect-metadata";

export interface IQueryParamDecoratorDefinition {
	allowableTypes: ('string' | 'number' | 'date' | 'any')[];
	arguments: IDecoratorFunctionArg[];
}

export interface IBodyParamDecoratorDefinition {
	allowableTypes: ('object' | 'string' | 'number' | 'date' | 'any')[];
	arguments: IDecoratorFunctionArg[];
}

export interface IDecoratorFunctionArg {
	type: 'validationFunc' | 'numberMin' | 'numberMax' | 'regexp';
	optional: boolean;
}