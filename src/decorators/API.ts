import { ManagedApiInternal } from "../apiManagement/ManagedApiInternal";
import { ApiMethod } from "../apiManagement/ApiDefinition";

export type ClassConstructor = {new(...args: any[]): {}};

export type ApiMethodReturnTypePrimitives = void | string | object;

export type ApiMethodReturnType = ApiMethodReturnTypePrimitives | Promise<ApiMethodReturnTypePrimitives>;

export type ApiMethodFunction<T extends object> = (...args: any[]) => ApiMethodReturnType | T;

export function Api<T extends ClassConstructor>(constructor: T) {

}

// export function ApiMethod(
// 	target: object,
// 	propertyKey: string,
// 	descriptor: TypedPropertyDescriptor<ApiMethodReturnType>
// ) {
	
// }

export function ApiGetMethod(route: string) {
	ManagedApiInternal.RegisterApi({
		method: ApiMethod.GET,
		route,
	});
	
	return (
		target: object,
		propertyKey: string,
		descriptor: TypedPropertyDescriptor<ApiMethodReturnType>
	) => {
		
	}
}

export function ApiPostMethod(
	target: object,
	propertyKey: string,
	descriptor: TypedPropertyDescriptor<ApiMethodReturnType>
) {

}

export function ApiPutMethod(
	target: object,
	propertyKey: string,
	descriptor: TypedPropertyDescriptor<ApiMethodReturnType>
) {

}

export function ApiDeleteMethod(
	target: object,
	propertyKey: string,
	descriptor: TypedPropertyDescriptor<ApiMethodReturnType>
) {

}