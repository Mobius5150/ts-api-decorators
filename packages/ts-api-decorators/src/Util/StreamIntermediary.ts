import * as stream from 'stream';
import { Func1 } from './Func';

export abstract class StreamIntermediary {
	public static GetStreamIntermediary(): stream.Duplex {
		const chunks: { chunk: any; callback: Func1<Error>; }[] = [];
		let done = false, readable = false;
		let finalCb: Func1<Error>;

		return new stream.Duplex({
			read: function (size) {
				readable = true;
				while (readable && chunks.length > 0) {
					const [chunk] = chunks.splice(0, 1);
					readable = this.push(chunk.chunk);
					chunk.callback(null);
				}

				if (done) {
					finalCb(null);
					return null;
				}
			},
			write: function (chunk, encoding, callback) {
				if (typeof encoding === 'string') {
					chunk = Buffer.from(<string>chunk, <BufferEncoding>encoding);
				}

				chunks.push({ chunk, callback });

				while (readable && chunks.length > 0) {
					const [{ chunk, callback }] = chunks.splice(0, 1);
					readable = this.push(chunk);
					callback(null);
				}
			},
			final: function (callback) {
				done = true;
				finalCb = (e) => {
					if (readable) {
						this.push(null);
					}

					readable = false;
					callback(e);
				};

				if (chunks.length === 0) {
					finalCb(null);
				}
			}
		});;
	}
}
