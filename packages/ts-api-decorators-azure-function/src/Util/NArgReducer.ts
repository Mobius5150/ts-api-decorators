interface MapOrSet<A, T> {
	args?: A;
	map?: Map<any, MapOrSet<A, T>>;
	// set?: T[];
}

export class NArgReducer<Args extends Array<any>, T> {
	private reduced = new Map<Args, T[]>();
	private mapOrSet: MapOrSet<Args, T> = {
		map: new Map(),
	};

	public add(args: Args, value: T): void {
		this.getSet(args, this.mapOrSet).push(value);
	}

	public getReduced(): Map<Args, T[]> {
		return new Map(this.reduced);
	}

	// public getReduced(): Map<Args, T[]> {
	// 	const result = new Map<Args, T[]>();
	// 	for (const [args, tArray] of this._getReduced(this.reduced)) {
	// 		result.set(args, tArray);
	// 	}
	// 	return result;
	// }

	// private _getReduced(reduced: MapOrSet<Args, T>): ([Args, T[]])[] {
	// 	let result: ([Args, T[]])[][] = [[]];
	// 	if (reduced.args) {
	// 		result[0].push([reduced.args, reduced.set]);
	// 	}

	// 	if (this.reduced.map) {
	// 		for (const ms of this.reduced.map) {
				
	// 		}
	// 	}

	// 	return result.reduce()
	// }

	private getSet(args: Args, current: MapOrSet<Args, T>, index: number = 0) {
		if (args.length === index) {
			if (!current.args) {
				current.args = args;
				this.reduced.set(args, []);
				// current.set = [];
			}

			return this.reduced.get(current.args);
		}

		if (!current.map) {
			current.map = new Map();
		}

		const currentArg = args[index];
		if (!current.map.has(currentArg)) {
			current.map.set(currentArg, {});
		}

		return this.getSet(args, current.map.get(currentArg), index + 1);
	}
}