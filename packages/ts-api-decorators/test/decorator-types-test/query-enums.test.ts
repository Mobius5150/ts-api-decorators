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
import { BuiltinMetadata } from '../../src/transformer/TransformerMetadata';

describe('transformer enum support', () => {
	const defaultOpts = getDefaultCompilerOptions();
	const transformers = [getTransformer()];
	let tree: IHandlerTreeNodeRoot;
	function loadBasicTree() {
		if (!tree) {
			assert.doesNotThrow(() => {
				try {
					const modules = getCompiledProgram([
						path.join(__dirname, 'sources/query-enum.ts'),
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
					propertyKey: 'filter',
					args: {
						name: 'filter',
						typedef: {
							...InternalTypeUtil.TypeString,
							schema: {
								enum: ['all', 'top']
							}
						}
					},
				}),
			],
			[
				treeNodeMetadata(BuiltinMetadata.ReturnSchema, InternalTypeUtil.TypeString),
			]),

			// greetConst()
			treeHandlerMethodNode(ApiMethod.GET, '/helloConst', [
				treeHandlerParameterNode({
					type: ApiParamType.Query,
					parameterIndex: 0,
					propertyKey: 'filter',
					args: {
						name: 'filter',
						typedef: {
							...InternalTypeUtil.TypeString,
							schema: {
								enum: ['all', 'top']
							}
						}
					},
				}),
			],
			[
				treeNodeMetadata(BuiltinMetadata.ReturnSchema, InternalTypeUtil.TypeString),
			]),
		]));
	});

	it('should parse number enums', async () => {
		loadBasicTree();
		assertRealInclude(tree, treeRootNode([
			// greet()
			treeHandlerMethodNode(ApiMethod.GET, '/helloNum', [
				treeHandlerParameterNode({
					type: ApiParamType.Query,
					parameterIndex: 0,
					propertyKey: 'filter',
					args: {
						name: 'filter',
						typedef: {
							...InternalTypeUtil.TypeNumber,
							schema: {
								enum: [0, 1]
							}
						}
					},
				}),
			],
			[
				treeNodeMetadata(BuiltinMetadata.ReturnSchema, InternalTypeUtil.TypeString),
			]),

			// greetConst()
			treeHandlerMethodNode(ApiMethod.GET, '/helloConstNum', [
				treeHandlerParameterNode({
					type: ApiParamType.Query,
					parameterIndex: 0,
					propertyKey: 'filter',
					args: {
						name: 'filter',
						typedef: {
							...InternalTypeUtil.TypeNumber,
							schema: {
								enum: [0, 1]
							}
						}
					},
				}),
			],
			[
				treeNodeMetadata(BuiltinMetadata.ReturnSchema, InternalTypeUtil.TypeString),
			]),
		]));
	});

	it('should parse mixed enums', async () => {
		loadBasicTree();
		assertRealInclude(tree, treeRootNode([
			// greet()
			treeHandlerMethodNode(ApiMethod.GET, '/helloMixed', [
				treeHandlerParameterNode({
					type: ApiParamType.Query,
					parameterIndex: 0,
					propertyKey: 'filter',
					args: {
						name: 'filter',
						typedef: {
							...InternalTypeUtil.TypeEnum,
							schema: {
								enum: [0, 'string']
							}
						}
					},
				}),
			],
			[
				treeNodeMetadata(BuiltinMetadata.ReturnSchema, InternalTypeUtil.TypeString),
			]),

			// greetConst()
			treeHandlerMethodNode(ApiMethod.GET, '/helloConstMixed', [
				treeHandlerParameterNode({
					type: ApiParamType.Query,
					parameterIndex: 0,
					propertyKey: 'filter',
					args: {
						name: 'filter',
						typedef: {
							...InternalTypeUtil.TypeEnum,
							schema: {
								enum: [0, 'string']
							}
						}
					},
				}),
			],
			[
				treeNodeMetadata(BuiltinMetadata.ReturnSchema, InternalTypeUtil.TypeString),
			]),
		]));
	});

});