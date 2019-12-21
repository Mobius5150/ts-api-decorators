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

export default function transformer(program: ts.Program, onApiMethodExtracted: OnApiMethodExtractedHandler): ts.TransformerFactory<ts.SourceFile> {
	const generator = tjs.buildGenerator(program, {
		uniqueNames: true,
		required: true,
	});

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
        }, onApiMethodExtracted),
        // TODO: Other api methods
	];

	return (context: ts.TransformationContext) => (file: ts.SourceFile) =>  {
		for (const transformer of transformers) {
			file = transformer.visitNodeAndChildren(file, context)
		}

		return file;
	};
}
