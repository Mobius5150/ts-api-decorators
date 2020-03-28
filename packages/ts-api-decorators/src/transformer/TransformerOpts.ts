import * as fs from 'fs';
import * as path from 'path';
import { IDecorator } from './Decorator';
import { register } from 'ts-node';

export interface ITransformerOpts {
	/**
	 * An array of relative paths to files which contain one or more decorators as a default export.
	 */
	customDecorators?: string[];
}

export class TransformerOpts implements ITransformerOpts {
	public static readonly TransformerOptsFile = 'tsapiconfig.json';
	private static TsNodeRegistered = false;

	/**
	 * Parses transformer options in the root directory, if present.
	 * @param rootDir 
	 */
	public static ParseTransformerOpts(rootDir: string): TransformerOpts {
		const optsFilePath = path.join(rootDir, TransformerOpts.TransformerOptsFile);
		if (fs.existsSync(optsFilePath)) {
			const strContents = fs.readFileSync(optsFilePath, { encoding: 'utf8' });
			let contents: ITransformerOpts;
			try {
				contents = JSON.parse(strContents);
			} catch (e) {
				throw new Error(`${optsFilePath} contains invalid JSON`);
			}

			// TODO: file schema validation

			return new TransformerOpts(rootDir, {
				customDecorators: contents.customDecorators,
			});
		}
	}

	public constructor(
		public readonly rootDir: string,
		private readonly rootConfig: ITransformerOpts,
	) {}

	public get customDecorators() {
		return this.rootConfig.customDecorators || [];
	}

	public loadCustomDecorators(): IDecorator[] {
		if (!TransformerOpts.TsNodeRegistered) {
			register();
			TransformerOpts.TsNodeRegistered = true;
		}
		
		return <IDecorator[]>this.customDecorators
			.map(d => <IDecorator[] | IDecorator>require(d))
			.reduce((p, c) => (<IDecorator[]>p).concat(Array.isArray(c) ? c : [c]), []);
	}
}