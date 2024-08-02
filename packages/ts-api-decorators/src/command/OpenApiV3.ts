import { IApiParamDefinition, ApiParamType } from '../apiManagement/ApiDefinition';
import { IExtractor } from './IExtractor';
import { OpenAPIV3, IJsonSchema as _IJsonSchema } from 'openapi-types';
import { getMetadataValue, IMetadataType, getAllMetadataValues, getMetadataValueByDescriptor, BuiltinMetadata } from '../transformer/TransformerMetadata';
import { OpenApiMetadataType } from '../transformer/OpenApi';
import * as yaml from 'js-yaml';
import { IProgramInfo } from './IProgramInfo';
import {
	InternalTypeDefinition,
	IJsonSchemaWithRefs,
	InternalEnumTypeDefinition,
	InternalObjectTypeDefinition,
	IntrinsicTypeDefinitionNumber,
	IntrinsicTypeDefinitionString,
} from '../apiManagement/InternalTypes';
import { IExtractedTag } from '../transformer/IExtractedTag';
import {
	IHandlerTreeNodeRoot,
	IHandlerTreeNodeHandler,
	WalkChildrenByType,
	isHandlerParameterNode,
	IHandlerTreeNodeParameter,
	WalkTreeByType,
	isHandlerNode,
	HandlerTreeNodeType,
} from '../transformer/HandlerTree';
import { ManagedApi, ApiMimeType } from '../apiManagement';
import { deepEqual } from 'assert';

export interface IOpenApiV3Opts {
	disableTryInferSchemes?: boolean;

	/**
	 * additionalProperties defaults to `true` so it shouldn't need to be outputted manually
	 * and may cause problems with some tools (e.g. autorest)
	 */
	outputAdditionalPropertiesTrue?: boolean;
	yamlOpts?: yaml.DumpOptions;
}

type IJsonSchema = Omit<_IJsonSchema, ''>;

export class NetRefCtx {
	private map: Map<string, ReassignableString> = new Map();
	private oldRefs: Set<string> = new Set();
	public existingOrNewRef(value: string | ReassignableString): ReassignableString {
		if (value instanceof ReassignableString || typeof value !== 'string') {
			value = value.valueOf();
		}

		if (!this.map.has(value)) {
			this.map.set(value, new ReassignableString(this, value));
		}

		return this.map.get(value)!;
	}

	public setRef(oldRef: string, newRef: ReassignableString) {
		this.map.set(oldRef.valueOf(), newRef);
		this.oldRefs.add(oldRef);
	}

	public clearOldRefs() {
		for (let ref of this.oldRefs) {
			this.map.delete(ref);
		}

		this.oldRefs.clear();
	}
}

export class ReassignableString extends String {
	protected internalRef: string;
	public constructor(private ctx: NetRefCtx | undefined, value: string) {
		super();
		let self = this;
		this.internalRef = (value as any) instanceof ReassignableString ? (value as unknown as ReassignableString).internalRef.valueOf() : value;
		this.ctx?.setRef(this.internalRef, this);

		return new Proxy(this, {
			get(target, prop) {
				if (typeof prop === 'symbol') {
					return target[prop];
				}

				if (Number(prop) == (prop as any) && !(prop in target)) {
					return self.internalRef[prop];
				}

				return target[prop];
			},
		});
	}

	private handlers: { [evt: string]: ((newVal: ReassignableString) => void)[] } = {};
	public on(evt: 'change', handler: (newVal: ReassignableString) => void) {
		if (!this.handlers[evt]) {
			this.handlers[evt] = [];
		}

		this.handlers[evt].push(handler);
	}

	public setValue(newVal: string | ReassignableString) {
		if (newVal instanceof ReassignableString) {
			newVal = newVal.internalRef;
		}

		this.ctx?.setRef(newVal, this);
		this.internalRef = newVal;
		if (this.handlers['change']) {
			for (let handler of this.handlers['change']) {
				handler(this);
			}
		}
	}

	public toString() {
		return this.internalRef.valueOf();
	}

	public strCast() {
		return this as any as string;
	}

	public toJSON() {
		return this.internalRef.valueOf();
	}

	public valueOf() {
		return this.internalRef.valueOf();
	}

	public [Symbol.toPrimitive](hint: string) {
		return this.internalRef.valueOf();
	}

	public [Symbol.toStringTag] = 'NetRef';

	public static fromString(ctx: NetRefCtx | undefined, value: string | ReassignableString) {
		if (value instanceof ReassignableString) {
			return value;
		}

		if (!ctx) {
			return new ReassignableString(undefined, value);
		}

		return ctx.existingOrNewRef(value);
	}

	public at(index: number): string | undefined {
		return this.internalRef[index];
	}

