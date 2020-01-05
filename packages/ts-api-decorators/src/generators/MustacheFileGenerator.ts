import * as Mustache from 'mustache';
import * as fs from 'promise-fs';

export class MustacheFileGenerator {
	private template: string;

	constructor(
		private readonly templatePath: string,
		private readonly templateEncoding: string = 'utf8'
	) {}

	public async generate(options: object, partials?: object, tags?: string[]): Promise<Buffer> {
		return Buffer.from(Mustache.render(
			await this.loadTemplate(),
			options,
			partials,
			tags
		));
	}
	
	private async loadTemplate(): Promise<string> {
		if (!this.template) {
			this.template = await fs.readFile(this.templatePath, { encoding: this.templateEncoding });
		}

		return this.template;
	}
}