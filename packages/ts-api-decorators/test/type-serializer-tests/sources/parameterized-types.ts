import { Api, ApiGetMethod } from '../../../src';

interface IResponse<P extends object> {
	response: P;
}

interface IResponseBody {
	greeting: string;
}

interface IHiddenResponse {
	response: IResponse<IResponseBody>;
}

type ComplexAliasType = Pick<IResponseBody & IHiddenResponse, 'greeting'> & Partial<IResponse<object>>;

@Api
export default class MyApi {
	@ApiGetMethod<IResponse<IResponseBody>>('/hello')
	greet(): IResponse<IResponseBody> {
		return {
			response: {
				greeting: 'hello',
			},
		};
	}

	@ApiGetMethod<IHiddenResponse>('/helloHidden')
	greetHidden(): IHiddenResponse {
		return {
			response: {
				response: {
					greeting: 'hello',
				},
			},
		};
	}

	@ApiGetMethod<ComplexAliasType>('/helloComplex')
	greetComplex(): ComplexAliasType {
		return {
			greeting: 'hello',
		};
	}
}
