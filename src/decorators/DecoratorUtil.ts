import "reflect-metadata";
import { QueryParams } from "./QueryParams";

export interface IQueryParamDecoratorDefinition {
	allowableTypes: ('string' | 'number' | 'date' | 'any')[];
	arguments: IDecoratorFunctionArg[];
}

interface IDecoratorFunctionArg {
	type: 'validationFunc' | 'numberMin' | 'numberMax' | 'regexp';
	optional: boolean;
}

export function QueryParamDecorator(d: IQueryParamDecoratorDefinition) {
	return (
		target: object,
		propertyKey: string,
		descriptor: TypedPropertyDescriptor<any>
	) => {
		descriptor.writable = false;
		descriptor.configurable = false;
		Reflect.defineMetadata("queryParamDecorator", d, target, propertyKey);
	}
}

export function GetQueryParamDecorator(param: string): IQueryParamDecoratorDefinition {
	return <IQueryParamDecoratorDefinition>Reflect.getMetadata("queryParamDecorator", QueryParams, param);
}