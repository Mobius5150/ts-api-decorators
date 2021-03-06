import { ApiMethod } from "..";
import { IHandlerTreeNodeHandler, HandlerTreeNodeType, IHandlerTreeNodeParameter, IHandlerTreeNodeRoot, IHandlerTreeNodeHandlerCollection } from "../transformer/HandlerTree";
import { IMetadataDescriptor, ITransformerMetadata } from "../transformer/TransformerMetadata";
import { IApiParamDefinition, ApiParamType } from "../apiManagement/ApiDefinition";
import { __ApiParamArgs } from "../apiManagement/InternalTypes";

type DeepPartial<T> = {
[P in keyof T]?: T[P] extends Array<infer U>
	? Array<DeepPartial<U>>
	: T[P] extends ReadonlyArray<infer U>
	? ReadonlyArray<DeepPartial<U>>
	: DeepPartial<T[P]>
};

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
