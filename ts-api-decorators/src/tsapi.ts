import * as commander from 'commander';
import { getPackageVersion } from './command/CommandUtil';
import { ExtractCommand } from './command/ExtractCommand';

const program = new commander.Command();
program.version(getPackageVersion());
new ExtractCommand(program);
program.parse(process.argv);