import * as ts from 'typescript';
import { IMetadataManager } from "./MetadataManager";
import { ITransformerMetadata, IMetadataType } from './TransformerMetadata';
import { isNodeWithJsDoc, WithJsDoc } from './TransformerUtil';
import { IExtractedTag } from './IExtractedTag';
import { IHandlerTreeNodeHandler, HandlerTreeNodeType, IHandlerTreeNodeHandlerCollection } from './HandlerTree';

export const enum OpenApiMetadataType {
    Summary = 'summary',
    ResponseDescription = 'response',
    Description = 'description',
    Tag = 'tag',
}

export class OpenApiMetadataExtractors {
    public static readonly JsDocTagTag = 'tags';

    private constructor() {};

    public static RegisterMetadataExtractors(mm: IMetadataManager) {
		mm.addApiMethodMetadataGenerator(this.ExtractMethodJsDocMetadata);
		mm.addApiMethodCollectionMetadataGenerator(this.ExtractClassJsDocMetadata);
    }

    public static ExtractClassJsDocMetadata(method: IHandlerTreeNodeHandlerCollection, methodNode: ts.ClassDeclaration): ITransformerMetadata[] {
		const metadata: ITransformerMetadata[] = [];
		if (method.type !== HandlerTreeNodeType.HandlerCollection) {
			return metadata;
		}

        if (isNodeWithJsDoc(methodNode) && methodNode.jsDoc.length > 0) {
            // jsdoc tags
			const firstLine = OpenApiMetadataExtractors.getFirstCommentLine(methodNode);
			if (firstLine) {
				OpenApiMetadataExtractors.getJsDocTags(firstLine)
					.map(t => (<ITransformerMetadata>{
						type: IMetadataType.OpenApi,
						key: OpenApiMetadataType.Tag,
						value: t,
					}))
					.forEach(t => metadata.push(t));
			}
        }
        
        return metadata;
	}
	
	public static ExtractMethodJsDocMetadata(method: IHandlerTreeNodeHandler, methodNode: ts.MethodDeclaration): ITransformerMetadata[] {
		const metadata: ITransformerMetadata[] = [];
		if (method.type !== HandlerTreeNodeType.Handler) {
			return metadata;
		}

        if (isNodeWithJsDoc(methodNode) && methodNode.jsDoc.length > 0) {
            // Method description
			metadata.push({
				type: IMetadataType.OpenApi,
				key: OpenApiMetadataType.Description,
				value: methodNode.jsDoc.reduce((prev, current) => prev + current.comment, ''),
            });
            
            // Return tag
            const returnTag = OpenApiMetadataExtractors.jsdocTagString(ts.getJSDocReturnTag(methodNode));
            if (returnTag) {
                metadata.push({
                    type: IMetadataType.OpenApi,
                    key: OpenApiMetadataType.ResponseDescription,
                    value: returnTag,
                });
            }

            // Method summary and jsdoc tags
			const firstLine = OpenApiMetadataExtractors.getFirstCommentLine(methodNode);
			if (firstLine) {
				metadata.push({
					type: IMetadataType.OpenApi,
					key: OpenApiMetadataType.Summary,
					value: firstLine.comment,
				});

				OpenApiMetadataExtractors.getJsDocTags(firstLine)
					.map(t => (<ITransformerMetadata>{
						type: IMetadataType.OpenApi,
						key: OpenApiMetadataType.Tag,
						value: t,
					}))
					.forEach(t => metadata.push(t));
			}
        }
        
        return metadata;
    }

	private static getFirstCommentLine(methodNode: WithJsDoc) {
		return methodNode.jsDoc.find(n => n && n.comment && n.comment.length > 0);
	}

    private static getJsDocTags(node: ts.JSDoc): IExtractedTag[] {
		if (node.tags) {
			return (
				node.tags
					.filter(t => t.tagName.text === OpenApiMetadataExtractors.JsDocTagTag)
					.map(t => {
						const parts = t.comment.split(/\s+/);
						return {
							name: parts.shift(),
							description: parts.join(' '),
						};
					})
			);
		}

		return [];
	}

	private static jsdocTagString(tag: ts.JSDocTag | undefined): string {
		if (tag) {
			return tag.comment;
		}

		return undefined;
	}
}