import * as fs from 'fs';

export interface PackageJson {
    version: string;
    name?: string;
    description?: string;
    author?: string;
    license?: string;
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