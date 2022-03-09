import * as stream from 'stream';
import { ManagedApi } from '../apiManagement';
import { Func1 } from './Func';

export class StreamIntermediary<TransportParamsType extends object> extends stream.Duplex {
	private _chunks: { chunk: any; callback: Func1<Error>; }[] = [];
	private _done = false;
	private _readable = false;
	private _finalCb: Func1<Error>;

	constructor(
		private managedApi?: ManagedApi<TransportParamsType>,
	) {
		super();

		if (this.managedApi) {
			this.setHeader = (name: string, value: string | number) => {
				this.managedApi.setHeader(name, value)
			};
		}
	}

	_read(size) {
		this._readable = true;
		while (this._readable && this._chunks.length > 0) {
			const [chunk] = this._chunks.splice(0, 1);
			this._readable = this.push(chunk.chunk);
			chunk.callback(null);
		}

		if (this._done) {
			this._finalCb(null);
			return null;
		}
	}

	_write(chunk, encoding, callback) {
		this._readable = true;
		if (typeof encoding === 'string') {
			chunk = Buffer.from(<string>chunk, <BufferEncoding>encoding);
		}

		this._chunks.push({ chunk, callback });

		while (this._readable && this._chunks.length > 0) {
			const [{ chunk, callback }] = this._chunks.splice(0, 1);
			this._readable = this.push(chunk);
			callback(null);
		}
	}

	_final (callback) {
		this._done = true;
		this._finalCb = (e) => {
			if (this._readable) {
				this.push(null);
			}

			this._readable = false;
			callback(e);
		};

		if (this._chunks.length === 0) {
			this._finalCb(null);
		}
	}

	public setHeader?: (name: string, value: string) => void;

	public static GetStreamIntermediary<TransportParamsType extends object>(managedApi?: ManagedApi<TransportParamsType>): stream.Duplex {
		return new StreamIntermediary(managedApi);
	}
}