	public get length() {
		return this.internalRef.length;
	}

	public charAt(index: number) {
		return this.internalRef.charAt(index);
	}

	public charCodeAt(index: number) {
		return this.internalRef.charCodeAt(index);
	}

	public concat(...strings: string[]) {
		return this.internalRef.concat(...strings);
	}

	public includes(searchString: string, position?: number) {
		return this.internalRef.includes(searchString, position);
	}

	public endsWith(searchString: string, length?: number) {
		return this.internalRef.endsWith(searchString, length);
	}

	public indexOf(searchString: string, position?: number) {
		return this.internalRef.indexOf(searchString, position);
	}

	public lastIndexOf(searchString: string, position?: number) {
		return this.internalRef.lastIndexOf(searchString, position);
	}

	public localeCompare(that: string, locales?: string | string[], options?: Intl.CollatorOptions) {
		return this.internalRef.localeCompare(that, locales, options);
	}

	public match(regexp: string | RegExp): RegExpMatchArray | null;
	public match(matcher: { [Symbol.match](string: string): RegExpMatchArray | null }): RegExpMatchArray | null;
	public match(regexp: any) {
		return this.internalRef.match(regexp);
	}

	public matchAll(regexp: RegExp) {
		return this.internalRef.matchAll(regexp);
	}

	public normalize(form?: 'NFC' | 'NFD' | 'NFKC' | 'NFKD') {
		return this.internalRef.normalize(form);
	}

	public padEnd(targetLength: number, padString?: string) {
		return this.internalRef.padEnd(targetLength, padString);
	}

	public padStart(targetLength: number, padString?: string) {
		return this.internalRef.padStart(targetLength, padString);
	}

	public repeat(count: number) {
		return this.internalRef.repeat(count);
	}

	// @ts-ignore
	public replace(...args: any[]) {
		// @ts-ignore
		return this.internalRef.replace(...args);
	}

	public search(regexp: string): number;
	public search(regexp: RegExp): number;
	public search(regexp: string | RegExp) {
		return this.internalRef.search(regexp);
	}

	public slice(start?: number, end?: number) {
		return this.internalRef.slice(start, end);
	}

	public split(separator: string, limit?: number): string[];
	public split(separator: RegExp, limit?: number): string[];
	public split(separator: string | RegExp, limit?: number) {
		return this.internalRef.split(separator, limit);
	}

	public startsWith(searchString: string, position?: number) {
		return this.internalRef.startsWith(searchString, position);
	}

	public substring(start: number, end?: number) {
		return this.internalRef.substring(start, end);
	}

	public toLocaleLowerCase(locales?: string | string[]) {
		return this.internalRef.toLocaleLowerCase(locales);
	}

	public toLocaleUpperCase(locales?: string | string[]) {
		return this.internalRef.toLocaleUpperCase(locales);
	}

	public toLowerCase() {
		return this.internalRef.toLowerCase();
	}

	public toUpperCase() {
		return this.internalRef.toUpperCase();
	}

	public trim() {
		return this.internalRef.trim();
	}

	public trimEnd() {
		return this.internalRef.trimEnd();
	}

	public trimStart() {
		return this.internalRef.trimStart();
	}

	public [Symbol.iterator]() {
		return this.internalRef[Symbol.iterator]();
	}
}

export function isNetRef(value: any): value is ReassignableString {
	return typeof value === 'object' && value instanceof ReassignableString;
}

class ReassignableTemplateString extends ReassignableString {
	constructor(ctx: NetRefCtx | undefined, public baseString: ReassignableString, public template: string, public replaceStr: string = '{replace}') {
		super(ctx, baseString as any as string);

		this.on('change', (newVal) => {
			this.internalRef = this.compileTemplate(newVal);
		});

		this.internalRef = this.compileTemplate(baseString);
	}

	private compileTemplate(newVal: ReassignableString): string {
		return this.template.replace(this.replaceStr, newVal.valueOf());
	}

	public toString() {
		return this.internalRef.valueOf();
	}

	public strCast() {
		return this as any as string;
	}

	public toJSON() {
		return this.internalRef.valueOf();
	}

	public valueOf() {
		return this.internalRef.valueOf();
	}

	public [Symbol.toStringTag] = 'NetRef';

	public [Symbol.toPrimitive](hint: string) {
		return this.internalRef.valueOf();
	}
}

export class OpenApiV3Extractor implements IExtractor {
	public static readonly SwaggerVersion = '3.0.1';
	private static readonly RouteSeperator = '/';
	private static readonly MimeTypeText = 'text/plain';
	private static readonly MimeTypeJson = 'application/json';
	private static readonly ExcludeMetadataTags = ['private'];
	private readonly removableTypes = ['undefined', 'null'];
	private ctx: NetRefCtx = new NetRefCtx();

