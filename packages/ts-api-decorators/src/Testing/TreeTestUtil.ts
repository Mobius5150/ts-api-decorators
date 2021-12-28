import { ApiMethod } from "..";
import { IHandlerTreeNodeHandler, HandlerTreeNodeType, IHandlerTreeNodeParameter, IHandlerTreeNodeRoot, IHandlerTreeNodeHandlerCollection } from "../transformer/HandlerTree";
import { IMetadataDescriptor, ITransformerMetadata } from "../transformer/TransformerMetadata";
import { IApiParamDefinition, ApiParamType } from "../apiManagement/ApiDefinition";
import { __ApiParamArgs } from "../apiManagement/InternalTypes";
import { ArgMatcherFunction, IIncludeMatchContext, validateOrSetMatch } from "./TestUtil";

type OptionalPropertyMatcher<T> = T | ArgMatcherFunction<T>;

export type DeepPartial<T> = OptionalPropertyMatcher<{
[P in keyof T]?: T[P] extends Array<infer U>
	? OptionalPropertyMatcher<Array<DeepPartial<U>>>
	: T[P] extends ReadonlyArray<infer U>
	? OptionalPropertyMatcher<ReadonlyArray<DeepPartial<U>>>
	: OptionalPropertyMatcher<DeepPartial<T[P]>>
}>;

/**
 * During type testing, we encounter paths like '#/definitions/{definitionName}.<some random hex characters>'
 * 
 * We wanted to check that the whole string starts with `#/definitions/{definitionName}` and then memorize everything after `#/definitions/` and assign it to the `symbol` in the context
 * checker for the real include checker.
 * @param value 
 * @param symbol 
 * @param definitionName 
 * @param ctx 
 * @param defRoot 
 * @returns 
 */
export function definitionPathWithSymbolChecker(value: string, symbol: Symbol, definitionName: string, ctx: IIncludeMatchContext, defRoot: string = '#/definitions/'): boolean {
	if (!value.startsWith(`${defRoot}${definitionName}`)) {
		return false;
	}

	validateOrSetMatch(symbol, value.substring(defRoot.length), ctx);
	return true;
}

export function treeRootNode(children?: DeepPartial<IHandlerTreeNodeHandler['children']>, metadata?: DeepPartial<IHandlerTreeNodeHandler['metadata']>): DeepPartial<IHandlerTreeNodeRoot> {
	return {
		type: HandlerTreeNodeType.Root,
		...(children ? { children, } : {}),
		...(metadata ? { metadata, } : {}),
	}
}

export function treeHandlerMethodCollectionNode(children?: DeepPartial<IHandlerTreeNodeHandler['children']>, metadata?: DeepPartial<IHandlerTreeNodeHandler['metadata']>): DeepPartial<IHandlerTreeNodeHandlerCollection> {
	return {
		type: HandlerTreeNodeType.HandlerCollection,
		...(children ? { children, } : {}),
		...(metadata ? { metadata, } : {}),
	}
}

export function treeHandlerMethodNode(method: ApiMethod, route: string, children?: DeepPartial<IHandlerTreeNodeHandler['children']>, metadata?: DeepPartial<IHandlerTreeNodeHandler['metadata']>): DeepPartial<IHandlerTreeNodeHandler> {
	return {
		apiMethod: method,
		route,
		type: HandlerTreeNodeType.Handler,
		...(children ? { children, } : {}),
		...(metadata ? { metadata, } : {}),
	}
}

export function treeNodeMetadata(descriptor: DeepPartial<IMetadataDescriptor>, value?: any): DeepPartial<ITransformerMetadata> {
	return {
		...descriptor,
		...(value ? { value, } : {}),
	}
}

export function treeHandlerParameterNode(paramDef: DeepPartial<IApiParamDefinition>, children?: DeepPartial<IHandlerTreeNodeHandler['children']>, metadata?: DeepPartial<IHandlerTreeNodeHandler['metadata']>): DeepPartial<IHandlerTreeNodeParameter> {
	return {
		paramDef: <IApiParamDefinition>paramDef,
		type: HandlerTreeNodeType.HandlerParameter,
		...(children ? { children, } : {}),
		...(metadata ? { metadata, } : {}),
	}
}
