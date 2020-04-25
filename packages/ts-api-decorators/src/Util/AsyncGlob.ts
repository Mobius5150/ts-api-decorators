import * as glob from 'glob';

export function asyncGlob(path: string, options?: glob.IOptions, g: (pattern: string, options: glob.IOptions, cb: (err: Error | null, matches: string[]) => void) => void = glob): Promise<string[]> {
	return new Promise<string[]>((resolve, reject) => {
		try {
			g(path, options, (err, matches) => {
				if (err) {
					reject(err);
				}
				else {
					resolve(matches);
				}
			});
		}
		catch (e) {
			reject(e);
		}
	});
}