	private tags = new Map<string, IExtractedTag>();
	private definitions = new Map<ReassignableString, OpenAPIV3.SchemaObject>();
	private definitionNameMap = new Map<string, ReassignableString>();

	constructor(private readonly apiTree: IHandlerTreeNodeRoot, private readonly apiInfo: IProgramInfo, private readonly opts: IOpenApiV3Opts) {}

	public getDocument(): OpenAPIV3.Document {
		const doc: OpenAPIV3.Document = {
			openapi: OpenApiV3Extractor.SwaggerVersion,
			info: {
				title: this.apiInfo.title,
				version: this.apiInfo.version,
				description: this.apiInfo.description,
				license: this.apiInfo.license ? this.apiInfo.license[0] : undefined,
				termsOfService: this.apiInfo.termsOfService,
				contact: this.apiInfo.contact,
			},
			servers: this.getApiServers(),
			paths: this.getPaths(),
		};

		if (this.tags.size > 0) {
			doc.tags = [];
			this.tags.forEach((tag) => doc.tags.push(this.getTagObject(tag)));
		}

		if (this.definitions.size > 0) {
			doc.components = this.getComponents();
		}

		return doc;
	}

	private getApiServers(): OpenAPIV3.ServerObject[] {
		const schemes = this.apiInfo.schemes || this.tryInferSchemes() || [];
		if (schemes.length === 0) {
			schemes.push('');
		}

		let host = this.validHost(this.apiInfo.host || this.apiInfo.homepage) || '';
		while (host.endsWith('/')) {
			host = host.substr(0, host.length - 1);
		}

		let basePath = this.apiInfo.basePath;
		if (basePath && !basePath.startsWith('/')) {
			basePath = '/' + basePath;
		}

		const servers: OpenAPIV3.ServerObject[] = [];
		for (const scheme of schemes) {
			let url = host + this.apiInfo.basePath;

			if (scheme.length > 0) {
				url = `${scheme}://${url}`;
			}

			servers.push({
				url: url,
			});
		}

		return servers;
	}

	private getComponents(): OpenAPIV3.ComponentsObject {
		const defKeys = Array.from(this.definitions.keys()).map((k) => k.strCast());
		defKeys.sort();
		const definitions: OpenAPIV3.ComponentsObject = {
			schemas: {},
		};

		defKeys.forEach((defName) => {
			const defNameWithoutSuffix = defName.toString().replace(/[_0-9]+$/, '');
			if (defName.valueOf() !== defNameWithoutSuffix && defKeys.includes(defNameWithoutSuffix) && this.deepEqual(defName, defNameWithoutSuffix)) {
				const defObj: ReassignableString = defName as any;
				defObj.setValue(defNameWithoutSuffix);
				return;
			}

			definitions.schemas[defName] = <OpenAPIV3.SchemaObject>this.definitions.get(defName as any);
		});

		return definitions;
	}

	private deepEqual(defName: string, defNameWithoutSuffix: string) {
		try {
			deepEqual(this.definitions.get(defName as any), this.definitions.get(defNameWithoutSuffix as any));
			return true;
		} catch {}

		return false;
	}

	private tryInferSchemes(): string[] | undefined {
		if (this.opts.disableTryInferSchemes) {
			return;
		}

		const schemes = new Set<string>();
		if (this.apiInfo.host) {
			const url = new URL(this.apiInfo.host);
			if (url.protocol.length > 0 && !schemes.has(url.protocol)) {
				schemes.add(url.protocol.replace(':', ''));
			}
		}

		if (schemes.size > 0) {
			return Array.from(schemes);
		}
	}

	private validHost(host: string): string {
		try {
			const url = new URL(host);
			if (url.host.length > 0) {
				return url.host;
			}
		} catch (e) {}

		return host;
	}

	private getPaths(): OpenAPIV3.PathsObject {
		const paths: OpenAPIV3.PathsObject = {};
		// Array.from(WalkChildrenByType(api, isHandlerParameterNode)).forEach(api => {
		for (const api of WalkTreeByType(this.apiTree, isHandlerNode)) {
			const operation = this.getOperationObject(api);
			if (!operation) {
				continue;
			}

			const route = this.swaggerizeRoute(api.route);
			if (!paths[route]) {
				paths[route] = {};
			}

			if (!paths[route][api.apiMethod.toLowerCase()]) {
				paths[route][api.apiMethod.toLowerCase()] = operation;
			} else {
				throw new Error(`Multiple APIs for route: [${api.apiMethod}]: ${route}`);
			}
		}

		return paths;
	}

