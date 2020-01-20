export interface IApiMethodDescriptor {
	method: string;
	provider: string;
}

export interface IApiMethodResolver {
	getApiMethod(method: string, provider?: string): IApiMethodDescriptor;
	addApiMethod(descriptor: IApiMethodDescriptor): void;
}