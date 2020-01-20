export function trimLeft(trimStr: string, trimChar: string): string {
	while (trimStr.startsWith(trimChar)) {
		trimStr = trimStr.substr(1);
	}

	return trimStr;
}