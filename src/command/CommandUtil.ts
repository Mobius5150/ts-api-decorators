import * as fs from 'fs';

interface PackageJson {
    version: string;
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