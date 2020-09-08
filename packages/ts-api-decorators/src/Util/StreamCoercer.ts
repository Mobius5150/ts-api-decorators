import * as stream from 'stream';
import * as EventEmitter from 'events';
import { Func1, Func } from './Func';
import { StreamIntermediary } from './StreamIntermediary';

export enum StreamCoercionMode {
	None = 0,
	InheritsStream = 0b1,
	DuckPipe = 0b10,
	Any = 0b111,
	// TODO: Support EventEmitter streams
	// EventEmitter = 0b100,
}

interface IStreamCoercionTest {
	mode: StreamCoercionMode;
	test: Func1<any, boolean>;
	coerce: Func1<any, ICoercedStream>;
}

export abstract class StreamCoercer {
	private static readonly DefaultOpts: ICoercedStreamOptions = {
		pipeOptions: { end: true },
	};

	private static readonly StreamCoercionModes: IStreamCoercionTest[] = [
		{
			mode: StreamCoercionMode.InheritsStream,
			test: value => value instanceof stream.Readable,
			coerce: value => new StreamReadableCoercedStream(value, StreamCoercer.DefaultOpts),
		},
		{
			mode: StreamCoercionMode.DuckPipe,
			test: value => typeof (<stream.Readable>value)?.pipe === 'function',
			coerce: value => new DuckPipeCoercedStream(value, StreamCoercer.DefaultOpts),
		}
	];

	public static IsCoercible(value: any, allowableModes: StreamCoercionMode): StreamCoercionMode {
		if (typeof value === "object" && value) {
			for (const test of StreamCoercer.StreamCoercionModes) {
				if (allowableModes & test.mode && test.test(value)) {
					return test.mode;
				}
			}
		}

		return StreamCoercionMode.None;
	}

	public static CoerceWith(value: any, mode: StreamCoercionMode): ICoercedStream {
		for (const test of StreamCoercer.StreamCoercionModes) {
			if (mode & test.mode) {
				return test.coerce(value);
			}
		}

		return undefined;
	}
}

export interface ICoercedStreamOptions {
	pipeOptions: ICoercedStreamPipeOptions;
}

export interface ICoercedStreamPipeOptions {
	end?: boolean;
}

export interface ICoercedStream {
	getReadStream(): stream.Readable;
	pipe(outStream: stream.Writable, opts?: ICoercedStreamPipeOptions): void;
	on(event: 'error', handler: Func1<any>): this;
	on(event: 'end', handler: Func): this;
}

class StreamReadableCoercedStream extends EventEmitter implements ICoercedStream {
	public constructor(
		private stream: stream.Readable,
		private defaultOpts: ICoercedStreamOptions,
	) {
		super();
		this.stream.on('end', () => {
			this.emit('end');
		})
	};

	getReadStream(): stream.Readable {
		return this.stream;
	}

	pipe(outStream: stream.Writable, opts: ICoercedStreamPipeOptions = {}) {
		opts = { ...this.defaultOpts.pipeOptions, ...opts };
		this.stream.on('error', e => {
			this.emit('error', e);
			outStream.end();
		});

		this.stream.pipe(outStream, { end: opts.end });
	}
}

interface IDuckPipedStream {
	pipe: stream.Readable['pipe'];
}

class DuckPipeCoercedStream extends EventEmitter implements ICoercedStream {
	public constructor(
		private stream: IDuckPipedStream,
		private defaultOpts: ICoercedStreamOptions,
	) {
		super();
	};

	getReadStream(): stream.Readable {
		const rs = StreamIntermediary.GetStreamIntermediary();
		this.stream.pipe(rs, { end: true });
		return rs;
	}

	pipe(outStream: stream.Writable, opts: ICoercedStreamPipeOptions = {}) {
		opts = { ...this.defaultOpts.pipeOptions, ...opts };
		this.stream.pipe(outStream, { end: opts.end });
	}
}