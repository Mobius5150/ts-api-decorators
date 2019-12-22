import { IApiDefinitionBase, ApiMethod, IApiParamDefinition, ApiParamType } from "../apiManagement/ApiDefinition";
import { IExtractor } from "./IExtractor";
import * as SwaggerParser from "swagger-parser";
import {OpenAPIV2} from 'openapi-types';
import { IExtractedApiDefinition, IExtractedTag } from "../transformer/ExtractionTransformer";

export class Swagger2Extractor implements IExtractor {
    public static readonly SwaggerVersion = '2.0';

    private tags = new Map<string, IExtractedTag>();

    constructor(
        private readonly extractedApis: IExtractedApiDefinition[],
        private readonly apiInfo: OpenAPIV2.InfoObject,
    ) {}

    private getDocument(): OpenAPIV2.Document {
        const doc: OpenAPIV2.Document = {
            swagger: Swagger2Extractor.SwaggerVersion,
            info: this.apiInfo,
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
    
    private getOperationObject(api: IExtractedApiDefinition): OpenAPIV2.OperationObject {
        return {
            operationId: api.handlerKey.toString(),
            description: api.description,
            summary: api.summary,
            tags: (api.tags || []).map(t => this.recordTagObject(t)),
            parameters: api.parameters.map(p => this.getParametersObject(p)),
            responses: {
                default: {
                    description: api.returnDescription,
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
            // @ts-ignore
            type: p.args.typedef.type,
        };
    }

    public toString(): string {
        return JSON.stringify(
            this.getDocument(),
            undefined,
            '\t');
    }
}