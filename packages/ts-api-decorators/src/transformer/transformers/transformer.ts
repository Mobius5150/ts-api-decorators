import * as ts from 'typescript';
import * as path from 'path';
import * as tjs from "typescript-json-schema";
import {
	ApiQueryParam,
	ApiQueryParamString,
	ApiQueryParamNumber,
	GetQueryParamDecorator
} from '../../decorators/QueryParams';
import { ApiBodyParam, ApiBodyParamNumber, ApiBodyParamString, GetBodyParamDecorator } from '../../decorators/BodyParams';
import { ParamDecoratorTransformer, ParamDecoratorTransformerInfo } from '../ParamDecoratorTransformer';
import { ITreeTransformer } from '../ITreeTransformer';
import { ApiParamType } from '../../apiManagement/ApiDefinition';
import { TJSDefaultOptions } from '../../Util/TJSGeneratorUtil';
import { ExtractionTransformer } from '../ExtractionTransformer';
import { GetApiMethodDecorator, ApiGetMethod, ApiPostMethod, ApiPutMethod, ApiDeleteMethod } from '../..';
import { MetadataManager } from '../MetadataManager';
import { OpenApiMetadataExtractors } from '../OpenApi';
import { ITransformerArguments } from '../TransformerUtil';
import { GetHeaderParamDecorator, ApiHeaderParam, ApiHeaderParamNumber, ApiHeaderParamString } from '../../decorators/HeaderParams';

export default function transformer(program: ts.Program, args: ITransformerArguments = {}): ts.TransformerFactory<ts.SourceFile> {
	const generator = tjs.buildGenerator(program, TJSDefaultOptions());
    
	let metadataManager = new MetadataManager();
	OpenApiMetadataExtractors.RegisterMetadataExtractors(metadataManager);
	
    const indexTs = path.join('decorators/API');
    const queryParamIndexTs = path.join('decorators/QueryParams');
	const bodyParamIndexTs = path.join('decorators/BodyParams');
	const headerParamIndexTs = path.join('decorators/HeaderParams');
    const parameterTypes: ParamDecoratorTransformerInfo[] = [
        getQueryParamDecoratorInfo(ApiQueryParam.name, queryParamIndexTs),
        getQueryParamDecoratorInfo(ApiQueryParamString.name, queryParamIndexTs),
        getQueryParamDecoratorInfo(ApiQueryParamNumber.name, queryParamIndexTs),

        getBodyParamDecoratorInfo(ApiBodyParam.name, bodyParamIndexTs),
        getBodyParamDecoratorInfo(ApiBodyParamString.name, bodyParamIndexTs),
		getBodyParamDecoratorInfo(ApiBodyParamNumber.name, bodyParamIndexTs),

		getHeaderParamDecoratorInfo(ApiHeaderParam.name, headerParamIndexTs),
		getHeaderParamDecoratorInfo(ApiHeaderParamNumber.name, headerParamIndexTs),
		getHeaderParamDecoratorInfo(ApiHeaderParamString.name, headerParamIndexTs),
		
		...(args.paramDecorators ? args.paramDecorators : []),
    ];
	const transformers: ITreeTransformer[] = [
        // GET
		new ExtractionTransformer(program, generator, {
            ...GetApiMethodDecorator(ApiGetMethod.name),
            parameterTypes,
            indexTs,
        }, undefined, metadataManager),
        
        // POST
        new ExtractionTransformer(program, generator, {
            ...GetApiMethodDecorator(ApiPostMethod.name),
            parameterTypes,
            indexTs,
        }, undefined, metadataManager),

        // PUT
        new ExtractionTransformer(program, generator, {
            ...GetApiMethodDecorator(ApiPutMethod.name),
            parameterTypes,
            indexTs,
        }, undefined, metadataManager),

        // DELETE
        new ExtractionTransformer(program, generator, {
            ...GetApiMethodDecorator(ApiDeleteMethod.name),
            parameterTypes,
            indexTs,
        }, undefined, metadataManager),
	];

	return (context: ts.TransformationContext) => (file: ts.SourceFile) =>  {
		for (const transformer of transformers) {
			file = transformer.visitNodeAndChildren(file, context)
		}

		return file;
	};
}

export function getQueryParamDecoratorInfo(name: string, indexTs: string): ParamDecoratorTransformerInfo {
	const d = GetQueryParamDecorator(name);
	if (!d) {
		throw new Error('QueryParamDecorator not defined for: ' + name);
	}

	return {
		indexTs,
		magicFunctionName: name,
		type: ApiParamType.Query,
		...d,
	};
}

export function getHeaderParamDecoratorInfo(name: string, indexTs: string): ParamDecoratorTransformerInfo {
	const d = GetHeaderParamDecorator(name);
	if (!d) {
		throw new Error('HeaderParamDecorator not defined for: ' + name);
	}

	return {
		indexTs,
		magicFunctionName: name,
		type: ApiParamType.Header,
		...d,
	};
}

function getQueryParamTransformer(program: ts.Program, generator: tjs.JsonSchemaGenerator, indexTs: string, name: string) {
	return new ParamDecoratorTransformer(program, generator, getQueryParamDecoratorInfo(name, indexTs));
}

export function getBodyParamDecoratorInfo(name: string, indexTs: string): ParamDecoratorTransformerInfo {
	const d = GetBodyParamDecorator(name);
	if (!d) {
		throw new Error('GetBodyParamDecorator not defined for: ' + name);
	}

	return {
		indexTs,
		magicFunctionName: name,
		type: ApiParamType.Body,
		...d,
	};
}

function getBodyParamTransformer(program: ts.Program, generator: tjs.JsonSchemaGenerator, indexTs: string, name: string) {
	return new ParamDecoratorTransformer(program, generator, getBodyParamDecoratorInfo(name, indexTs));
}