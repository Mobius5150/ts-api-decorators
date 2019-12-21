import * as glob from 'glob';

export function asyncGlob(path: string): Promise<string[]> {
	return new Promise<string[]>((resolve, reject) => {
		try {
			glob(path, (err, matches) => {
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