	private swaggerizeRoute(route: string): string {
		return ManagedApi.GetRouteTokens(route)
			.map((t) => {
				if (typeof t === 'string') {
					return t;
				}

				let outStr = t.prefix ? t.prefix : '';
				if (t.modifier && t.modifier !== '?') {
					console.warn('Unhandled modifier: ' + t.modifier);
				}
				outStr += `{${t.name}${t.modifier ? t.modifier : ''}}`;
				if (t.suffix) {
					outStr += t.suffix;
				}
				return outStr;
			})
			.join('');
	}

	private getOperationObject(api: IHandlerTreeNodeHandler): OpenAPIV3.OperationObject {
		if (getMetadataValue(api.metadata, IMetadataType.OpenApi, undefined, OpenApiMetadataType.Private)) {
			return;
		}

		const params = Array.from(WalkChildrenByType(api, isHandlerParameterNode));
		const bodyParams = params.filter((p) => this.isBodyParam(p));
		const metadataTags = getAllMetadataValues(api.metadata, IMetadataType.OpenApi, undefined, OpenApiMetadataType.Tag);
		const response = this.getResponseObject(api);
		const responses: OpenAPIV3.OperationObject['responses'] = {};
		let responseCodes: (string | number)[] = getMetadataValueByDescriptor(api.metadata, BuiltinMetadata.ResponseCodes);
		if (!Array.isArray(responseCodes) || responseCodes.length === 0) {
			responseCodes = ['default'];
		}

		for (const responseCode of responseCodes) {
			responses[responseCode] = response;
		}

		return {
			operationId: getMetadataValueByDescriptor(api.metadata, BuiltinMetadata.Name),
			description: getMetadataValue(api.metadata, IMetadataType.OpenApi, undefined, OpenApiMetadataType.Description),
			summary: getMetadataValue(api.metadata, IMetadataType.OpenApi, undefined, OpenApiMetadataType.Summary),
			tags: metadataTags.map((t) => this.recordTagObject(t)),
			parameters: params
				.filter((p) => !this.isBodyParam(p))
				.flatMap((p) => this.getParametersObject(p))
				.filter((p) => !!p),
			requestBody: bodyParams ? this.getRequestBody(bodyParams) : undefined,
			responses,
		};
	}

	private isBodyParam(p: IHandlerTreeNodeParameter): unknown {
		return p.paramDef.type === ApiParamType.Body || p.paramDef.type === ApiParamType.RawBody || p.paramDef.type === ApiParamType.FormFileSingle;
	}

	private getResponseObject(api: IHandlerTreeNodeHandler): OpenAPIV3.ResponseObject {
		const schema: InternalTypeDefinition = getMetadataValueByDescriptor(api.metadata, BuiltinMetadata.ReturnSchema);
		let mimeType = OpenApiV3Extractor.MimeTypeText;
		switch (schema.type) {
			case 'object':
			case 'array':
			case 'intersection':
			case 'union':
				mimeType = OpenApiV3Extractor.MimeTypeJson;
				break;
		}

		const response: OpenAPIV3.ResponseObject = {
			description: this.getOperationResponseDescription(api, schema),
			content: {
				[mimeType]: {
					schema: this.getInlineTypeSchema(schema),
				},
			},
		};

		return response;
	}

	private getOperationResponseDescription(api: IHandlerTreeNodeHandler, schema: InternalTypeDefinition): string {
		const metadata = getMetadataValue(api.metadata, IMetadataType.OpenApi, undefined, OpenApiMetadataType.ResponseDescription);
		if (metadata) {
			return metadata;
		}

		if (schema) {
			if (schema.typename) {
				return schema.typename;
			}

			return `${schema.type} response`;
		}

		return 'Default response';
	}

	private getInlineTypeSchema(returnType: InternalTypeDefinition): OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject {
		switch (returnType.type) {
			case null:
			// @ts-ignore
			case 'null':
				return {
					type: null,
				};

			case 'array':
				if (returnType.elementType) {
					return {
						type: 'array',
						items: this.getInlineTypeSchema(returnType.elementType),
					};
				} else {
					throw new Error(`Internal Error: Array types must have an elementType defined: ${returnType.typename}`);
				}

				break;

			case 'external':
				return returnType.schema as any;

			case 'object':
				if (returnType.schema) {
					return this.getInternalSchemaToOutputSchema(returnType.schema);
				}

			// Fall through to next case is intentional

			case 'number':
			case 'string':
				return {
					type: returnType.type,
					enum: this.getReturnTypeEnumValue(returnType),
				};

			case 'enum':
				return this.getEnumTypeInline(returnType);

			case 'boolean':
				return {
					type: returnType.type,
				};

			case 'void':
				return <OpenAPIV3.SchemaObject>{};

			default:
				throw new Error(`Unable to serialize inline type: ${returnType.typename} (type: ${returnType.type})`);
		}
	}

