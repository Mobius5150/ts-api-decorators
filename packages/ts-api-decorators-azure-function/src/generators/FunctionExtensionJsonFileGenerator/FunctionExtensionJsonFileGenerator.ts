import { IGenerator, OutputFileGeneratorFunc } from 'ts-api-decorators/dist/generators/IGenerator';
import { IBinding, IBindingParam, IBindingTrigger } from '../Bindings';
import { ParsedCommandLine } from 'typescript';
import { IHandlerTreeNode, WalkTree } from 'ts-api-decorators/dist/transformer/HandlerTree';
import { AzFuncExtension, IAzureFunctionExtensionInformation } from '../../metadata/AzFuncExtension';
import { getMetadataValueByDescriptor } from 'ts-api-decorators/dist/transformer/TransformerMetadata';
import { AzFuncMetadata } from '../../metadata/AzFuncMetadata';

export class FunctionExtensionJsonFileGenerator implements IGenerator {
	public static readonly FILE_NAME = 'extensions.json';
	private static readonly JSON_PRETTY_PRINT_SPACE: string | number = 4;

	public forTree(routes: IHandlerTreeNode[]): OutputFileGeneratorFunc {
		if (routes.length === 0) {
			throw new Error('Azure Function Generator requires at least one route');
		}

		return async (currentFile) => {
			const result = await this.generateExtensionJson(currentFile, routes);
			if (result) {
				return Buffer.from(result);
			}
		}
	}

	private generateExtensionJson(currentFile: string, routes: IHandlerTreeNode[]): string | undefined {
		const extFile: IAzureFunctionExtensionInformation[] = this.getExtensionsForRoutes(routes);
		if (extFile.length === 0) {
			return;
		}

		return JSON.stringify(extFile, undefined, FunctionExtensionJsonFileGenerator.JSON_PRETTY_PRINT_SPACE);
	}

	private getExtensionsForRoutes(routes: IHandlerTreeNode[]): IAzureFunctionExtensionInformation[] {
		const extensionIds = new Set<string>();
		for (const route of routes) {
			this.addExtensionIds(route, extensionIds);
			for (const node of WalkTree(route)) {
				this.addExtensionIds(node, extensionIds);
			}
		}

		return Array.from(extensionIds).map(id => {
			const ext = AzFuncExtension.GetExtensionForId(id);
			return {
				id: ext.id,
				version: ext.version,
			};
		});
	}

	private addExtensionIds(route: IHandlerTreeNode, extensionIds: Set<string>) {
		const meta = getMetadataValueByDescriptor(route.metadata, AzFuncMetadata.ExtensionBundle);
		if (meta && !extensionIds.has(meta)) {
			extensionIds.add(meta);
		}
	}

	public getFilename(): string {
		return `${FunctionExtensionJsonFileGenerator.FILE_NAME}`;
	}
}