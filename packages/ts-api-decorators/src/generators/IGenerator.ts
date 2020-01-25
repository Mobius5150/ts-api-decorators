import { IHandlerTreeNode } from "../transformer/HandlerTree";

export type OutputFileGeneratorFunc = (path: string) => Promise<Buffer>;

export interface IGenerator {
	forTree(routes: IHandlerTreeNode[]): OutputFileGeneratorFunc;
}