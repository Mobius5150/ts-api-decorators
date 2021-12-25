import * as ts from 'typescript';
import * as path from 'path';
import { IDecoratorDefinitionBase, IDecoratorArgumentProcessorArgs, IDecoratorArgument, DecoratorNodeTreeHierarchyType } from './DecoratorDefinition';
import { ITransformedTreeElement, IHandlerLocation, IHandlerTreeNode } from './HandlerTree';
import { ITransformContext } from './ITransformContext';
import { ITransformerMetadata, BuiltinMetadata, getMetadataValueByDescriptor } from './TransformerMetadata';
import { isNamedNode } from './TransformerUtil';
import { ExpressionWrapper } from './ExpressionWrapper';
import { CompilationError } from '../Util/CompilationError';

export enum DecoratorNodeType {
	Class,
	ClassProperty,
	Method,
	Parameter,
}

export interface IDecorator<N extends ts.Node = ts.Node> extends IDecoratorDefinitionBase {
	nodeType: DecoratorNodeType;
	treeHierarchyType: DecoratorNodeTreeHierarchyType;
	isSourceFileMatch(sourceFile: ts.SourceFile): boolean;
	getDecoratorTreeElement(parent: IHandlerTreeNode | undefined, node: N, decorator: ts.Decorator, context: ITransformContext): ITransformedTreeElement<ts.Decorator>;
}

interface IExprWithMetadata {
	expression?: ts.Expression;
	metadata?: ITransformerMetadata;
}

export interface IIndexTsInfo {
	dirnameWithFile: string;
	extname: string;
}

export abstract class Decorator<N extends ts.Node, DT extends IDecoratorDefinitionBase> implements IDecorator<N> {
	private readonly _indexTs: string;

	public get magicFunctionName() {
		return this.definition.magicFunctionName;
	}

	public get indexTs() {
		return this._indexTs;
	}

	public get provider() {
		return this.definition.provider;
	}

	public get decoratorType(): DT['decoratorType'] {
		return this.definition.decoratorType;
	}

	public get dependencies() {
		return this.definition.dependencies;
	}

	public get arguments() {
		return this.definition.arguments;
	}

	public get metadata() {
		return this.definition.metadata || [];
	}

	public get transformArgumentsToObject() {
		if (typeof this.definition.transformArgumentsToObject === 'undefined') {
			return false;
		}

		return this.definition.transformArgumentsToObject;
	}

	public get isCallExpression() {
		if (typeof this.definition.isCallExpression === 'boolean') {
			return this.definition.isCallExpression;
		}
		
		return true;
	}

	public get isParentableExpression() {
		if (typeof this.definition.isParentableExpression === 'boolean') {
			return this.definition.isParentableExpression;
		}
		
		return true;
	}

	public get treeHierarchyType() {
		if (typeof this.definition.treeHierarchyType !== 'undefined') {
			return this.definition.treeHierarchyType;
		}

		return DecoratorNodeTreeHierarchyType.Child;
	}

	constructor(
		protected definition: DT,
		public readonly nodeType: DecoratorNodeType,
	) {
		this._indexTs = this.getPathWithoutCommonRoot(this.getPathWithoutExt(this.definition.indexTs), __dirname);
	}

	private getPathWithoutExt(p: string) {
		const ext = path.extname(p);
		return path.join(
			path.dirname(p),
			path.basename(p, ext)
		);
	}

	private getPathWithoutCommonRoot(path: string, common: string): string {
		const root = this.getPathFromCommonRoot(path, common);
		return path.substr(root.length);
	}

	private getPathFromCommonRoot(a: string, b: string): string {
		let i: number;
		for (i = 0; i < a.length && i < b.length; ++i) {
			if (a[i] !== b[i]) {
				break;
			}
		}

		return a.substr(0, i);
	}

	private getExt(p: string) {
		if (p.endsWith('.d.ts')) {
			return '.d.ts';
		}
		else {
			return path.extname(p);
		}
	}

	public abstract getDecoratorTreeElement(parent: IHandlerTreeNode | undefined, node: N, decorator: ts.Decorator, context: ITransformContext): ITransformedTreeElement<ts.Decorator>;

	protected getNodeLocation(node: N): IHandlerLocation {
		const sourceFile = node.getSourceFile();
		if (!sourceFile) {
			return {
				position: node.pos,
			}
		}

		const posDetails = sourceFile.getLineAndCharacterOfPosition(node.pos);
		return {
			...posDetails,
			file: sourceFile.fileName,
			position: node.pos,
		}
	}

	protected getMetadata(node: N, decorator: ts.Decorator, context: ITransformContext): ITransformerMetadata[] {
		const metadata: ITransformerMetadata[] = [...this.metadata];
		for (const getter of this.getDefaultMetadataGetters()) {
			const meta = getter(node, decorator, context);
			if (meta) {
				metadata.push(meta);
			}
		}

		return metadata;
	}

	protected * getDefaultMetadataGetters() {
		yield (node: N, decorator: ts.Decorator, context: ITransformContext) => this.getNodeNameMetadata(node);
	}

	protected getNodeNameMetadata(node: N): ITransformerMetadata {
		if (isNamedNode(node)) {
			let name: string;
			if (typeof node.name === 'string') {
				name = node.name;
			} else if (ts.isIdentifier(node.name)) {
				name = node.name.text;
			} else {
				throw new CompilationError('Unknown node name type', node);
			}

			return {
				...BuiltinMetadata.Name,
				value: name,
			}
		}
	}

