import { getDefaultCompilerOptions, compileSources } from 'ts-api-decorators/dist/Testing/TestUtil';
import * as ts from 'typescript';
import transformer from '../src/transformer';
import { spawn, ChildProcess } from 'child_process';
import { Command } from 'commander';
import { AzureFunctionGenerateCommand } from '../src/commands';
import { PackageJson } from 'ts-api-decorators/dist/command/CommandUtil';
import { assert } from 'chai';
import * as path from 'path';
import * as fs from 'fs';
import * as bent from 'bent';
import * as rimraf from 'rimraf';

export interface TestServerOpts {
	sourceFile: string,
	packageJson: string,
	tsConfigJson: string;
	compileOutDir: string,
	functionsOutDir: string,
	startTimeout: number,
	portNo: number,
	storageAccount?: string,
	executionTimeout?: number,
	pollFrequency?: number,
	showOutputOnExit?: boolean,
	disableDevelopmentStorage?: boolean,
	packageSymlink?: string,
}

export interface WaitTillConditionTrueArgs {
	testInterval?: number;
	timeout?: number;
};

export function propsFromObject<T extends object>(obj: T, props: Array<keyof T>): Partial<T> {
	const r: Partial<T> = {};
	for (const prop of props) {
		r[prop] = obj[prop];
	}

	return r;
}

export function waitTillConditionTrue(testFunc: () => Promise<boolean> | boolean, args: WaitTillConditionTrueArgs) {
	args = {
		testInterval: 100,
		timeout: 30000,
		...args,
	};

	const startTime = Date.now();
	return new Promise<void>(async (resolve, reject) => {
		while ((Date.now() - startTime) <= args.timeout) {
			const result = await testFunc();
			if (result) {
				resolve();
			} else {
				await asyncWait(args.testInterval);
			}
		}

		reject(new Error(`waitTillConditionTrue timed out after ${Date.now() - startTime}ms`));
	});
}

export function asyncWait(timeout: number) {
	return new Promise<void>((resolve) => {
		setTimeout(() => {
			resolve();
		}, timeout);
	});
}

export class TestServer {
	private static readonly WebJobsStorageEnvName = 'AzureWebJobsStorage';
	private process: ChildProcess;
	private stopRequested = false;
	private exitCode = undefined;
	private outputs: { [key: string]: string[] } = {
		'stderr': [],
		'stdout': [],
		'combined': [],
	};

	constructor(
		private readonly opts: TestServerOpts,
	) {
	}

	private removeDir(dir: string) {
		return new Promise<void>((resolve, reject) => {
			rimraf(dir, e => {
				if (e) {
					reject(e);
				} else {
					resolve();
				}
			});
		});
	}

	private cleanDirsIfFound(dirs: string[]) {
		return Promise.all(dirs.map(d => {
			if (fs.existsSync(d)) {
				return this.removeDir(d);
			}
		}));
	}

	public async start(): Promise<void> {
		await this.cleanDirsIfFound([
			this.opts.compileOutDir,
			this.opts.functionsOutDir,
		]);

		if (this.opts.packageSymlink) {
			await this.createPackageSymlink();
		}

		let commander = new Command();
		new AzureFunctionGenerateCommand(commander, {
			alternateLibIncludePath: path.relative(
				path.join(this.opts.functionsOutDir, 'func'),
				path.resolve(__dirname, '../dist')),
		});
		await commander.parseAsync([
			'node',
			'test',
			'azfunc-generate',
			this.opts.sourceFile,
			this.opts.functionsOutDir,
			'--tsconfig',
			this.opts.tsConfigJson,
			'--apiInfo',
			this.opts.packageJson,
			'--silent',
			'--httpPrefix',
			'<none>'
		]);
		
		const options: ts.CompilerOptions = {
			...getDefaultCompilerOptions(),
			outDir: this.opts.compileOutDir,
			project: this.opts.tsConfigJson,
		};

		const program = ts.createProgram([this.opts.sourceFile], options);
		program.emit(program.getSourceFile(this.opts.sourceFile), undefined, undefined, false, {
			before: [transformer(program)]
		});
		
		assert(fs.existsSync(this.opts.compileOutDir), 'output directory should exist');
		assert(fs.existsSync(this.opts.functionsOutDir), 'function directory should exist');

		const startedTime = Date.now();
		this.process = spawn(this.getAzureFunctionsExecutable(), [
			'start',
			'--port',
			this.opts.portNo.toString(),
			'--timeout',
			this.opts.startTimeout.toString(),
			'--javascript'
		], {
			cwd: this.opts.functionsOutDir,
			env: {
				...process.env,
				[TestServer.WebJobsStorageEnvName]: this.getStorage(),
			}
		});

		this.process.stderr.on('data', this.getOutputHandler('stderr'));
		this.process.stdout.on('data', this.getOutputHandler('stdout'));
		this.process.on('error', e => this.handleProcessError(e));
		this.process.on('close', (code, signal) => this.handleProcessClosed(code, signal));
		this.process.on('message', (m, sendHandle) => console.log(`Chid process sent message: ${m}`));

		return new Promise((resolve, reject) => {
			let resolved = false;
			const request = bent(this.getBaseUrl(), 'GET', 200);
			const stopPolling = (resolution: () => void) => {
				if (!resolved) {
					resolved = true;
					clearInterval(interval);
					resolution();
				}
			};
			let interval = setInterval(async () => {
				if (typeof this.exitCode !== 'undefined') {
					stopPolling(resolve);
					return;
				}

				if (this.stopRequested) {
					stopPolling(() => reject(new Error('Stop requested')));
					return;
				}

				try {
					await request('/');
					stopPolling(resolve);
				} catch (e) {
					if ((Date.now() - startedTime) >= this.opts.startTimeout) {
						stopPolling(() => reject(new Error('Azure functions start timed out')));
					}
				}
			}, this.opts.pollFrequency || 1000);
		});
	}
	
