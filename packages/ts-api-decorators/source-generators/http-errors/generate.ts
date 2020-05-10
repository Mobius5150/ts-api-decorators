import { MustacheFileGenerator } from "../../src/generators/MustacheFileGenerator";
import * as yaml from 'js-yaml';
import * as path from 'path';
import * as fs from 'fs';

const yamlFile = path.join(__dirname, './errors.yaml');
const errorFileName = 'GeneratedErrors.ts';
const errorInFile = path.join(__dirname, `./${errorFileName}.mustache`);
const errorOutFile = path.join(__dirname, `../../src/${errorFileName}`);

interface HttpErrorDefinition {
	code: number;
	name: string;
	escapedname: string;
	classname?: string;
	rfc?: string;
	description?: string;
}

console.log(`Reading errors from ${yamlFile}`);
const errors: { errors: HttpErrorDefinition[] } = yaml.load(fs.readFileSync(yamlFile, { encoding: 'utf8' }));
for (const error of errors.errors) {
	if (!error.classname) {
		error.classname = error.name.replace(/[^_A-Za-z0-9]+/g, '');
	}

	error.escapedname = error.name.replace(/'/g, '\\\'');
}

console.log(`Reading template from ${errorInFile}`);
const generator: MustacheFileGenerator = new MustacheFileGenerator(errorInFile);
generator.generate(errors)
	.then((result) => {
		console.log(`Writing generated source to ${errorOutFile}`)
		fs.writeFileSync(errorOutFile, result.toString());
	})
	.catch(e => {
		console.error(e);
		process.exit(1);
	});