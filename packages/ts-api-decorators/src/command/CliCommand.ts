import * as ts from 'typescript';
import { ParsedCommandLine } from 'typescript';
import { IProgramInfo } from './IProgramInfo';
import { IParseOptions } from './ProgramOptions';
import { ApiMethod } from '..';
import { IHandlerTreeNodeRoot, WalkTreeByType, isHandlerNode, IHandlerTreeNodeHandler, MergeHandlerTreeRoots } from '../transformer/HandlerTree';

export interface IParseApiResult {
    compilationResult: { [path: string]: ts.TransformationResult<ts.Node> };
    tree: IHandlerTreeNodeRoot;
    programInfo: IProgramInfo;
    tsConfig?: ParsedCommandLine;
    tsConfigPath?: string;
}

export abstract class CliCommand {
    private console: typeof console = console;

    protected async wrapCliError(f: Function) {
        try {
            await f();
        } catch (e) {
            this.handleError(e);
            throw e;
        }
    }

    protected async handleError(err: any) {
        console.error('Error processing command: ');
        console.error(err);
    }

    protected disableConsoleOutput() {
        this.console = {...console};
        for (const key of Object.keys(console)) {
            if (typeof console[key] === 'function') {
                console[key] = () => {};
            }
        }
    }

    protected enableConsoleOutput() {
        for (const key of Object.keys(this.console)) {
            if (typeof console[key] === 'function') {
                console[key] = this.console[key];
            }
        }
    }

    protected printExtractionSummary(options: IParseOptions, api: IParseApiResult, tree: IHandlerTreeNodeRoot): string {
        const Table = require('cli-table');
        const table = new Table({
            head: ['Method', 'Route', 'File'],
        });

        const methodRoutes = new Map<ApiMethod, Set<string>>();
        for (const handler of WalkTreeByType(tree, isHandlerNode)) {
            if (!methodRoutes.has(handler.apiMethod)) {
                methodRoutes.set(handler.apiMethod, new Set<string>());
            }

            const methodMath = methodRoutes.get(handler.apiMethod);
            if (!methodMath.has(handler.route)) {
                methodMath.add(handler.route);
                table.push([handler.apiMethod, handler.route, handler.location.file]);
            }
        };

        return table.toString();
    }
}