	private getOutputHandler(type: 'stderr' | 'stdout'): (chunk: any) => void {
		return (chunk: any) => {
			const chunkstr = chunk.toString();
			this.outputs[type].push(chunkstr);
			this.outputs['combined'].push(chunkstr);
		};
	}

	public getBaseUrl(): string {
		return `http://localhost:${this.opts.portNo}`;
	}

	public isRunning(): boolean {
		return !!this.process && typeof this.exitCode === 'undefined';
	}

	public getStdOut(): string {
		return this.outputs['stdout'].join('');
	}

	public getStdErr(): string {
		return this.outputs['stderr'].join('');
	}

	public getCombinedOutput(): string {
		return this.outputs['combined'].join('');
	}

	private getAzureFunctionsExecutable(): string {
		let modulePath = require.resolve('azure-functions-core-tools/lib/main');
		if (!fs.existsSync(modulePath)) {
			throw new Error('Could not locate module `azure-functions-core-tools`, is it installed?')
		}

		modulePath = path.join(modulePath, '../../bin/func');
		for (let ending of ['.exe', '']) {
			if (fs.existsSync(modulePath + ending)) {
				return modulePath + ending;
			}
		}

		throw new Error('Found module `azure-functions-core-tools` but could not resolve `func` executable');
	}
	
	private getStorage(): string {
		if (this.opts.storageAccount) {
			return this.opts.storageAccount;
		}

		if (process.env[TestServer.WebJobsStorageEnvName]) {
			return process.env[TestServer.WebJobsStorageEnvName];
		}

		if (this.opts.disableDevelopmentStorage) {
			throw new Error('No storage environment specified for functions hosts');
		}

		return 'UseDevelopmentStorage=true';
	}

	private handleProcessClosed(code: number, signal: string): void {
		this.exitCode = code;
		if (this.opts.showOutputOnExit) {
			console.log(`Process exited with code: ${code}`, signal);
			console.log('Combined output: ', this.getCombinedOutput());
		}
	}

	private handleProcessError(e: Error): void {
		console.error(`Process error: `, e);
		if (this.opts.showOutputOnExit) {
			console.log('Combined output: ', this.getCombinedOutput());
		}
	}

	public async stop() {
		this.stopRequested = true;
		if (this.process && typeof this.exitCode === 'undefined') {
			this.process.kill('SIGKILL');
		}
	}

	private async createPackageSymlink() {
		const packagePath = path.resolve(__dirname, '../');
		const packageJson: PackageJson = JSON.parse(fs.readFileSync(path.join(packagePath, '/package.json'), { 'encoding': 'utf8' }));
		if (!fs.existsSync(this.opts.packageSymlink)) {
			fs.mkdirSync(this.opts.packageSymlink);
		}

		const destinationPath = path.join(this.opts.packageSymlink, `/${packageJson.name}`);
		fs.symlinkSync(packagePath, destinationPath, 'dir');
	}
}