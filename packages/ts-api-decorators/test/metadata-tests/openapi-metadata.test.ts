import { expect, assert } from 'chai';
import * as path from 'path';
import * as ts from 'typescript';
import 'mocha';
import { compileSourcesDir, getDefaultCompilerOptions, getTransformer, asyncGlob, compileSourceFile, getCompiledProgram, assertRealInclude } from '../../src/Testing/TestUtil';
import { IHandlerTreeNodeRoot, HandlerTreeNodeType, IHandlerTreeNode, WalkChildrenByType, WalkTreeByType, isHandlerNode } from '../../src/transformer/HandlerTree';
import { ApiMethod } from '../../src';
import { treeRootNode, treeHandlerMethodNode, treeHandlerParameterNode, treeNodeMetadata, treeHandlerMethodCollectionNode, definitionPathWithSymbolChecker } from '../../src/Testing/TreeTestUtil';
import { ApiParamType } from '../../src/apiManagement/ApiDefinition';
import { InternalTypeUtil } from '../../src/apiManagement/InternalTypes';
import { BuiltinMetadata, IMetadataType } from '../../src/transformer/TransformerMetadata';
import { OpenApiMetadataType } from '../../src/transformer/OpenApi';
import { OpenApiV3Extractor } from '../../src/command/OpenApiV3';

describe('openapi metadata', () => {
	const defaultOpts = getDefaultCompilerOptions();
	const transformers = [getTransformer()];
	let root: IHandlerTreeNodeRoot;
	let tree: IHandlerTreeNode;
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

			assert.isObject(tree, 'Expected extracted tree');
			assert.isObject(tree.children[0], 'Expected children from root');
			assert.equal(tree.children[0].type, HandlerTreeNodeType.HandlerCollection, 'Expected method collection');
			root = <IHandlerTreeNodeRoot>tree;
			tree = tree.children[0];
		}
	}

	it('should transform things', async () => {
		loadBasicTree();
	});

	it('should parse metadata', async () => {
		loadBasicTree();
		assertRealInclude(tree, treeHandlerMethodCollectionNode([
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

	it('should extract methods marked private', async () => {
		loadBasicTree();
		assertRealInclude(tree, treeHandlerMethodCollectionNode([
			// greetPrivate()
			treeHandlerMethodNode(ApiMethod.GET, '/helloPrivate', [],
			[
				treeNodeMetadata({
					type: IMetadataType.OpenApi,
					key: OpenApiMetadataType.Private,
				}, { "name": "private" })
			]),
		]));
	});

	it('should return valid openapi v3 type objects', () => {
		loadBasicTree();
		const extractor = new OpenApiV3Extractor(<IHandlerTreeNodeRoot>root, {
			title: 'test',
			version: '1.0',
		}, {});

		const extracted = extractor.getDocument();
		const Response1 = Symbol('Response1');
		assertRealInclude(extracted, {
			paths: {
				'/helloOneOf': {
					get: {
						responses: {
							default: {
								content: {
									'application/json': {
										schema: {
											'$ref': (actual, ctx) => definitionPathWithSymbolChecker(actual, Response1, 'Response1', ctx, '#/components/schemas/')
										}
									}
								}
							}
						}
					}
				}
			},
			components: {
				schemas: {
					[Response1]: {
						properties: {
							response: {
								oneOf: [
									{ type: 'string' },
									{ type: 'number' },
								],
								type: undefined
							}
						}
					}
				}
			},
		}, undefined, {
			funcmode: 'matcher',
			symbols: {
				[Response1]: { matcher: s => !!s?.startsWith('Response1') },
			}
		});
	})
});