import ts = require("typescript");

export function combineTsComments(comment: undefined | string | ts.NodeArray<ts.JSDocComment>): string | undefined {
    if (typeof comment === 'undefined' || typeof comment === 'string') {
        return comment;
    }

    return collapseComments(comment);
}

function collapseComments(comments: ts.NodeArray<ts.JSDocComment>): string | undefined {
    return comments.map(c => c.text).reduce((p, c) => p + c, '');
}