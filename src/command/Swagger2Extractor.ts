import { IApiParamDefinition, ApiParamType } from "../apiManagement/ApiDefinition";
import { IExtractor } from "./IExtractor";
import { OpenAPIV2 } from 'openapi-types';
import { IExtractedApiDefinitionWithMetadata, IExtractedTag } from "../transformer/ExtractionTransformer";
import { getMetadataValue, IMetadataType, getAllMetadataValues } from "../transformer/TransformerMetadata";
import { OpenApiMetadataType } from "../transformer/OpenApi";
import * as yaml from 'js-yaml';
import { ProgramApiInfo } from "./ExtractCommand";

export interface ISwagger2Opts {
    disableTryInferSchemes?: boolean;
    yamlOpts?: yaml.DumpOptions;
}

export class Swagger2Extractor implements IExtractor {
    public static readonly SwaggerVersion = '2.0';

    private tags = new Map<string, IExtractedTag>();

    constructor(
        private readonly extractedApis: IExtractedApiDefinitionWithMetadata[],
        private readonly apiInfo: ProgramApiInfo,
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

        return doc;
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
        const url = new URL(host);
        if (url.host.length > 0) {
            return url.host;
        }

        return host;
    }

    private getPaths(): OpenAPIV2.PathsObject {
        const paths: OpenAPIV2.PathsObject = {};
        this.extractedApis.forEach(api => {
            if (!paths[api.route]) {
                paths[api.route] = {};
            }

            if (!paths[api.route][api.method.toLowerCase()]) {
                paths[api.route][api.method.toLowerCase()] = this.getOperationObject(api);
            } else {
                throw new Error(`Multiple APIs for route: [${api.method}]: ${api.route}`);
            }
        });

        return paths;
    }
    
    private getOperationObject(api: IExtractedApiDefinitionWithMetadata): OpenAPIV2.OperationObject {
        return {
            operationId: api.handlerKey.toString(),
            description: getMetadataValue(api.metadata, IMetadataType.OpenApi, undefined, OpenApiMetadataType.Description),
            summary: getMetadataValue(api.metadata, IMetadataType.OpenApi, undefined, OpenApiMetadataType.Summary),
            tags: getAllMetadataValues(api.metadata, IMetadataType.OpenApi, undefined, OpenApiMetadataType.Tag).map(t => this.recordTagObject(t)),
            parameters: api.parameters.map(p => this.getParametersObject(p)),
            responses: {
                default: {
                    description: getMetadataValue(api.metadata, IMetadataType.OpenApi, undefined, OpenApiMetadataType.ResponseDescription),
                }
            }
        };
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
    
    private getParametersObject(p: IApiParamDefinition): OpenAPIV2.Parameter {
        let inStr: string;
        switch (p.type) {
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

        return {
            name: p.propertyKey.toString(),
            in: inStr,
            required: !p.args.optional,
            description: p.args.description,
            type: p.args.typedef.type,
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