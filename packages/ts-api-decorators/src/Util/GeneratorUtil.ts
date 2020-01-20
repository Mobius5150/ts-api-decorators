import { ParsedCommandLine } from 'typescript';
import * as stripDirs from 'strip-dirs';
import * as path from 'path';

export abstract class GeneratorUtil {
	public static GetTsFileOutputPath(tsconfig: ParsedCommandLine, tsconfigPath: string, file: string): string {
		if (tsconfig && tsconfig.options && typeof tsconfig.options.outDir === 'string') {
			const baseDir = path.dirname(tsconfigPath);
			file = path.join(
				tsconfig.options.outDir,
				stripDirs(file.substr(baseDir.length + 1), 1));
		}

		return path.join(
			path.dirname(file),
			path.basename(file, path.extname(file))
		);
	}

	public static NormalizePathSlashes(path: string): string {
		return path.replace(/\\/g, '/');
	}
}