import { Func } from "./Func";

export function promisifyEvent<T extends { on(event: EventType, cb: FuncType): any }, EventType extends string = string, FuncArgs extends Array<any> = [], FuncType extends (...a: FuncArgs) => {} = Func>(
	obj: T,
	event: EventType,
	args?: { timeout?: number, }
): Promise<FuncArgs> {
	return new Promise((resolve, reject) => {
		let timeout = args?.timeout ? setTimeout(() => {
			timeout = null;
			reject(new Error(`Timed out waiting ${args.timeout}ms for event '${event}'`));
		}, args.timeout) : null;

		obj.on(event, <FuncType>function () {
			if (timeout) {
				clearTimeout(timeout);
			}
			resolve(<FuncArgs>Array.from(arguments));
		});
	});
}