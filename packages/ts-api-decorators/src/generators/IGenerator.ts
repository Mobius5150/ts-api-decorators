import { IHandlerTreeNode } from "../transformer/HandlerTree";

export type OutputFileGeneratorFunc = (path: string) => Promise<Buffer | void>;

export interface IGenerator {
	forTree(routes: IHandlerTreeNode[]): OutputFileGeneratorFunc;
}