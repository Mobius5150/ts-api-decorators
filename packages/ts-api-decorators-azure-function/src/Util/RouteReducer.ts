import { IParseApiResult } from "ts-api-decorators/dist/command/CliCommand";
import { IHandlerTreeNode, isHandlerNode, WalkTreeByType } from "ts-api-decorators/dist/transformer/HandlerTree";
import { BuiltinMetadata, getMetadataValueByDescriptor } from "ts-api-decorators/dist/transformer/TransformerMetadata";
import { IBindingTrigger } from "../generators/Bindings";
import { NArgReducer } from "./NArgReducer";

export abstract class RouteReducer {
	public static reduceFunctionRoutesByPath(api: IParseApiResult) {
		// TODO: Actually check on the binding triggers and parameter types for each method
        const reducer = new NArgReducer<[string, string, ...IBindingTrigger[]], IHandlerTreeNode>();
        for (const route of WalkTreeByType(api.tree, isHandlerNode)) {
            let methodType: string = getMetadataValueByDescriptor(route.metadata, BuiltinMetadata.ApiMethodType);
            if (!methodType) {
                throw new Error(`Unknown http method type: ${methodType}`);
            }

            reducer.add([methodType, route.route], route);
		}
		
		return reducer.getReduced();
	}
}