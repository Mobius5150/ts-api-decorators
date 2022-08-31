import type { PackageJson } from 'types-package-json';
import * as commander from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import * as chalk from 'chalk';
import * as ora from 'ora';
import { spawn } from 'child_process';

const versionRegex = /\d+\.\d+\.\d+/;
const packageJsonFile = 'package.json';
const projectDirectories = initDirectories();
const toolPackageJson = loadPackageJson(path.join(projectDirectories.publishTool, packageJsonFile));
let enableSubcommandSpew: boolean = false;
const program = new commander.Command();
if (toolPackageJson) {
    program.version(toolPackageJson.version);
} else {
    throw new Error(`Could not find the package.json for this tool at: ` + path.join(projectDirectories.publishTool, packageJsonFile));
}

interface PublishCommandArgs {
    dryRun: boolean;
    publish: boolean;
    list: boolean;
    build: boolean;
    liveOutput: boolean;
}

program
    .command('list')
    .action(() => {
        console.log(`Discovering packages...`)
        const packages = findPackages();
        printPackageList(packages);
    });

program
    .command('publish [version]')
    .option('--list', 'List found packages and exit', false)
    .option('--dry-run', 'Whether to do a dry run of the publish without publishing', false)
    .option('--publish', 'Whether to publish packages to npm', false)
    .option('--build', 'Build and test the updated packages - automatic if publish is set', false)
    .option('--live-output', 'Show live output of commands run', false)
    .action(async (version: string, opts: PublishCommandArgs) => {
        if (!versionRegex.test(version)) {
            throw new Error('Supplied version did not match expected pattern: major.minor.incremental');
        }

        enableSubcommandSpew = opts.liveOutput;

        console.log(chalk.green(`Setting package versions and dependencies to: ${version}`));
        if (opts.dryRun) {
            console.log(`✅ Running in dry run mode. No files will be updated and nothing will be published.`);
        } else {
            console.warn(`🚨 Running in real mode - I'll update files on disk`);
        }

        if (opts.publish) {
            if (opts.dryRun) {
                console.error(`Cannot publish in dry run mode`)
                process.exit(1);
            }

            console.warn(`🚨 Running in publish mode - I'll publish packages to NPM`);
            opts.build = true;
        } else {
            console.log(`✅ Will not publish to NPM`);
        }

        console.log();
        console.log(chalk.green(`Discovering packages...`));
        const packages = findPackages();
        printPackageList(packages);

        const packageNames = packages.map(p => p.name);

        for (const pkg of packages) {
            console.log(chalk.green(`Updating package ${pkg.name}...`));
            let madeUpdate = false;
            if (pkg.packageContents.version != version) {
                console.log(`\tversion: ${pkg.packageContents.version} -> ${version}`);
                pkg.packageContents.version = version;
                madeUpdate = true;
            }

            const deps: (keyof PackageJson)[] = [ 'dependencies', 'optionalDependencies', 'devDependencies', 'peerDependencies', 'bundledDependencies'];
            for (const dep of deps) {
                const updates = updateDependencies(dep, <any>pkg.packageContents[dep], packageNames, version);
                for (const update of updates) {
                    madeUpdate = true;
                    console.log(`\t${update.dep}[${update.name}]: ${update.old} -> ${update.new}`);
                }
            }
            
            if (madeUpdate || opts.publish) {
                if (!opts.dryRun) {
                    fs.writeFileSync(pkg.packageJsonPath, JSON.stringify(pkg.packageContents, undefined, 2));
                    if (opts.build) {
                        await runCommand('yarn', ['build'], pkg.path);
                        await runCommand('yarn', ['test'], pkg.path);
                    }
                }
            } else {
                console.log(`\t⚠️ No updates made...`);
            }

            console.log();
        }

        if (opts.publish) {
            console.warn(chalk.yellow(`🚨 STARTING PUBLISH 🚨`));
            for (const pkg of packages) {
                console.log(chalk.yellow(`Building ${pkg.name}@${pkg.packageContents.version}`));
                await runCommand('yarn', ['build'], pkg.path);
                console.log(chalk.yellow(`Publishing ${pkg.name}@${pkg.packageContents.version}`));
                await runCommand('yarn', ['publish', '--no-git-tag-version'], pkg.path);
            }

            console.log(chalk.green(`✅ Publish complete!`));
        }
    });

