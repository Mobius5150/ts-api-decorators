import * as fs from 'fs';

export interface IPackageJsonAuthor {
    name?: string;
    email?: string;
    url?: string;
}

export interface PackageJson {
    version: string;
    name?: string;
    description?: string;
    author?: string | IPackageJsonAuthor;
    license?: string;
    homepage?: string;
    host?: string;
    basePath?: string;
}

let packageJson: PackageJson = null;
function loadPackageJson() {
    if (!packageJson) {
        packageJson = require('../../package.json');
    }

    return packageJson;
}

export function getPackageVersion() {
    return loadPackageJson().version;
}

export function getPackageJsonAuthor(pkg: PackageJson): IPackageJsonAuthor | undefined {
    if (typeof pkg.author === 'object') {
        return {
            name: pkg.author.name,
            email: pkg.author.email,
            url: pkg.author.url,
        };
    } else if (typeof pkg.author === 'string') {
        return {
            name: getFirstMatch(/^[^(<]+/.exec(pkg.author)),
            email: getFirstMatch(/<([^>]+)>/.exec(pkg.author)),
            url: getFirstMatch(/\(([^)]+)\)/.exec(pkg.author)),
        }
    } else {
        return undefined;
    }
}

function getFirstMatch(arr: RegExpExecArray): string | undefined {
    if (arr && arr.length > 1) {
        return arr[1].trim();
    } else if (arr && arr.length > 0) {
        return arr[0].trim();
    }
}