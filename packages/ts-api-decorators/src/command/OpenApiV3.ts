import { IApiParamDefinition, ApiParamType } from "../apiManagement/ApiDefinition";
import { IExtractor } from "./IExtractor";
import { OpenAPIV3, IJsonSchema } from 'openapi-types';
import { getMetadataValue, IMetadataType, getAllMetadataValues, getMetadataValueByDescriptor, BuiltinMetadata } from "../transformer/TransformerMetadata";
import { OpenApiMetadataType } from "../transformer/OpenApi";
import * as yaml from 'js-yaml';
import { IProgramInfo } from "./IProgramInfo";
import { InternalTypeDefinition, IJsonSchemaWithRefs, InternalEnumTypeDefinition } from "../apiManagement/InternalTypes";
import { IExtractedTag } from "../transformer/IExtractedTag";
import { IHandlerTreeNodeRoot, IHandlerTreeNodeHandler, WalkChildrenByType, isHandlerParameterNode, IHandlerTreeNodeParameter, WalkTreeByType, isHandlerNode, HandlerTreeNodeType } from "../transformer/HandlerTree";
import { ManagedApi, ApiMimeType } from "../apiManagement";

export interface IOpenApiV3Opts {
    disableTryInferSchemes?: boolean;
    yamlOpts?: yaml.DumpOptions;
}

export class OpenApiV3Extractor implements IExtractor {
    public static readonly SwaggerVersion = '3.0.1';
    private static readonly RouteSeperator = '/';
    private static readonly MimeTypeText = 'text/plain';
    private static readonly MimeTypeJson = 'application/json';
    private static readonly ExcludeMetadataTags = ['private'];
    private readonly removableTypes = ['undefined', 'null'];

    private tags = new Map<string, IExtractedTag>();
    private definitions = new Map<string, OpenAPIV3.SchemaObject>();

    constructor(
        private readonly apiTree: IHandlerTreeNodeRoot,
        private readonly apiInfo: IProgramInfo,
        private readonly opts: IOpenApiV3Opts,
    ) {}

