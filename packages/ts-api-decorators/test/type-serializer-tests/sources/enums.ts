import { Api, ApiGetMethod, ApiBodyParam, ApiQueryParam } from "../../../src";

enum MyStringEnum {
	A = 'a',
	B = 'b',
}

enum MyNumberEnum {
	A = 0,
	B = 1,
}

@Api
export default class MyApi {
	@ApiGetMethod('/helloStringEnum')
	greetStringEnum(
		@ApiQueryParam() enumParam: MyStringEnum,
	) {
		return enumParam;
	}

	@ApiGetMethod<string>('/helloNumberEnum')
	greetNumberEnum(
		@ApiQueryParam() enumParam: MyNumberEnum,
	): string {
		return enumParam.toString();
	}

	 @ApiGetMethod<string>('/helloNumberEnumInline')
	 greetNumberEnumInline(
		 @ApiQueryParam() enumParam: 2 | 3,
	 ): string {
		 return enumParam.toString();
	 }
}