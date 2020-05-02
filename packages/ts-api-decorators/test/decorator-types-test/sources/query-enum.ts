import { Api, ApiGetMethod, ApiQueryParam } from "../../../src";

enum FilterTypes {
	All = 'all',
	Top = 'top',
}

const enum ConstFilterTypes {
	All = 'all',
	Top = 'top',
}

enum NumFilterTypes {
	All,
	Top,
}

const enum ConstNumFilterTypes {
	All,
	Top,
}

enum MixedFilterTypes {
	All = 0,
	Top = 'string',
}

const enum ConstMixedFilterTypes {
	All = 0,
	Top = 'string',
}

enum SingleValueStringEnum {
	Single = 'single',
}

enum SingleValueNumberEnum {
	Single = 0,
}

@Api
class MyApi {

	@ApiGetMethod<string>('/hello')
	greet(
		@ApiQueryParam() filter?: FilterTypes,
	): string {
		return filter;
	}

	@ApiGetMethod<string>('/helloConst')
	greetConst(
		@ApiQueryParam() filter?: ConstFilterTypes,
	): string {
		return filter;
	}

	@ApiGetMethod<string>('/helloNum')
	greetNum(
		@ApiQueryParam() filter?: NumFilterTypes,
	): string {
		return filter.toString();
	}

	@ApiGetMethod<string>('/helloConstNum')
	greetConstNum(
		@ApiQueryParam() filter?: ConstNumFilterTypes,
	): string {
		return filter.toString();
	}

	@ApiGetMethod<string>('/helloMixed')
	greetMixed(
		@ApiQueryParam() filter?: MixedFilterTypes,
	): string {
		return filter.toString();
	}

	@ApiGetMethod<string>('/helloConstMixed')
	greetConstMixed(
		@ApiQueryParam() filter?: ConstMixedFilterTypes,
	): string {
		return filter.toString();
	}

	@ApiGetMethod<string>('/SingleValueStringEnum')
	greetSingleValueString(
		@ApiQueryParam() filter?: SingleValueStringEnum,
	): string {
		return filter.toString();
	}

	@ApiGetMethod<string>('/SingleValueNumberEnum')
	greetSingleValueNumber(
		@ApiQueryParam() filter?: SingleValueNumberEnum,
	): string {
		return filter.toString();
	}

}