	private getReturnTypeEnumValue(returnType: IntrinsicTypeDefinitionString | IntrinsicTypeDefinitionNumber | InternalObjectTypeDefinition): any[] {
		if (returnType.schema) {
			if ('enum' in returnType.schema) {
				return returnType.schema.enum;
			}

			if ('const' in returnType.schema) {
				return [returnType.schema.const];
			}
		}

		return undefined;
	}

	private getEnumTypeInline(returnType: InternalEnumTypeDefinition): OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject {
		if (!returnType.schema || !returnType.schema.enum || returnType.schema.enum.length === 0) {
			// TODO: this has issues for named types and otehr scenarios
			return {
				type: 'string',
			};
		}

		if (returnType.typename) {
			this.addDefinitions({
				[returnType.typename]: this.createEnumType(returnType.schema.enum) as any,
			});

			return {
				$ref: new ReassignableTemplateString(this.ctx, this.renameDefinition(returnType.typename), `#/components/schemas/{replace}`).strCast(),
			};
		}

		const types = new Map<string, any[]>();
		for (const val of returnType.schema.enum) {
			const type = typeof val;
			if (!types.has(type)) {
				types.set(type, []);
			}

			types.get(type).push(val);
		}

		if (types.size === 1) {
			return {
				type: <'string' | 'number'>typeof returnType.schema.enum[0],
				enum: returnType.schema.enum,
			};
		}

		const enumType: OpenAPIV3.SchemaObject = {
			type: 'string',
			oneOf: [],
		};
		types.forEach((values, type: 'string' | 'number') => {
			enumType.oneOf.push({
				type: type,
				enum: values,
			});
		});

		return enumType;
	}

	private createEnumType(values: Array<string | number | boolean>): OpenAPIV3.SchemaObject {
		const enumTypes = new Set(values.map((v) => typeof v));
		if (enumTypes.size === 1) {
			return {
				type: typeof values[0] as 'string' | 'number' | 'boolean',
				enum: values,
			};
		} else {
			return {
				type: undefined,
				enum: undefined,
				oneOf: values.map((val) => {
					return {
						type: typeof val as 'string' | 'number' | 'boolean',
						const: val,
					};
				}),
			};
		}

		return {
			type: 'string',
			enum: values,
		};
	}

	private getInternalSchemaToOutputSchema(schema: IJsonSchemaWithRefs): OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject {
		if (typeof schema.definitions !== 'boolean' && schema.definitions) {
			this.addDefinitions(<{ [k: string]: IJsonSchema }>schema.definitions);

			schema = { ...schema };
			delete schema.definitions;
		}

		const delProps = ['uniqueTypename', 'typename', '$schema'];
		for (const prop of delProps) {
			if (typeof schema[prop] !== 'undefined') {
				delete schema[prop];
			}
		}

		if (schema.$ref) {
			schema.$ref = this.replaceRefStr(schema.$ref);
		}

		return <OpenAPIV3.SchemaObject>(<any>schema);
	}

	private expectedDefinitions = new Set<string>();

	private addDefinitions(definitions: { [name: string]: IJsonSchema }) {
		for (const definition of Object.keys(definitions)) {
			const renamedDef = this.renameDefinition(definition);
			this.definitions.set(renamedDef, this.fixDefinitionProperties(this.fixDefinitionRefs(definitions[definition])));
		}
	}

	private renameDefinition(definition: string) {
		if (!this.definitionNameMap.has(definition)) {
			let defName = definition.includes('.') ? definition.substring(0, definition.lastIndexOf('.')) : definition;

			if (definition.includes('.')) {
				let i = 0;
				while (this.definitions.has(defName as any)) {
					defName = `${defName}${++i}`;
				}
			}

			this.definitionNameMap.set(definition, new ReassignableString(this.ctx, defName));
		}

		return this.definitionNameMap.get(definition)!;
	}

