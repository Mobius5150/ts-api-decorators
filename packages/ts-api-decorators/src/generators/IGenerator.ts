import { IExtractedApiDefinitionWithMetadata } from "../transformer/ExtractionTransformer";

export type OutputFileGeneratorFunc = (path: string) => Promise<Buffer>;

export interface IGenerator {
	forRoutes(routes: IExtractedApiDefinitionWithMetadata[]): OutputFileGeneratorFunc;
}