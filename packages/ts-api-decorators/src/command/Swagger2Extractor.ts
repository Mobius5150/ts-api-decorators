import { IApiParamDefinition, ApiParamType } from "../apiManagement/ApiDefinition";
import { IExtractor } from "./IExtractor";
import { OpenAPIV2, IJsonSchema } from 'openapi-types';
import { getMetadataValue, IMetadataType, getAllMetadataValues, getMetadataValueByDescriptor, BuiltinMetadata } from "../transformer/TransformerMetadata";
import { OpenApiMetadataType } from "../transformer/OpenApi";
import * as yaml from 'js-yaml';
import { IProgramInfo } from "./IProgramInfo";
import { InternalTypeDefinition, IJsonSchemaWithRefs } from "../apiManagement/InternalTypes";
import { IExtractedTag } from "../transformer/IExtractedTag";
import { IHandlerTreeNodeRoot, IHandlerTreeNodeHandler, WalkChildrenByType, isHandlerParameterNode, IHandlerTreeNodeParameter, WalkTreeByType, isHandlerNode } from "../transformer/HandlerTree";
import { ManagedApi } from "../apiManagement";

export interface ISwagger2Opts {
    disableTryInferSchemes?: boolean;
    yamlOpts?: yaml.DumpOptions;
}

export class Swagger2Extractor implements IExtractor {
    public static readonly SwaggerVersion = '2.0';
    private static readonly RouteSeperator = '/';

    private tags = new Map<string, IExtractedTag>();
    private definitions = new Map<string, OpenAPIV2.SchemaObject>();

    constructor(
        private readonly apiTree: IHandlerTreeNodeRoot,
        private readonly apiInfo: IProgramInfo,
        private readonly opts: ISwagger2Opts,
    ) {}

    protected getDocument(): OpenAPIV2.Document {
        const doc: OpenAPIV2.Document = {
            swagger: Swagger2Extractor.SwaggerVersion,
            info: {
                title: this.apiInfo.title,
                version: this.apiInfo.version,
                description: this.apiInfo.description,
                license: this.apiInfo.license ? this.apiInfo.license[0] : undefined,
                termsOfService: this.apiInfo.termsOfService,
                contact: this.apiInfo.contact,
            },
            host: this.validHost(this.apiInfo.host || this.apiInfo.homepage),
            basePath: this.apiInfo.basePath,
            schemes: this.apiInfo.schemes || this.tryInferSchemes(),
            paths: this.getPaths(),
        };

        if (this.tags.size > 0) {
            doc.tags = [];
            this.tags.forEach(
                tag => doc.tags.push(
                    this.getTagObject(tag)));
        }

        if (this.definitions.size > 0) {
            doc.definitions = this.getDefinitions();
        }

        return doc;
    }

    private getDefinitions(): OpenAPIV2.DefinitionsObject {
        const defKeys = Array.from(this.definitions.keys());
        defKeys.sort();
        const definitions: OpenAPIV2.DefinitionsObject = {};
        defKeys.forEach(defName => {
            definitions[defName] = <OpenAPIV2.SchemaObject>this.definitions.get(defName);
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

    private getPaths(): OpenAPIV2.PathsObject {
        const paths: OpenAPIV2.PathsObject = {};
        // Array.from(WalkChildrenByType(api, isHandlerParameterNode)).forEach(api => {
        for (const api of WalkTreeByType(this.apiTree, isHandlerNode)) {
            const route = this.swaggerizeRoute(api.route);
            if (!paths[route]) {
                paths[route] = {};
            }

            if (!paths[route][api.apiMethod.toLowerCase()]) {
                paths[route][api.apiMethod.toLowerCase()] = this.getOperationObject(api);
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
    
    private getOperationObject(api: IHandlerTreeNodeHandler): OpenAPIV2.OperationObject {
        return {
            operationId: getMetadataValueByDescriptor(api.metadata, BuiltinMetadata.Name),
            description: getMetadataValue(api.metadata, IMetadataType.OpenApi, undefined, OpenApiMetadataType.Description),
            summary: getMetadataValue(api.metadata, IMetadataType.OpenApi, undefined, OpenApiMetadataType.Summary),
            tags: getAllMetadataValues(api.metadata, IMetadataType.OpenApi, undefined, OpenApiMetadataType.Tag).map(t => this.recordTagObject(t)),
            parameters: Array.from(WalkChildrenByType(api, isHandlerParameterNode)).map(p => this.getParametersObject(p)),
            responses: {
                default: {
                    schema: this.getInlineTypeSchema(getMetadataValueByDescriptor(api.metadata, BuiltinMetadata.ReturnSchema)),
                    description: getMetadataValue(api.metadata, IMetadataType.OpenApi, undefined, OpenApiMetadataType.ResponseDescription),
                }
            }
        };
    }

    private getInlineTypeSchema(returnType: InternalTypeDefinition): Partial<OpenAPIV2.Schema> {
        switch (returnType.type) {
            case 'object':
                if (returnType.schema) {
                    return this.getInternalSchemaToOutputSchema(returnType.schema);
                }

                // Fall through to next case is intentional

            case 'number':
            case 'string':
            case 'boolean':
                return {
                    type: returnType.type,
                };

            default:
                throw new Error(`Unable to serialize inline type: ${returnType.typename} (type: ${returnType.type})`);
        }
    }
    
    private getInternalSchemaToOutputSchema(schema: IJsonSchemaWithRefs): Partial<OpenAPIV2.SchemaObject> | Partial<OpenAPIV2.ReferenceObject> {
        if (schema.definitions) {
            this.addDefinitions(schema.definitions);

            schema = { ...schema };
            delete schema.definitions;
        }

        if (schema.$schema) {
            delete schema.$schema;
        }

        return <OpenAPIV2.SchemaObject>schema;
    }

    private addDefinitions(definitions: { [name: string]: IJsonSchema; }) {
        for (const definition of Object.keys(definitions)) {
            if (!this.definitions.has(definition)) {
                this.definitions.set(definition, <OpenAPIV2.SchemaObject>definitions[definition]);
            }
        }
    }

    private recordTagObject(t: IExtractedTag): string {
        if (!this.tags.has(t.name) || !this.tags.get(t.name).description) {
            this.tags.set(t.name, t);
        }

        return t.name;
    }

    private getTagObject(t: IExtractedTag): OpenAPIV2.TagObject {
        return {
            name: t.name,
            description: t.description,
        };
    }
    
    private getParametersObject(p: IHandlerTreeNodeParameter): OpenAPIV2.Parameter {
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

        let schema: OpenAPIV2.SchemaObject;
        if (p.paramDef.args.typedef.type === 'object') {
            schema = this.getInlineTypeSchema(p.paramDef.args.typedef);
        }
        
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
            type: p.paramDef.args.typedef.type,
            schema,
            enum: enumVals,
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

export class Swagger2JsonExtractor extends Swagger2Extractor {
    public toString(): string {
        return JSON.stringify(this.getDocument(), undefined, 4);
    }
}