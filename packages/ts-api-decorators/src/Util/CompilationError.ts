import ts = require("typescript");

export class CompilationError extends Error {
    constructor(m: string, node: ts.Node) {
        super(m);
        
        // Set the prototype explicitly.
        Object.setPrototypeOf(this, CompilationError.prototype);

        this.stack = `API Compilation Error: ${m}
    at ${node.getText()} (${node.getSourceFile().fileName}:${node.pos})`;
    }
}