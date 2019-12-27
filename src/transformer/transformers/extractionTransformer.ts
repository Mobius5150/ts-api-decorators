import * as ts from 'typescript';
import * as path from 'path';
import * as tjs from "typescript-json-schema";
import {
	ApiQueryParam,
	ApiQueryParamString,
	ApiQueryParamNumber,
} from '../../decorators/QueryParams';
import { ApiBodyParam, ApiBodyParamNumber, ApiBodyParamString, GetBodyParamDecorator } from '../../decorators/BodyParams';
import { ITreeTransformer } from '../ITreeTransformer';
import { ExtractionTransformer, OnApiMethodExtractedHandler } from '../ExtractionTransformer';
import { ApiGetMethod } from '../..';
import { ApiMethod } from '../../apiManagement';
import { ParamDecoratorTransformerInfo } from '../ParamDecoratorTransformer';
import { getQueryParamDecoratorInfo, getBodyParamDecoratorInfo } from './transformer';
import { IMetadataManager, IMetadataResolver, MetadataManager } from '../MetadataManager';
import { OpenApiMetadataExtractors } from '../OpenApi';
import { ApiPostMethod, ApiPutMethod, ApiDeleteMethod } from '../../decorators';
import { TJSDefaultOptions } from '../../Util/TJSGeneratorUtil';

export interface IExtractionTransformerArgs {
    onApiMethodExtracted: OnApiMethodExtractedHandler;
    metadataManager?: IMetadataResolver;
    disableOpenApiMetadata?: boolean;
}

export default function transformer(program: ts.Program, opts: IExtractionTransformerArgs): ts.TransformerFactory<ts.SourceFile> {
	const generator = tjs.buildGenerator(program, TJSDefaultOptions());
    
    let metadataManager = opts.metadataManager;
    if (!metadataManager) {
        const mgr = new MetadataManager();
        if (!opts.disableOpenApiMetadata) {
            OpenApiMetadataExtractors.RegisterMetadataExtractors(mgr);
        }

        metadataManager = mgr;
    }

    const indexTs = path.join('decorators/API');
    const queryParamIndexTs = path.join('decorators/QueryParams');
	const bodyParamIndexTs = path.join('decorators/BodyParams');
    const parameterTypes: ParamDecoratorTransformerInfo[] = [
        getQueryParamDecoratorInfo(ApiQueryParam.name, queryParamIndexTs),
        getQueryParamDecoratorInfo(ApiQueryParamString.name, queryParamIndexTs),
        getQueryParamDecoratorInfo(ApiQueryParamNumber.name, queryParamIndexTs),

        getBodyParamDecoratorInfo(ApiBodyParam.name, bodyParamIndexTs),
        getBodyParamDecoratorInfo(ApiBodyParamString.name, bodyParamIndexTs),
        getBodyParamDecoratorInfo(ApiBodyParamNumber.name, bodyParamIndexTs),
    ];
	const transformers: ITreeTransformer[] = [
        // GET
		new ExtractionTransformer(program, generator, {
            magicFunctionName: ApiGetMethod.name,
            apiDecoratorMethod: ApiMethod.GET,
            arguments: [
                {
                    type: 'route',
                    optional: false,
                },
            ],
            parameterTypes,
            indexTs,
        }, opts.onApiMethodExtracted, metadataManager),
        
        // POST
        new ExtractionTransformer(program, generator, {
            magicFunctionName: ApiPostMethod.name,
            apiDecoratorMethod: ApiMethod.POST,
            arguments: [
                {
                    type: 'route',
                    optional: false,
                },
            ],
            parameterTypes,
            indexTs,
        }, opts.onApiMethodExtracted, metadataManager),

        // PUT
        new ExtractionTransformer(program, generator, {
            magicFunctionName: ApiPutMethod.name,
            apiDecoratorMethod: ApiMethod.PUT,
            arguments: [
                {
                    type: 'route',
                    optional: false,
                },
            ],
            parameterTypes,
            indexTs,
        }, opts.onApiMethodExtracted, metadataManager),

        // DELETE
        new ExtractionTransformer(program, generator, {
            magicFunctionName: ApiDeleteMethod.name,
            apiDecoratorMethod: ApiMethod.DELETE,
            arguments: [
                {
                    type: 'route',
                    optional: false,
                },
            ],
            parameterTypes,
            indexTs,
        }, opts.onApiMethodExtracted, metadataManager),
        // TODO: Other api methods
	];

	return (context: ts.TransformationContext) => (file: ts.SourceFile) =>  {
		for (const transformer of transformers) {
			file = transformer.visitNodeAndChildren(file, context)
		}

		return file;
	};
}
