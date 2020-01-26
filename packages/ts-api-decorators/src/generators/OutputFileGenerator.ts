import * as path from 'path';
import * as glob from 'glob';
import * as fs from 'promise-fs'
import * as parseIgnore from 'parse-gitignore';
import { asyncGlob } from '../Util/AsyncGlob';
import { OutputFileGeneratorFunc } from './IGenerator';

interface IOutputFile {
	path: string;
	generatorFunc: OutputFileGeneratorFunc;
}

export class OutputFileGenerator {
	public static readonly IGNORE_FILE = '.tsapi-generator-ignore';
	private outFiles: Map<string, IOutputFile> = new Map();
	private untouchableFiles: Set<string>;
	private readonly baseDir: string;

	constructor(
		baseDir: string
	) {
		if (path.isAbsolute(baseDir)) {
			this.baseDir = baseDir;
		} else {
			this.baseDir = path.join(process.cwd(), baseDir);
		}
	}

	addOutputFile(filePath: string, generatorFunc: OutputFileGeneratorFunc): void {
		if (this.outFiles.has(filePath)) {
			throw new Error(`Output file already registered: ${filePath}`);
		}

		if (path.isAbsolute(filePath)) {
			throw new Error('Output file paths must be relative to the root directory');
		}

		this.outFiles.set(filePath, {
			path: filePath,
			generatorFunc,
		});
	}

	public async generate(): Promise<string[]> {
		if (fs.existsSync(this.baseDir)) {
			const stat = await fs.lstat(this.baseDir);
			if (!stat.isDirectory) {
				throw new Error('Cannot set a file as the output directory');
			}

			if (!this.untouchableFiles) {
				await this.loadUntouchableFiles();
			}

			await this.clearOutputDirectory();
		} else {
			await fs.mkdir(this.baseDir);
		}

		const writtenFiles: string[] = [];
		for (const file of this.outFiles.values()) {
			const outPath = path.join(this.baseDir, file.path);
			if (await this.generateFile(outPath, file)) {
				writtenFiles.push(outPath);
			}
		}

		return writtenFiles;
	}
	
	private async generateFile(outPath: string, file: IOutputFile): Promise<boolean> {
		if (this.isUntouchable(outPath)) {
			return false;
		}

		const dirName = path.dirname(outPath);
		const outBuffer = await file.generatorFunc(outPath);
		if (!outBuffer) {
			return false;
		}

		if (!fs.existsSync(dirName)) {
			await this.createPath(dirName);
		}

		await fs.writeFile(outPath, outBuffer);

		return true;
	}

	private async createPath(dirname: string) {
		const parentName = path.dirname(dirname);
		if (!fs.existsSync(parentName)) {
			await this.createPath(parentName);
		}

		await fs.mkdir(dirname);
	}

	private isUntouchable(file: string): boolean {
		if (!this.untouchableFiles) {
			return false;
		}

		if (!path.isAbsolute(file)) {
			file = path.join(this.baseDir, file);
		}

		return this.untouchableFiles.has(file);
	}
	
	private async loadUntouchableFiles() {
		const ignoreFile = this.getIgnoreFilePath();
		if (!fs.existsSync(ignoreFile)) {
			this.untouchableFiles = new Set();
			return;
		}

		const patterns: string[] = parseIgnore(
			await fs.readFile(ignoreFile, { encoding: this.getDefaultEncoding() }));

		this.untouchableFiles = new Set(
			(await Promise.all(
				patterns
					.map(p => this.matchPatternInOutputDir(p))
			))
				.reduce((prev, curr) => prev.concat(curr), [])
				.map(f => path.resolve(this.baseDir, f)),
		);

		this.untouchableFiles.add(ignoreFile);
	}
	
	private matchPatternInOutputDir(p: string): Promise<string[]> {
		return asyncGlob(p, {
			cwd: this.baseDir,
		});
	}

	private getIgnoreFilePath(): string {
		return path.join(this.baseDir, OutputFileGenerator.IGNORE_FILE);
	}

	private getDefaultEncoding(): string {
		return 'utf8';
	}

	private async clearOutputDirectory(dir: string = this.baseDir): Promise<boolean> {
		let hadUntouchableFiles = false;
		for (const fileName of await fs.readdir(dir)) {
			const file = path.join(dir, fileName);
			if (this.isUntouchable(file)) {
				hadUntouchableFiles = true;
				continue;
			}

			const fileStat = await fs.lstat(file);
			if (fileStat.isDirectory()) {
				if (!await this.clearOutputDirectory(file)) {
					await fs.rmdir(file);
				}
			} else if (fileStat.isFile()) {
				await fs.unlink(file);
			}
		}

		return hadUntouchableFiles;
	}
}