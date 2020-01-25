import * as commander from 'commander';
import * as path from 'path';
import { getPackageVersion } from './CommandUtil';
import { CliCommand } from './CliCommand';
import { ExtractCommand } from './ExtractCommand';
import { ClassConstructor1 } from '../Util/ClassConstructors';

export type CommandConstructor<T extends CliCommand = CliCommand> = ClassConstructor1<commander.Command, T>;

export interface IRegistrableCommand {
	registerWithProgram(program: commander.Command): void;
}

export class TsApiCommandLine {
	protected program: commander.Command;
	protected commands: Set<CliCommand> = new Set();
	
	constructor() {
		this.program = new commander.Command();
		this.program.version(getPackageVersion());
	}

	public addComamnd<T extends CliCommand>(constr: CommandConstructor<T>): T {
		const cmd = new constr(this.program);
		this.commands.add(cmd);
		return cmd;
	}

	public addCommands(commands: CommandConstructor[]): CliCommand[] {
		return commands.map(c => this.addComamnd(c));
	}

	public registerCommand(cmd: IRegistrableCommand & CliCommand) {
		this.commands.add(cmd);
		cmd.registerWithProgram(this.program);
	}

	public getBuiltinCommands(): CommandConstructor[] {
		return [
			ExtractCommand,
			...this.tryGetPeerLibCommands(),
		];
	}

	public tryGetPeerLibCommands(): CommandConstructor[] {
		const peerLibs = ['azure-function', 'express'];
		const paths = [
			path.join(__dirname, '../../../'),
		];
		let outLibs: CommandConstructor[] = [];
		for (const libName of peerLibs) {
			let libPath: string;
			try {
				libPath = require.resolve(`ts-api-decorators-${libName}/dist/commands`, {paths});
			} catch (e) {
				continue;
			}

			const lib = require(libPath);
			if (Array.isArray(lib.default)) {
				outLibs = outLibs.concat(lib.default);
			}
		}

		return outLibs;
	}

	public parse(argv: string[]) {
		this.program.parse(argv);
	}
}