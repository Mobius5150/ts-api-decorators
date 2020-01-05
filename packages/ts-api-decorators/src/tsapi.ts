#!/usr/bin/env node
import { TsApiCommandLine } from './command/TsApiCommandLine';

const program = new TsApiCommandLine();
program.addCommands(program.getBuiltinCommands());
program.parse(process.argv);