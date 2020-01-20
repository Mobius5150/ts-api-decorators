import * as tjs from 'typescript-json-schema';
import * as ts from 'typescript';
import { IMetadataResolver } from '../MetadataManager';
import { TypeSerializer } from '../TypeSerializer';

export interface ITransformContext {
	program: ts.Program;
	generator: tjs.JsonSchemaGenerator;
	metadataManager: IMetadataResolver;
	typeChecker: ts.TypeChecker;
	typeSerializer: TypeSerializer;
}