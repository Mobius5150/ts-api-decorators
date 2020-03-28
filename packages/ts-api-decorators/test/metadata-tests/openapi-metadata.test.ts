import { expect, assert } from 'chai';
import * as path from 'path';
import * as ts from 'typescript';
import 'mocha';
import { compileSourcesDir, getDefaultCompilerOptions, getTransformer, asyncGlob, compileSourceFile, getCompiledProgram, assertRealInclude } from '../TestUtil';
import { IHandlerTreeNodeRoot, HandlerTreeNodeType } from '../../src/transformer/HandlerTree';
import { ApiMethod } from '../../src';
import { treeRootNode, treeHandlerMethodNode, treeHandlerParameterNode, treeNodeMetadata } from '../TreeTestUtil';
import { ApiParamType } from '../../src/apiManagement/ApiDefinition';
import { InternalTypeUtil } from '../../src/apiManagement/InternalTypes';
import { BuiltinMetadata, IMetadataType } from '../../src/transformer/TransformerMetadata';
import { OpenApiMetadataType } from '../../src/transformer/OpenApi';

describe('openapi metadata', () => {
	const defaultOpts = getDefaultCompilerOptions();
	const transformers = [getTransformer()];
	let tree: IHandlerTreeNodeRoot;
	function loadBasicTree() {
		if (!tree) {
			assert.doesNotThrow(() => {
				try {
					const modules = getCompiledProgram([
						path.join(__dirname, 'sources/basic-metadata.ts'),
					], {
						onTreeExtracted: (e, t) => tree = t,
					});
				} catch (e) {
					throw e;
				}
			});
		}

		assert.isObject(tree, 'Expected extracted tree');
	}

	it('should transform things', async () => {
		loadBasicTree();
	});

	it('should parse string enums', async () => {
		loadBasicTree();
		assertRealInclude(tree, treeRootNode([
			// greet()
			treeHandlerMethodNode(ApiMethod.GET, '/hello', [
				treeHandlerParameterNode({
					type: ApiParamType.Query,
					parameterIndex: 0,
					propertyKey: 'name',
					args: {
						name: 'name',
						description: 'The name of the caller'
					},
				}),
				treeHandlerParameterNode({
					type: ApiParamType.Query,
					parameterIndex: 1,
					propertyKey: 'times',
					args: {
						name: 'times',
						description: 'The number of times to repeat the greeting'
					},
				}),
				treeHandlerParameterNode({
					type: ApiParamType.Query,
					parameterIndex: 2,
					propertyKey: 'optional',
					args: {
						name: 'optional',
						description: 'An optional preamble'
					},
				}),
			],
			[
				treeNodeMetadata({
					type: IMetadataType.OpenApi,
					key: OpenApiMetadataType.Summary,
				}, 'Greets the caller'),
				treeNodeMetadata({
					type: IMetadataType.OpenApi,
					key: OpenApiMetadataType.ResponseDescription,
				}, 'The greeting'),
				treeNodeMetadata(
					{
						type: IMetadataType.OpenApi,
						key: OpenApiMetadataType.Tag,
					},
					{
						name: 'greeters',
						description: 'A group of methods for greeting'
					}
				),
			]),
		]));
	});
});