	private fixDefinitionProperties(_: IJsonSchema): OpenAPIV3.SchemaObject {
		const redef = _;
		if (redef.anyOf) {
			redef.anyOf = this._fixDefinitionPropertiesCollection(redef.anyOf);
		}

		if (redef.allOf) {
			redef.allOf = this._fixDefinitionPropertiesCollection(redef.allOf);
		}

		if (redef.oneOf) {
			redef.oneOf = this._fixDefinitionPropertiesCollection(redef.oneOf);
		}

		if (redef.properties) {
			redef.properties = this._fixDefinitionPropertiesCollection(redef.properties);
			if (this.getKeyCount(redef.properties) === 0) {
				delete redef.properties;
			}
		}

		if (redef.definitions) {
			redef.definitions = this._fixDefinitionPropertiesCollection(redef.definitions);
		}

		if (redef.enum) {
			Object.assign(redef, this.createEnumType(redef.enum));
		}

		if (typeof redef.additionalProperties === 'object') {
			if (redef.additionalProperties.anyOf) {
				redef.additionalProperties.anyOf = this._fixDefinitionPropertiesCollection(redef.additionalProperties.anyOf);
			}

			if (redef.additionalProperties.allOf) {
				redef.additionalProperties.allOf = this._fixDefinitionPropertiesCollection(redef.additionalProperties.allOf);
			}

			if (redef.additionalProperties.oneOf) {
				redef.additionalProperties.oneOf = this._fixDefinitionPropertiesCollection(redef.additionalProperties.oneOf);
			}

			if (redef.additionalProperties.properties) {
				redef.additionalProperties.properties = this._fixDefinitionPropertiesCollection(redef.additionalProperties.properties);
			}

			if (Array.isArray(redef.additionalProperties.type)) {
				redef.additionalProperties.type = redef.additionalProperties.type[0];
			}
		} else if (redef.additionalProperties === true && !this.opts.outputAdditionalPropertiesTrue) {
			delete redef.additionalProperties;
		}

		if (this.getKeyCount(redef) === 0) {
			return {
				type: 'object',
				description: 'Empty object',
				additionalProperties: this.opts.outputAdditionalPropertiesTrue || undefined,
			};
		}

		return <OpenAPIV3.SchemaObject>this.convertProperties(redef);
	}

	getKeyCount(obj: object): number {
		return Object.entries(obj).reduce((acc, [key, value]) => acc + (key && value !== undefined ? 1 : 0), 0);
	}

	private convertProperties(orig: IJsonSchema): OpenAPIV3.SchemaObject {
		const redefed = <OpenAPIV3.SchemaObject>orig;
		if (redefed.properties) {
			redefed.properties = Object.fromEntries(
				Object.entries(redefed.properties).map(([key, value]) => {
					if (!value || (value as any).$ref) {
						return [key, value];
					}

					return [key, this.fixDefinitionProperties(value as IJsonSchema)];
				}),
			);
		}

		return redefed;
	}

	private _fixDefinitionPropertiesCollection<T extends { [name: string]: IJsonSchema } | Array<IJsonSchema>>(props: T): T {
		if (!props) {
			return;
		}

		let removeProps = [];
		for (const property of Object.keys(props)) {
			let pdef: IJsonSchema = props[property];
			if (!pdef) {
				continue;
			}
			if (typeof pdef['$ref'] !== 'undefined') {
				pdef['$ref'] = this.replaceRefStr(pdef['$ref']);
				continue;
			}

			if (pdef.type === 'array') {
				if (pdef.items && pdef.items['$ref']) {
					let items: IJsonSchema[] = [];
					if (Array.isArray(pdef.items)) {
						items = pdef.items;
					} else {
						items.push(pdef.items);
					}

					pdef.items = this._fixDefinitionPropertiesCollection(items);
					if (pdef.items.length === 1) {
						pdef.items = pdef.items[0];
					}
				} else if (Array.isArray(pdef.items)) {
					pdef.items = this._fixDefinitionPropertiesCollection(pdef.items);
					if (pdef.items.length === 1) {
						pdef.items = pdef.items[0];
					} else {
						pdef.items = {
							oneOf: pdef.items,
						};
					}
				} else if (!Array.isArray(pdef.items) && Array.isArray(pdef.items.type)) {
					pdef.items = {
						anyOf: pdef.items.type.map((type) => ({ type })),
					};
				} else if (!Array.isArray(pdef.items)) {
					[pdef.items] = this._fixDefinitionPropertiesCollection([pdef.items]);
				}

				if (pdef.additionalItems) {
					if (typeof pdef.additionalItems === 'object') {
						pdef.items = {
							anyOf: [...(Array.isArray(pdef.items) ? pdef.items : [pdef.items]), pdef.additionalItems],
						};
					}

					delete pdef.additionalItems;
				}
			} else if (typeof pdef.type === 'string') {
				if (this.removableTypes.indexOf(pdef.type) !== -1) {
					removeProps.push(property);
				}

				if ('const' in pdef) {
					pdef.enum = [pdef.const];
					delete pdef.const;
				}
			} else if (typeof pdef.type !== 'undefined') {
				let newTypes = Array.from(new Set(pdef.type.filter((t) => this.removableTypes.indexOf(t) === -1)));
				if (newTypes.length === 0) {
					removeProps.push(property);
				} else if (newTypes.length === 1) {
					pdef.type = newTypes[0];
				} else {
					pdef.oneOf = newTypes.map((t) => {
						if (typeof t === 'string') {
							return {
								type: t,
							};
						} else {
							return t;
						}
					});

					delete pdef.type;
				}
			} else if (this.getKeyCount(pdef) === 0) {
				pdef = {
					type: 'object',
					additionalProperties: this.opts.outputAdditionalPropertiesTrue || undefined,
				};
			}

			if (typeof pdef.additionalProperties === 'object' && Array.isArray(pdef.additionalProperties.type)) {
				if (this.opts.outputAdditionalPropertiesTrue) {
					pdef.additionalProperties = true;
				} else {
					pdef.additionalProperties.type = pdef.additionalProperties.type[0];
				}
			}

			props[property] = this.fixDefinitionProperties(pdef);
		}

		for (const prop of removeProps) {
			delete props[prop];
		}

		return props;
	}

