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

export default function transformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
	const generator = tjs.buildGenerator(program, {
		uniqueNames: true,
		required: true,
	});

	const queryParamIndexTs = path.join('decorators/QueryParams');
	const bodyParamIndexTs = path.join('decorators/BodyParams');
	const transformers: ITreeTransformer[] = [
		getQueryParamTransformer(program, generator, queryParamIndexTs, ApiQueryParam.name),
		getQueryParamTransformer(program, generator, queryParamIndexTs, ApiQueryParamString.name),
		getQueryParamTransformer(program, generator, queryParamIndexTs, ApiQueryParamNumber.name),

		getBodyParamTransformer(program, generator, bodyParamIndexTs, ApiBodyParam.name),
		getBodyParamTransformer(program, generator, bodyParamIndexTs, ApiBodyParamString.name),
		getBodyParamTransformer(program, generator, bodyParamIndexTs, ApiBodyParamNumber.name),
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
		...d,
	};
}

function getBodyParamTransformer(program: ts.Program, generator: tjs.JsonSchemaGenerator, indexTs: string, name: string) {
	return new ParamDecoratorTransformer(program, generator, getBodyParamDecoratorInfo(name, indexTs));
}