import * as glob from 'glob';

export function asyncGlob(path: string, options?: glob.IOptions): Promise<string[]> {
	return new Promise<string[]>((resolve, reject) => {
		try {
			glob(path, options, (err, matches) => {
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