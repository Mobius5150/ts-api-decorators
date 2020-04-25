import * as ts from 'typescript';
import * as path from 'path';
import * as tjs from "typescript-json-schema";
import {
	ApiQueryParam,
	ApiQueryParamString,
	ApiQueryParamNumber,
	GetQueryParamDecorator
} from '../../decorators/QueryParams';
import { ApiBodyParam, ApiBodyParamNumber, ApiBodyParamString, GetBodyParamDecorator, ApiBodyParamStream } from '../../decorators/BodyParams';
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
import { TransformerOpts } from '../TransformerOpts';
import { GetApiProcessorDecorator, ApiProcessor } from '../../decorators/ApiProcessing';

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

	/**
	 * Program-specified options for the transformer.
	 */
	transformerOpts?: TransformerOpts;
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

	if (!args.transformerOpts) {
		const {rootDir} = program.getCompilerOptions();
		if (rootDir) {
			args.transformerOpts = loadTransformerOpts(rootDir);

			if (args.transformerOpts.loadCustomDecorators) {
				args.decoratorResolver.addDecorators(args.transformerOpts.loadCustomDecorators());
			}
		}
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

export function loadTransformerOpts(rootDir: string): TransformerOpts {
	return TransformerOpts.ParseTransformerOpts(rootDir);
}

export function registerDefaultDecorators(resolver: IDecoratorResolver) {
	const decorators = [
		GetApiDecorator(Api),
		GetApiMethodDecorator(ApiGetMethod),
		GetApiMethodDecorator(ApiPutMethod),
		GetApiMethodDecorator(ApiPostMethod),
		GetApiMethodDecorator(ApiDeleteMethod),
		
        GetQueryParamDecorator(ApiQueryParam),
        GetQueryParamDecorator(ApiQueryParamString),
        GetQueryParamDecorator(ApiQueryParamNumber),

        GetBodyParamDecorator(ApiBodyParam),
        GetBodyParamDecorator(ApiBodyParamString),
		GetBodyParamDecorator(ApiBodyParamNumber),
		GetBodyParamDecorator(ApiBodyParamStream),

		GetHeaderParamDecorator(ApiHeaderParam),
		GetHeaderParamDecorator(ApiHeaderParamNumber),
		GetHeaderParamDecorator(ApiHeaderParamString),

		GetPathParamDecorator(ApiPathParam),
		GetPathParamDecorator(ApiPathParamNumber),
		GetPathParamDecorator(ApiPathParamString),

		GetDependencyParamDecorator(ApiDependency),
		GetDependencyParamDecorator(ApiInjectedDependency),
		GetDependencyParamDecorator(ApiInjectedDependencyParam),

		GetApiProcessorDecorator(ApiProcessor),
	];
	
	for (const decorator of decorators) {
		resolver.addDecorator(decorator);
	}
}