    protected getDocument(): OpenAPIV3.Document {
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
            this.tags.forEach(
                tag => doc.tags.push(
                    this.getTagObject(tag)));
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
            })
        }

        return servers;
    }

    private getComponents(): OpenAPIV3.ComponentsObject {
        const defKeys = Array.from(this.definitions.keys());
        defKeys.sort();
        const definitions: OpenAPIV3.ComponentsObject = {
            schemas: {},
        };

        defKeys.forEach(defName => {
            definitions.schemas[defName] = <OpenAPIV3.SchemaObject>this.definitions.get(defName);
        });

        return definitions;
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
        } catch (e) {
            
        }

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
        };

        return paths;
    }

    private swaggerizeRoute(route: string): string {
        return ManagedApi.GetRouteTokens(route)
            .map(t => {
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
            .join('')
    }
    
    private getOperationObject(api: IHandlerTreeNodeHandler): OpenAPIV3.OperationObject {
        if (getMetadataValue(api.metadata, IMetadataType.OpenApi, undefined, OpenApiMetadataType.Private)) {
            return;
        }

        const params = Array.from(WalkChildrenByType(api, isHandlerParameterNode));
        const bodyParam = params.find(p => p.paramDef.type === ApiParamType.Body || p.paramDef.type === ApiParamType.RawBody);
        const metadataTags = getAllMetadataValues(api.metadata, IMetadataType.OpenApi, undefined, OpenApiMetadataType.Tag);
        return {
            operationId: getMetadataValueByDescriptor(api.metadata, BuiltinMetadata.Name),
            description: getMetadataValue(api.metadata, IMetadataType.OpenApi, undefined, OpenApiMetadataType.Description),
            summary: getMetadataValue(api.metadata, IMetadataType.OpenApi, undefined, OpenApiMetadataType.Summary),
            tags: metadataTags.map(t => this.recordTagObject(t)),
            parameters: params
                .filter(p => p.paramDef.type !== ApiParamType.Body && p.paramDef.type !== ApiParamType.RawBody)
                .map(p => this.getParametersObject(p)),
            requestBody: bodyParam ? this.getRequestBody(bodyParam) : undefined,
            responses: {
                default: this.getResponseObject(api),
            }
        };
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
                }
            }
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

            case 'object':
                if (returnType.schema) {
                    return this.getInternalSchemaToOutputSchema(returnType.schema);
                }

                // Fall through to next case is intentional

            case 'number':
            case 'string':
                return {
                    type: returnType.type,
                    enum: (returnType.schema && returnType.schema.enum) ? returnType.schema.enum : undefined,
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

    private getEnumTypeInline(returnType: InternalEnumTypeDefinition): OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject {
        if (!returnType.schema || !returnType.schema.enum || returnType.schema.enum.length === 0) {
            // TODO: this has issues for named types and otehr scenarios
            return {
                type: 'string',
            };
        }

        if (returnType.typename) {
            this.addDefinitions({
                [returnType.typename]: {
                    enum: returnType.schema.enum,
                }
            })

            return {
                $ref: `#/components/schemas/${returnType.typename}`,
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
            }
        }

        const enumType: OpenAPIV3.SchemaObject = {
            type: 'string',
            anyOf: [],
        }
        types.forEach((values, type: 'string' | 'number') => {
            enumType.anyOf.push({
                type: type,
                enum: values,
            });
        });

        return enumType;
    }
    
    private getInternalSchemaToOutputSchema(schema: IJsonSchemaWithRefs): OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject {
        if (typeof schema.definitions !== 'boolean' && schema.definitions) {
            this.addDefinitions(<{[k: string]: IJsonSchema}>schema.definitions);

            schema = { ...schema };
            delete schema.definitions;
        }

        if (schema.$schema) {
            delete schema.$schema;
        }

        if (schema.$ref) {
            schema.$ref = this.replaceRefStr(schema.$ref);
        }

        return <OpenAPIV3.SchemaObject><any>schema;
    }

    private addDefinitions(definitions: { [name: string]: IJsonSchema; }) {
        for (const definition of Object.keys(definitions)) {
            if (!this.definitions.has(definition)) {
                this.definitions.set(definition, 
                    this.fixDefinitionProperties(
                        this.fixDefinitionRefs(definitions[definition])));
            }
        }
    }

    private fixDefinitionProperties(_: IJsonSchema): OpenAPIV3.SchemaObject {
        const redef = _;
        if (redef.properties) {
            let removeProps = [];
            for (const property of Object.keys(redef.properties)) {
                const pdef = redef.properties[property];
                if (typeof pdef['$ref'] !== 'undefined' || !pdef.type) {
                    continue;
                }

                if (typeof pdef.type === 'string') {
                    if (this.removableTypes.indexOf(pdef.type) !== -1) {
                        removeProps.push(property);
                    }
                } else {
                    let newTypes = pdef.type.filter(t => this.removableTypes.indexOf(t) === -1);
                    if (newTypes.length === 0) {
                        removeProps.push(property);
                    } else {
                        pdef.type = newTypes;
                        (<OpenAPIV3.ArraySchemaObject>pdef).nullable = true;
                    }
                }

                if (pdef.properties) {
                    this.fixDefinitionProperties(pdef);
                }
            }

            for (const prop of removeProps) {
                delete redef.properties[prop];
            }
        }

        return <OpenAPIV3.SchemaObject>redef;
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
        val.forEach(v => {
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
        return refStr.replace('#/definitions', '#/components/schemas')
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
    
    private getParametersObject(p: IHandlerTreeNodeParameter): OpenAPIV3.ParameterObject {
        let inStr: string;
        switch (p.paramDef.type) {
            case ApiParamType.Body:
                inStr = 'body';
                break;

            case ApiParamType.Query:
                inStr = 'query';
                break;

            case ApiParamType.Path:
                inStr = 'path';
                break;

            default:
                throw new Error(`Unknown Api Parameter Type: ${p.type}`);
        }

        let schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject = this.getInlineTypeSchema(p.paramDef.args.typedef);
        let enumVals: any[];
        if (p.paramDef.args.typedef.type === 'string' || p.paramDef.args.typedef.type === 'number' || p.paramDef.args.typedef.type === 'enum') {
            if (p.paramDef.args.typedef.schema && p.paramDef.args.typedef.schema.enum) {
                enumVals = p.paramDef.args.typedef.schema.enum;
            }
        }

        return {
            name: p.paramDef.propertyKey.toString(),
            in: inStr,
            required: !p.paramDef.args.optional && !p.paramDef.args.initializer,
            description: p.paramDef.args.description,
            schema,
        };
    }

    getRequestBody(p: IHandlerTreeNodeParameter): OpenAPIV3.ReferenceObject | OpenAPIV3.RequestBodyObject {
        let schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject = this.getInlineTypeSchema(p.paramDef.args.typedef);
        let enumVals: any[];
        if (p.paramDef.args.typedef.type === 'string' || p.paramDef.args.typedef.type === 'number' || p.paramDef.args.typedef.type === 'enum') {
            if (p.paramDef.args.typedef.schema && p.paramDef.args.typedef.schema.enum) {
                enumVals = p.paramDef.args.typedef.schema.enum;
            }
        }

        return {
            required: !p.paramDef.args.optional && !p.paramDef.args.initializer,
            description: p.paramDef.args.description,
            content: {
                [ApiMimeType.ApplicationJson]: {
                    schema,
                }
            }
        };
    }

    public toString(): string {
        return yaml.safeDump(
            this.getDocument(),
            {
                ...this.opts.yamlOpts,
                skipInvalid: true,
            });
    }
}

export class OpenApiV3JsonExtractor extends OpenApiV3Extractor {
    public toString(): string {
        return JSON.stringify(this.getDocument(), undefined, 4);
    }
}