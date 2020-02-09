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

describe('transformer', () => {
	const defaultOpts = getDefaultCompilerOptions();
	const transformers = [getTransformer()];
	let tree: IHandlerTreeNodeRoot;
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
		}

		assert.isObject(tree, 'Expected extracted tree');
	}

	it('should transform things', async () => {
		loadBasicTree();
	});

	it('should parse basic methods', async () => {
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

	
	it('should parse object return types with promises', async () => {
		loadBasicTree();
		assertRealInclude(tree, treeRootNode([
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
		assertRealInclude(tree, treeRootNode([
			// greetWithPromise()
			treeHandlerMethodNode(ApiMethod.GET, '/helloPromiseString', undefined, [
				treeNodeMetadata(BuiltinMetadata.ReturnSchema, InternalTypeUtil.TypeString),
			]),
		]));
	});

	it('ApiQueryParam invalid with object type', () => {
		const file = path.resolve(__dirname, './sources/invalid-usage-badtype-ApiQueryParam-object.ts');
		assert.throws(() => compileSourceFile(file, defaultOpts, transformers));
	});

	it('ApiQueryParam invalid with function type', () => {
		const file = path.resolve(__dirname, './sources/invalid-usage-badtype-ApiQueryParam-function.ts');
		assert.throws(() => compileSourceFile(file, defaultOpts, transformers));
	});

});