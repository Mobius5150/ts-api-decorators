import * as http from 'http';
import * as ts from 'typescript';
import {compileSourceFile, getDefaultCompilerOptions, getTransformer} from 'ts-api-decorators/test/TestUtil';

export interface ITestServer {
	start: (portNo: number, started: (err?: any, server?: http.Server) => void) => void;
	stop: () => void;
}

export class TestServer {
	private module: ITestServer;

	constructor(
		private moduleName: string
	) {

	}

	public async start(portNo: number): Promise<http.Server> {
		const options = getDefaultCompilerOptions();
		const program = ts.createProgram([this.moduleName], options);
		// const sourceFile = compileSourceFile(this.moduleName, options, [getTransformer()]);
		program.emit(program.getSourceFile(this.moduleName), undefined, undefined, false, {
			before: [getTransformer()(program)]
		});
		this.module = require(this.moduleName.replace('.ts', '.js')).default;
		return new Promise((resolve, reject) => {
			this.module.start(portNo, (err, server) => {
				if (err) {
					reject(err);
				} else {
					resolve(server);
				}
			});
		});
	}

	public async stop() {
		this.module.stop();
		delete this.module;
		const name = require.resolve(this.moduleName);
		delete require.cache[name];
	}
}