program.parse(process.argv);

interface DependencyUpdate {
    dep: string;
    name: string;
    old: string;
    new: string;
}

function printPackageList(packages: { name: string; path: string; packageContents: Partial<PackageJson>; }[]) {
    console.log(`Found: `);
    packages.forEach(p => console.log(`\t${p.packageContents.name}@${p.packageContents.version}: ` + chalk.gray(p.path)));
    console.log();
}

function findPackages() {
    return fs.readdirSync(projectDirectories.packages, { withFileTypes: true })
        .filter(f => f.isDirectory)
        .map(d => ({
            name: d.name,
            path: path.join(projectDirectories.packages, d.name),
            packageJsonPath: path.join(projectDirectories.packages, d.name, packageJsonFile),
            packageContents: loadPackageJson(path.join(projectDirectories.packages, d.name, packageJsonFile)),
        }))
        .filter(p => !!p.packageContents);
}

function updateDependencies(name: string, deps: PackageJson['dependencies'], searchDeps: string[], toVersion: string): DependencyUpdate[] {
    if (!deps) {
        return [];
    }

    const updates: DependencyUpdate[] = [];
    for (const search of searchDeps) {
        if (deps[search]) {
            const update: DependencyUpdate = {
                dep: name,
                name: search,
                old: deps[search],
                new: deps[search].replace(versionRegex, toVersion),
            };
            
            if (update.old !== update.new) {
                deps[search] = update.new;
                updates.push(update);
            }
        }
    }

    return updates;
}

function loadPackageJson(path: string): Partial<PackageJson> {
    if (!fs.existsSync(path)) {
        return null;
    }

    return JSON.parse(fs.readFileSync(path, { encoding: 'utf-8' }));
}

function initDirectories(): { 
    root: string,
    packages: string,
    publishTool: string,
} {
    const root = path.resolve(__filename, '../../../../');
    const packages = path.join(root, 'packages');
    const publishTool = path.join(root, 'utils/publish-util');
    [root, packages, publishTool].forEach(dir => {
        if (!fs.existsSync(dir)) {
            throw new Error('Could not find expected directory: ' + dir);
        }
    });
    return {
        root,
        packages,
        publishTool,
    }
}

function runCommand(command: string, args: string[], cwd: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const spinner = ora({
            text: `Running ${[command, ...args].join(' ')}`,
            prefixText: '\t',
            isEnabled: enableSubcommandSpew ? false : undefined,
        }).start();
        const proc = spawn(command, args, { cwd });
        let logs: { stream: 'stdout' | 'stderr', data: any }[] = [];
        function logData(stream: 'stdout' | 'stderr', data: any) {
            logs.push({ stream, data });
            if (enableSubcommandSpew) {
                outputLog();
            }
        }
        function outputLog() {
            for (const log of logs) {
                if (log.stream === 'stdout') {
                    console.log(chalk.gray(`\t${log.data}`));
                } else {
                    console.log(chalk.red(`\t${log.data}`));
                }
            }

            logs = [];
        }
        proc.stdout.on("data", data => {
            logData('stdout', data);
        });
        
        proc.stderr.on("data", data => {
            logData('stderr', data);
        });
        proc.on('error', reject);
        proc.on('close', code => {
            spinner.stopAndPersist({
                symbol: code ? '❌' : '✅',
            });

            if (code) {
                outputLog();
                reject(new Error(`Child process exited with code ${code}`))
            } else {
                resolve();
            }
        });
    });
}