	protected applyArguments(node: N, decorator: ts.Decorator, context: ITransformContext) {
		let metadata: ITransformerMetadata[] = this.getMetadata(node, decorator, context);
		if (!ts.isCallExpression(decorator.expression)) {
			return {
				metadata,
				decorator,
			};
		}

		const exprArguments: IExprWithMetadata[] = [];
		for (let index = 0; index < this.arguments.length; ++index) {
			const argDef = this.arguments[index];
			const arg = this.getUnparenthesizedExpression(decorator.expression.arguments[index]);
			exprArguments[index] = {expression: arg};
			const isUndefined =
				typeof arg === 'undefined'
				|| arg.kind === ts.SyntaxKind.NullKeyword
				|| arg.kind === ts.SyntaxKind.UndefinedKeyword
				|| (ts.isIdentifier(arg) && arg.originalKeywordKind === ts.SyntaxKind.UndefinedKeyword);
			if (isUndefined) {
				if (argDef.optional) {
					if (!argDef.transformer) {
						continue;
					}
				} else if (!argDef.optional) {
					throw new CompilationError('Expected argument', node);
				}
			} else {
				this.checkTypeCompatibility(argDef, arg, context);
			}

			if (argDef.metadataExtractor || argDef.transformer) {
				const processorArgs: IDecoratorArgumentProcessorArgs = {
					node,
					argument: argDef,
					argumentExpression: arg,
					index,
					transformContext: context,
				};

				let meta: ITransformerMetadata | undefined;
				if (argDef.metadataExtractor) {
					meta = argDef.metadataExtractor(processorArgs) || undefined ;
					if (meta) {
						metadata.push(meta);
					}
				}

				if (argDef.transformer) {
					let transformed = argDef.transformer(processorArgs);
					if (transformed) {
						exprArguments[index] = {
							expression: transformed,
							metadata: meta,
						}
					}
				} else if (meta) {
					exprArguments[index] = {
						expression: arg,
						metadata: meta,
					}
				}
			}
		}

		return {
			metadata,
			decorator: ts.factory.createDecorator(this.getOutputDecoratorArgs(decorator.expression, exprArguments, metadata, context)),
		}
	}
	
	private getUnparenthesizedExpression(arg0: ts.Expression) {
		if (!arg0) {
			return arg0;
		}
		
		while (ts.isParenthesizedExpression(arg0)) {
			arg0 = arg0.expression;
		}

		return arg0;
	}

	private checkTypeCompatibility(argDef: IDecoratorArgument, arg: ts.Expression, context: ITransformContext) {
		// if (!ts.isTypeNode(arg)) {
		// 	throw new Error();
		// }
		// const type = context.typeChecker.getTypeFromTypeNode(arg.type);
	}

	protected getOutputDecoratorArgs(expression: ts.CallExpression, exprArguments: IExprWithMetadata[], metadataCollection: ITransformerMetadata[], context: ITransformContext) {
		let clonedExpression: ts.CallExpression = { ...expression };
		let exprArgs = expression.arguments;
		if (this.definition.transformArgumentsToObject) {
			let paramArgs: object = {};
			if (Array.isArray(this.definition.transformArgumentsToObject)) {
				for (const descr of this.definition.transformArgumentsToObject) {
					if (!descr.key) {
						throw new Error('When transforming param args to object, descriptor must have key set');
					}

					let exprResult: IExprWithMetadata = getMetadataValueByDescriptor(exprArguments.map(a => a.metadata), descr);
					if (exprResult) {
						if (exprResult.expression) {
							paramArgs[descr.key] = new ExpressionWrapper(exprResult.expression);
						} else {
							paramArgs[descr.key] = exprResult.metadata;
						}
					} else {
						paramArgs[descr.key] = getMetadataValueByDescriptor(metadataCollection, descr);
					}
				}
			} else {
				for (const metadata of metadataCollection) {
					if (!metadata.key) {
						continue;
					}

					paramArgs[metadata.key] = metadata.value;
				}
			}

			exprArgs = ts.factory.createNodeArray([context.typeSerializer.objectToLiteral(paramArgs)]);
		} else {
			exprArgs = ts.factory.createNodeArray(exprArguments.filter(arg => !!arg.expression).map(arg => arg.expression));
		}

		return Object.assign(
			Object.create(Object.getPrototypeOf(expression)),
			{ ...expression, arguments: exprArgs });
	}

	protected parenthesizeExpression(expression: ts.Expression) {
		return ts.isParenthesizedExpression(expression)
			? expression
			: ts.createParen(expression);
	}
	
	public isSourceFileMatch(sourceFile: ts.SourceFile): boolean {
		let sourceFilePaths = [ path.join(sourceFile.fileName) ];
		if (sourceFilePaths[0] == this.indexTs) {
			return true;
		}

		const sourceFileExt = this.getExt(sourceFilePaths[0]);
		let parts = [ '/dist/', '/src/' ];
		if (process.env["DEBUG_PATH_REPLACE"]) {
			parts = process.env["DEBUG_PATH_REPLACE"].split(":");
			if (parts.length !== 2) {
				throw new Error("DEBUG_PATH_REPLACE must split into two parts using ':' separator");
			}
		}

		sourceFilePaths.push(sourceFilePaths[0].replace(parts[0], parts[1]));
		switch (sourceFileExt) {
			case '.d.ts':
				return !!sourceFilePaths.find(p => p.endsWith(this.indexTs + '.d.ts'));

			case '.ts':
				return !!sourceFilePaths.find(p => p.endsWith(this.indexTs + '.ts'));

			case '.js':
				return !!sourceFilePaths.find(p => p.endsWith(this.indexTs + '.js'));

			default:
				return false;
		}
	}
}