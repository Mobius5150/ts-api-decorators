import { Readable } from "stream";

export function readStreamToStringUtil(stream: Readable, textEncoding: string = 'utf8'): () => Promise<string> {
    let error: Error;
    let result: string;
    return () => new Promise<string>((resolve, reject) => {
        if (error) {
            reject(error);
            return;
        } else if (result) {
            resolve(result);
            return;
        } else if (!stream.readable) {
            reject(new Error('Unreadable stream'));
            return;
        }
        
        const chunks: (Buffer | string)[] = [];
        function exceptionOccured(err: Error) {
            if (!error) {
                error = err;
                reject(error);
            }
        }

        stream.on('data', (chunk: any) => {
            if (typeof chunk === 'string' || chunk instanceof Buffer) {
                chunks.push(chunk);
            } else {
                exceptionOccured(new Error('Unexpected chunk type: ' + typeof chunk));
            }
        });

        stream.on('end', () => {
            if (!error && !result) { 
                try {
                    const chunkStrs = chunks.map(c => c instanceof Buffer
                        ? (c.toString(textEncoding))
                        : c);
                    
                    result = chunkStrs.join('');
                    resolve(result);
                } catch (e) {
                    if (e instanceof Error) {
                        exceptionOccured(e);
                    } else {
                        exceptionOccured(new Error('Unknown error occured building string: ' + e));
                    }
                }
            }
        });

        stream.on('error', (err) => {
            exceptionOccured(err);
        });
    });
}

export function readStreamToStringUtilCb(stream: Readable, textEncoding: string = 'utf8'): (cb: (err: any, contents?: string) => void) => void {
    return (cb: (err: any, contents?: string) => void) => {
        readStreamToStringUtil(stream, textEncoding)()
            .then(r => cb(undefined, r))
            .catch(e => cb(e, undefined));
    };
}