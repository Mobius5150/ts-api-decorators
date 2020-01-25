import * as ts from 'typescript';
import { __ApiParamArgsBase, __ApiParamArgsFuncs } from '../apiManagement/InternalTypes';

export class ExpressionWrapper {
	constructor(public node: ts.Expression) { }
}

export type ExpressionWrappedType<T extends object> = {
	[P in keyof T]?: T[P] | ExpressionWrapper;
}

export type ParamArgsInitializer = __ApiParamArgsBase & ExpressionWrappedType<__ApiParamArgsFuncs>;