	private fixDefinitionRefs<T extends object>(def: T): T {
		for (const property of Object.keys(def)) {
			if (property === '$ref') {
				def[property] = this.replaceRefStr(def[property]);
			} else {
				const val = def[property];
				if (typeof val === 'object') {
					if (Array.isArray(val)) {
						this.fixArrayDefinitionRefs<T>(val);
					} else {
						this.fixDefinitionRefs(val);
					}
				}
			}
		}

		return def;
	}

	private fixArrayDefinitionRefs<T extends object>(val: any[]) {
		val.forEach((v) => {
			if (typeof v === 'object') {
				if (Array.isArray(v)) {
					this.fixArrayDefinitionRefs(v);
				} else {
					this.fixDefinitionRefs(v);
				}
			}
		});
	}

	private replaceRefStr(refStr: string): string {
		if (refStr.includes('/')) {
			refStr = refStr.substring(refStr.lastIndexOf('/') + 1);
		}

		const expected = this.renameDefinition(refStr);
		if (!this.definitions.has(expected)) {
			this.expectedDefinitions.add(refStr);
		}

		return new ReassignableTemplateString(this.ctx, expected, `#/components/schemas/{replace}`).strCast();
	}

	private recordTagObject(t: IExtractedTag): string {
		if (!this.tags.has(t.name) || !this.tags.get(t.name).description) {
			this.tags.set(t.name, t);
		}

		return t.name;
	}

	private getTagObject(t: IExtractedTag): OpenAPIV3.TagObject {
		return {
			name: t.name,
			description: t.description,
		};
	}

	private getParametersObject(p: IHandlerTreeNodeParameter): OpenAPIV3.ParameterObject[] {
		if (p.paramDef.isDestructuredObject) {
			if (!p.paramDef.args.properties) {
				throw new Error(`Unable to get parameters object for destructured object parameter: ${p.paramDef.propertyKey.toString()}`);
			}

			return p.paramDef.args.properties
				.flatMap((pi) =>
					this.getParametersObject({
						...p,
						paramDef: {
							...p.paramDef,
							isDestructuredObject: false,
							propertyKey: pi.name,
							args: pi,
						},
					}),
				)
				.filter((p) => !!p);
		}

		let inStr: string;
		let name: string = p.paramDef.propertyKey.toString();
		switch (p.paramDef.type) {
			case ApiParamType.FormFileSingle:
				const formFieldName = getMetadataValueByDescriptor(p.metadata, BuiltinMetadata.FormDataFieldName);
				if (formFieldName) {
					name = formFieldName;
				}
			// Intentional flow-through
			case ApiParamType.Body:
				inStr = 'body';
				break;

			case ApiParamType.Query:
				inStr = 'query';
				break;

			case ApiParamType.Path:
				inStr = 'path';
				break;

			case ApiParamType.Header:
				inStr = 'header';
				break;

			case ApiParamType.Callback:
			case ApiParamType.Transport:
			case ApiParamType.Dependency:
			case ApiParamType.Out:
			case ApiParamType.Custom:
				return [];

			default:
				throw new Error(`Unknown Api Parameter Type: ${p.type}`);
		}

		let schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject = this.getInlineTypeSchema(p.paramDef.args.typedef);
		let enumVals: any[];
		if (p.paramDef.args.typedef.type === 'object' && p.paramDef.args.typedef.schema && p.paramDef.args.typedef.schema?.type !== 'object') {
			p.paramDef.args.typedef.type = p.paramDef.args.typedef.schema.type as any;
		}

		if (p.paramDef.args.typedef.type === 'string' || p.paramDef.args.typedef.type === 'number' || p.paramDef.args.typedef.type === 'enum') {
			if (p.paramDef.args.typedef.schema) {
				if ('enum' in p.paramDef.args.typedef.schema) {
					enumVals = p.paramDef.args.typedef.schema.enum;
				} else if ('const' in p.paramDef.args.typedef.schema) {
					enumVals = [p.paramDef.args.typedef.schema.const];
				}
			}
		}

		return [
			{
				name,
				in: inStr,
				required: this.isParameterRequired(p),
				description: p.paramDef.args.description,
				schema,
			},
		];
	}

