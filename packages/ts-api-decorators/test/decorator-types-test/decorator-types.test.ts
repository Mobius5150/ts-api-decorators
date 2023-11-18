import { expect, assert } from 'chai';
import * as path from 'path';
import * as ts from 'typescript';
import 'mocha';
import { compileSourcesDir, getDefaultCompilerOptions, getTransformer, asyncGlob, compileSourceFile, getCompiledProgram, assertRealInclude } from '../../src/Testing/TestUtil';
import { IHandlerTreeNodeRoot, HandlerTreeNodeType, IHandlerTreeNode } from '../../src/transformer/HandlerTree';
import { ApiMethod } from '../../src';
import { treeRootNode, treeHandlerMethodNode, treeHandlerParameterNode, treeNodeMetadata, treeHandlerMethodCollectionNode } from '../../src/Testing/TreeTestUtil';
import { ApiParamType } from '../../src/apiManagement/ApiDefinition';
import { InternalTypeUtil } from '../../src/apiManagement/InternalTypes';
import { BuiltinMetadata } from '../../src/transformer/TransformerMetadata';
import { CompilationError } from '../../src/Util/CompilationError';

describe('transformer', () => {
	const defaultOpts = getDefaultCompilerOptions();
	const transformers = [getTransformer()];
	let tree: IHandlerTreeNode;
	function loadBasicTree() {
		if (!tree) {
			assert.doesNotThrow(() => {
				try {
					const modules = getCompiledProgram([
						path.join(__dirname, 'sources/basic-decorators.ts'),
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
			tree = tree.children[0];
		}
	}

	it('should transform things', async () => {
		loadBasicTree();
	});

	it('should parse basic methods', async () => {
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
						typedef: InternalTypeUtil.TypeString,
					},
				}),
				treeHandlerParameterNode({
					type: ApiParamType.Query,
					parameterIndex: 1,
					propertyKey: 'times',
					args: {
						name: 'times',
						typedef: InternalTypeUtil.TypeNumber,
					},
				}),
				treeHandlerParameterNode({
					type: ApiParamType.Query,
					parameterIndex: 2,
					propertyKey: 'optional',
					args: {
						name: 'optional',
						optional: true,
						typedef: InternalTypeUtil.TypeString,
					},
				}),
			],
			[
				treeNodeMetadata(BuiltinMetadata.ReturnSchema, InternalTypeUtil.TypeString),
			]),

			// greetWithParamValidation()
			treeHandlerMethodNode(ApiMethod.GET, '/helloTypedQueryParam', [
				treeHandlerParameterNode({
					type: ApiParamType.Query,
					parameterIndex: 0,
					propertyKey: 'name',
					args: {
						name: 'name',
						typedef: InternalTypeUtil.TypeString,
					},
				}),
				treeHandlerParameterNode({
					type: ApiParamType.Query,
					parameterIndex: 1,
					propertyKey: 'times',
					args: {
						name: 'times',
						typedef: {
							...InternalTypeUtil.TypeNumber,
							// maxVal: 100,
						}
					},
				}),
				treeHandlerParameterNode({
					type: ApiParamType.Query,
					parameterIndex: 2,
					propertyKey: 'optional',
					args: {
						name: 'optional',
						optional: true,
						typedef: InternalTypeUtil.TypeString,
					},
				}),
			],
			[
				treeNodeMetadata(BuiltinMetadata.ReturnSchema, InternalTypeUtil.TypeString),
			]),
		]));
	});

	it('should perform deep number parameter validation', async () => {
		loadBasicTree();

		// Find the node for this handler
		const handlerNode = tree.children.find(c => c.type === HandlerTreeNodeType.Handler && c.route === '/helloTypedNumberQueryParam');

		// Assert that the handler looks right
		assertRealInclude(handlerNode,
			// greetWithNumberParamValidation()
			treeHandlerMethodNode(ApiMethod.GET, '/helloTypedNumberQueryParam', undefined,
			[
				treeNodeMetadata(BuiltinMetadata.ReturnSchema, InternalTypeUtil.TypeString),
			]),
		);

		// Expected parameters
		const expectedChildren = [
			treeHandlerParameterNode(
				{
					type: ApiParamType.Query,
					propertyKey: 'times0',
					args: {
						name: 'times0',
						typedef: {
							...InternalTypeUtil.TypeNumber,
						}
					},
				}
			),
			treeHandlerParameterNode(
				{
					type: ApiParamType.Query,
					propertyKey: 'times1',
					args: {
						name: 'times1',
						typedef: InternalTypeUtil.TypeNumber,
					},
				},
				undefined,
				[
					treeNodeMetadata(BuiltinMetadata.NumberMin, 0),
				]
			),
			treeHandlerParameterNode(
				{
					type: ApiParamType.Query,
					propertyKey: 'times2',
					args: {
						name: 'times2',
						typedef: InternalTypeUtil.TypeNumber,
					},
				},
				undefined,
				[
					treeNodeMetadata(BuiltinMetadata.NumberMin, 0),
				]
			),
			treeHandlerParameterNode(
				{
					type: ApiParamType.Query,
					propertyKey: 'times3',
					args: {
						name: 'times3',
						typedef: InternalTypeUtil.TypeNumber,
					},
				},
				undefined,
				[
					treeNodeMetadata(BuiltinMetadata.NumberMin, 0),
				]
			),
			treeHandlerParameterNode(
				{
					type: ApiParamType.Query,
					propertyKey: 'times4',
					args: {
						name: 'times4',
						typedef: InternalTypeUtil.TypeNumber,
					},
				},
				undefined,
				[
					treeNodeMetadata(BuiltinMetadata.NumberMin, 0),
					treeNodeMetadata(BuiltinMetadata.NumberMax, 100),
				]
			),
			treeHandlerParameterNode(
				{
					type: ApiParamType.Query,
					propertyKey: 'times5',
					args: {
						name: 'times5',
						typedef: InternalTypeUtil.TypeNumber,
					},
				},
				undefined,
				[
					treeNodeMetadata(BuiltinMetadata.NumberMax, 100),
				]
			),
			treeHandlerParameterNode(
				{
					type: ApiParamType.Query,
					propertyKey: 'times6',
					args: {
						name: 'times6',
						typedef: InternalTypeUtil.TypeNumber,
					},
				},
				undefined,
				[
					treeNodeMetadata(BuiltinMetadata.NumberMax, 100),
				]
			),
			treeHandlerParameterNode({
				type: ApiParamType.Query,
				propertyKey: 'times7',
				args: {
					name: 'times7',
					typedef: InternalTypeUtil.TypeNumber,
				},
			}),
			treeHandlerParameterNode({
				type: ApiParamType.Query,
				propertyKey: 'times8',
				args: {
					name: 'times8',
					typedef: InternalTypeUtil.TypeNumber,
				},
			}),
			treeHandlerParameterNode({
				type: ApiParamType.Query,
				propertyKey: 'optional',
				args: {
					name: 'optional',
					optional: true,
					typedef: InternalTypeUtil.TypeString,
				},
			}),
		];

		for (const childIndex in expectedChildren) {
			const child = expectedChildren[childIndex];
			assertRealInclude(handlerNode.children[childIndex], child, `$.${childIndex}`);
		}
	});

	it('should support ApiGetSchemaMethod', async () => {
		loadBasicTree();

		// Find the node for this handler
		const handlerNode = tree.children.find(c => c.type === HandlerTreeNodeType.Handler && c.route === '/helloSchema');

		// Assert that the handler looks right
		assertRealInclude(handlerNode,
			// greetWithStringParamValidation()
			treeHandlerMethodNode(ApiMethod.GET, '/helloSchema', undefined,
			[
				treeNodeMetadata(BuiltinMetadata.DecoratorTypeArgType, { type: "object", schema: { "$ref": "#/definitions/IGreetResponse", } }),
			]),
		);
	});

	it('should perform deep string parameter validation', async () => {
		loadBasicTree();

		// Find the node for this handler
		const handlerNode = tree.children.find(c => c.type === HandlerTreeNodeType.Handler && c.route === '/helloTypedStringQueryParam');

		// Assert that the handler looks right
		assertRealInclude(handlerNode,
			// greetWithStringParamValidation()
			treeHandlerMethodNode(ApiMethod.GET, '/helloTypedStringQueryParam', undefined,
			[
				treeNodeMetadata(BuiltinMetadata.ReturnSchema, InternalTypeUtil.TypeString),
			]),
		);

		// Expected parameters
		const expectedChildren = [
			treeHandlerParameterNode(
				{
					type: ApiParamType.Query,
					propertyKey: 'name0',
					args: {
						name: 'name0',
						typedef: InternalTypeUtil.TypeString,
					},
				}
			),
			treeHandlerParameterNode(
				{
					type: ApiParamType.Query,
					propertyKey: 'name1',
					args: {
						name: 'name1',
						typedef: InternalTypeUtil.TypeString,
					},
				}
			),
			treeHandlerParameterNode(
				{
					type: ApiParamType.Query,
					propertyKey: 'name2',
					args: {
						name: 'name2',
						typedef: InternalTypeUtil.TypeString,
					},
				}
			),
			treeHandlerParameterNode(
				{
					type: ApiParamType.Query,
					propertyKey: 'name3',
					args: {
						name: 'name3',
						typedef: InternalTypeUtil.TypeString,
					},
				}
			),
			treeHandlerParameterNode(
				{
					type: ApiParamType.Query,
					propertyKey: 'name4',
					args: {
						name: 'name4',
						typedef: InternalTypeUtil.TypeString,
					},
				}
			),
			treeHandlerParameterNode(
				{
					type: ApiParamType.Query,
					propertyKey: 'name5',
					args: {
						name: 'name5',
						typedef: InternalTypeUtil.TypeString,
					},
				}
			),
			treeHandlerParameterNode(
				{
					type: ApiParamType.Query,
					propertyKey: 'name6',
					args: {
						name: 'name6',
						typedef: InternalTypeUtil.TypeString,
					},
				}
			),
		];

		for (const childIndex in expectedChildren) {
			const child = expectedChildren[childIndex];
			assertRealInclude(handlerNode.children[childIndex], child, `$.${childIndex}`);
		}
	});

	it('should parse body params and body responses', async () => {
		loadBasicTree();
		assertRealInclude(tree, treeHandlerMethodCollectionNode([
			// greetObject()
			treeHandlerMethodNode(ApiMethod.POST, '/hello', [
				treeHandlerParameterNode({
					propertyKey: 'body',
					type: ApiParamType.Body,
					parameterIndex: 0,
					args: {
						typedef: {
							...InternalTypeUtil.TypeAnyObject,
							typename: 'IGreetArgs',
						},
					}
				})
			], [
				treeNodeMetadata(BuiltinMetadata.ReturnSchema, {
					...InternalTypeUtil.TypeAnyObject,
					typename: 'IGreetResponse',
					schema: {
						'$ref': '#/definitions/IGreetResponse',
					}
				}),
			]),

			// greetObjectArray()
			treeHandlerMethodNode(ApiMethod.POST, '/helloBodyArray', [
				treeHandlerParameterNode({
					propertyKey: 'bodies',
					type: ApiParamType.Body,
					parameterIndex: 0,
					args: {
						typedef: {
							...InternalTypeUtil.TypeAnyArray,
							elementType: {
								...InternalTypeUtil.TypeAnyObject,
								typename: 'IGreetArgs',
							}
						},
					}
				})
			], [
				treeNodeMetadata(BuiltinMetadata.ReturnSchema, {
					...InternalTypeUtil.TypeAnyArray,
					elementType: {
						...InternalTypeUtil.TypeAnyObject,
						typename: 'IGreetResponse',
						schema: {
							'$ref': '#/definitions/IGreetResponse',
						}
					}
				}),
			]),
		]));
	});
	
	it('should parse object return types with promises', async () => {
		loadBasicTree();
		assertRealInclude(tree, treeHandlerMethodCollectionNode([
			// greetObjectWithPromise()
			treeHandlerMethodNode(ApiMethod.GET, '/helloPromiseObject', undefined, [
				treeNodeMetadata(BuiltinMetadata.ReturnSchema, {
					...InternalTypeUtil.TypeAnyObject,
					typename: 'IGreetResponse',
					schema: {
						'$ref': '#/definitions/IGreetResponse',
					}
				}),
			]),
		]));
	});

	it('should parse string return types with promises', async () => {
		loadBasicTree();
		assertRealInclude(tree, treeHandlerMethodCollectionNode([
			// greetWithPromise()
			treeHandlerMethodNode(ApiMethod.GET, '/helloPromiseString', undefined, [
				treeNodeMetadata(BuiltinMetadata.ReturnSchema, InternalTypeUtil.TypeString),
			]),
		]));
	});

	it('ApiQueryParam invalid with object type', () => {
		const file = path.resolve(__dirname, './sources/invalid-usage-badtype-ApiQueryParam-object.ts');
		assert.throws(() => compileSourceFile(file, defaultOpts, transformers), CompilationError);
	});

	it('ApiQueryParam invalid with function type', () => {
		const file = path.resolve(__dirname, './sources/invalid-usage-badtype-ApiQueryParam-function.ts');
		assert.throws(() => compileSourceFile(file, defaultOpts, transformers));
	});

});