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
import { TJSDefaultOptions } from '../../Util/TJSGeneratorUtil';
import { GetApiMethodDecorator, ApiGetMethod, ApiPostMethod, ApiPutMethod, ApiDeleteMethod } from '../..';
import { MetadataManager } from '../MetadataManager';
import { OpenApiMetadataExtractors } from '../OpenApi';
import { GetHeaderParamDecorator, ApiHeaderParam, ApiHeaderParamNumber, ApiHeaderParamString } from '../../decorators/HeaderParams';
import { GetPathParamDecorator, ApiPathParam, ApiPathParamNumber, ApiPathParamString } from '../../decorators/PathParams';
import { GetDependencyParamDecorator, ApiInjectedDependencyParam, ApiInjectedDependency, ApiDependency } from '../../decorators/DependencyParams';
import { IDecoratorResolver } from '../IDecoratorResolver';
import { DecoratorResolver } from '../DecoratorResolver';
import { Api, GetApiDecorator } from '../../decorators';
import { TreeTransformer } from '../TreeTransformer';
import { IHandlerTreeNodeRoot } from '../HandlerTree';

export type OnTreeExtractedHandler = (error: any, treeRoot: IHandlerTreeNodeRoot) => void;

export interface ITransformerArguments {
	/**
	 * A resolver to use when performing transformations.
	 */
	decoratorResolver?: IDecoratorResolver;
	
	/**
	 * If `decoratorResolver` is specified, whether to register the builtin decorator suite.
	 */
	registerBuiltindecorators?: boolean;

	/**
	 * Whether to apply transformers or just extract data. Defaults to true.
	 */
	applyTransformation?: boolean;

	/**
	 * A method to be called when the Handler Tree is extracted.
	 */
	onTreeExtracted?: OnTreeExtractedHandler;
}

export default function transformer(program: ts.Program, args: ITransformerArguments = {}): ts.TransformerFactory<ts.SourceFile> {
	const generator = tjs.buildGenerator(program, TJSDefaultOptions());
    
	let metadataManager = new MetadataManager();
	OpenApiMetadataExtractors.RegisterMetadataExtractors(metadataManager);
	
    if (!args.decoratorResolver) {
		args.decoratorResolver = getDefaultDecoratorResolver();
	} else if (args.registerBuiltindecorators) {
		registerDefaultDecorators(args.decoratorResolver);
	}

	if (typeof args.applyTransformation !== 'boolean') {
		args.applyTransformation = true;
	}

	return (context: ts.TransformationContext) => (file: ts.SourceFile) =>  {
		const transformer = new TreeTransformer(
			program,
			generator,
			args.decoratorResolver,
			args.applyTransformation,
			metadataManager
		);

		file = transformer.visitNode(file, context);
		if (args.onTreeExtracted) {
			args.onTreeExtracted(null, transformer.root);
		}

		return file;
	};
}

export function getDefaultDecoratorResolver() {
	const resolver = new DecoratorResolver();
	registerDefaultDecorators(resolver);
	return resolver;
}


export function registerDefaultDecorators(resolver: IDecoratorResolver) {
	const decorators = [
		GetApiDecorator(Api.name),
		GetApiMethodDecorator(ApiGetMethod.name),
		GetApiMethodDecorator(ApiPutMethod.name),
		GetApiMethodDecorator(ApiPostMethod.name),
		GetApiMethodDecorator(ApiDeleteMethod.name),
		
        GetQueryParamDecorator(ApiQueryParam.name),
        GetQueryParamDecorator(ApiQueryParamString.name),
        GetQueryParamDecorator(ApiQueryParamNumber.name),

        GetBodyParamDecorator(ApiBodyParam.name),
        GetBodyParamDecorator(ApiBodyParamString.name),
		GetBodyParamDecorator(ApiBodyParamNumber.name),

		GetHeaderParamDecorator(ApiHeaderParam.name),
		GetHeaderParamDecorator(ApiHeaderParamNumber.name),
		GetHeaderParamDecorator(ApiHeaderParamString.name),

		GetPathParamDecorator(ApiPathParam.name),
		GetPathParamDecorator(ApiPathParamNumber.name),
		GetPathParamDecorator(ApiPathParamString.name),

		GetDependencyParamDecorator(ApiDependency.name),
		GetDependencyParamDecorator(ApiInjectedDependency.name),
		GetDependencyParamDecorator(ApiInjectedDependencyParam.name),
	];
	
	for (const decorator of decorators) {
		resolver.addDecorator(decorator);
	}
}