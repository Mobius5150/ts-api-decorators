import { IApiDefinitionBase } from "../apiManagement/ApiDefinition";
import { IExtractor } from "./IExtractor";
import * as SwaggerParser from "swagger-parser";
import {OpenAPIV3} from 'openapi-types';

export class Swagger2Extractor implements IExtractor {
    constructor(
        private readonly extractedApis: IApiDefinitionBase[],
    ) {}

    public toString(): string {
        const d: OpenAPIV3.Document = null;
        return '';
    }
}