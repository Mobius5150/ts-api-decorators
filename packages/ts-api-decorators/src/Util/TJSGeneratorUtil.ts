import * as tjs from 'typescript-json-schema';

export function TJSDefaultOptions(): tjs.PartialArgs {
	return {
		uniqueNames: true,
		required: true,
		topRef: true,
		excludePrivate: true,
	};
}