	private isParameterRequired(p: IHandlerTreeNodeParameter): boolean {
		return !p.paramDef.args.optional && !p.paramDef.args.initializer;
	}

	getRequestBody(p: IHandlerTreeNodeParameter[]): OpenAPIV3.ReferenceObject | OpenAPIV3.RequestBodyObject {
		if (p.find((p) => p.paramDef.type === ApiParamType.FormFileSingle)) {
			if (p.find((p) => p.paramDef.type !== ApiParamType.FormFileSingle)) {
				throw new Error('Multipart body types cannot be mixed with body params of other types.');
			}

			return this.getMultipartRequestBodySchema(p);
		}

		if (p.find((p) => p.paramDef.type === ApiParamType.Body || p.paramDef.type === ApiParamType.RawBody)) {
			// uses traditional body params
			const bodyParams = p.filter((p) => p.paramDef.args.typedef || p.paramDef.args.typeref);
			if (bodyParams.length > 1) {
				throw new Error('Unsupported: multiple type-asserting body parameters');
			}

			if (bodyParams.length === 0) {
				if (p.length === 1) {
					return this.getSingleRequestBody(p[0]);
				}

				return undefined;
			}

			return this.getSingleRequestBody(bodyParams[0]);
		}

		return undefined;
	}

	private getMultipartRequestBodySchema(params: IHandlerTreeNodeParameter[]): OpenAPIV3.RequestBodyObject {
		const properties: OpenAPIV3.BaseSchemaObject['properties'] = {};
		const requiredProperties: string[] = [];

		for (const p of params) {
			let param: OpenAPIV3.ParameterObject;
			if (p.paramDef.type === ApiParamType.FormFileSingle) {
				const name = getMetadataValueByDescriptor(p.metadata, BuiltinMetadata.FormDataFieldName);
				if (properties[name]) {
					throw new Error('Multiple form files are not yet supported');
				}

				param = {
					name,
					in: 'body',
					required: this.isParameterRequired(p),
					description: p.paramDef.args.description,
					schema: {
						type: 'string',
						format: getMetadataValueByDescriptor(p.metadata, BuiltinMetadata.SchemaFormat) ?? 'binary',
					},
				};
			} else {
				param = this.getParametersObject(p)[0];
			}

			if (param.required) {
				requiredProperties.push(param.name);
			}

			properties[param.name] = {
				description: param.description,
				...param.schema,
			};
		}

		return {
			content: {
				[ApiMimeType.MultipartFormData]: {
					schema: {
						type: 'object',
						properties,
						required: requiredProperties.length > 0 ? requiredProperties : undefined,
					},
				},
			},
		};
	}

	private getSingleRequestBody(p: IHandlerTreeNodeParameter): OpenAPIV3.RequestBodyObject {
		let schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject;
		if (p.paramDef.args.typedef) {
			schema = this.getInlineTypeSchema(p.paramDef.args.typedef);

			let enumVals: any[];
			if (p.paramDef.args.typedef.type === 'string' || p.paramDef.args.typedef.type === 'number' || p.paramDef.args.typedef.type === 'enum') {
				if (p.paramDef.args.typedef.schema) {
					if ('enum' in p.paramDef.args.typedef.schema) {
						enumVals = p.paramDef.args.typedef.schema.enum;
					} else if ('const' in p.paramDef.args.typedef.schema) {
						enumVals = [p.paramDef.args.typedef.schema.const];
					}
				}
			}
		} else if (p.paramDef.type === ApiParamType.RawBody) {
			schema = {
				type: 'string',
				format: getMetadataValueByDescriptor(p.metadata, BuiltinMetadata.SchemaFormat) ?? 'binary',
			};
		} else {
			return undefined;
		}

		const mimeType = getMetadataValueByDescriptor(p.metadata, BuiltinMetadata.MimeType) ?? ApiMimeType.ApplicationJson;

		return {
			required: this.isParameterRequired(p),
			description: p.paramDef.args.description,
			content: {
				[mimeType]: {
					schema,
				},
			},
		};
	}

	public toString(): string {
		return yaml.dump(this.getDocument(), {
			...this.opts.yamlOpts,
			skipInvalid: true,
			schema: yaml.JSON_SCHEMA,
			replacer(key, value) {
				if (value instanceof ReassignableString || value instanceof ReassignableTemplateString) {
					return value.toString();
				}

				return value;
			},
		});
	}
}

export class OpenApiV3JsonExtractor extends OpenApiV3Extractor {
	public toString(): string {
		return JSON.stringify(this.getDocument(), undefined, 4);
	}
}
