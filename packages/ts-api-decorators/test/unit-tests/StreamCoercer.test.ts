import 'mocha';
import { expect, assert } from 'chai';
import { StreamCoercer, StreamCoercionMode } from '../../src/Util/StreamCoercer';
import * as stream from 'stream';
import * as streamBuffers from 'stream-buffers';
import { promisifyEvent } from '../../src/Util/PromiseEvent';

describe('StreamCoercer', () => {
	const tests = [
		{ object: null, modes: [] },
		{ object: {}, modes: [] },
		{ object: new stream.Readable(), modes: [StreamCoercionMode.DuckPipe, StreamCoercionMode.InheritsStream] },
		{ object: new stream.Writable(), modes: [StreamCoercionMode.DuckPipe] },
		{ object: { pipe: () => {} }, modes: [StreamCoercionMode.DuckPipe] },
	];

	it('should handle unacceptable types', async () => {
		for (const test of [null, undefined, '', [], 1, false, true, 0, NaN, Symbol('@')]) {
			expect(StreamCoercer.IsCoercible(test, StreamCoercionMode.Any)).to.be.equal(StreamCoercionMode.None);
		}
	});

	it('should coerce readable streams', async () => {
		const s = new stream.Readable();
		const coercionMode = StreamCoercer.IsCoercible(s, StreamCoercionMode.InheritsStream);
		expect(coercionMode).to.be.equal(StreamCoercionMode.InheritsStream);
	});
	
	it('should coerce duck pipe streams', async () => {
		const s = { pipe: () => {} };
		const coercionMode = StreamCoercer.IsCoercible(s, StreamCoercionMode.DuckPipe);
		expect(coercionMode).to.be.equal(StreamCoercionMode.DuckPipe);
	});
	
	it('should coerce streams to the right mode', () => {
		for (const test of tests) {
			if (test.modes.length === 0) {
				expect(StreamCoercer.IsCoercible(test.object, StreamCoercionMode.Any)).to.be.equal(StreamCoercionMode.None, 'Non-coercible stream should not be coerced');
			} else {
				for (const mode of test.modes) {
					expect(StreamCoercer.IsCoercible(test.object, mode)).to.be.equal(mode, 'Stream should coerce to expected type');
				}

				const mode = StreamCoercer.IsCoercible(test.object, StreamCoercionMode.Any);
				expect(test.modes).to.contain(mode, 'Stream should coerce to an expected type');
			}
		}
	});

	for (const desiredMode of [ StreamCoercionMode.DuckPipe, StreamCoercionMode.InheritsStream ]) {
		for (const end of [true, false]) {
			for (const readMode of [true, false]) {
				it(`should properly interface a readable stream [coercion mode: ${desiredMode}][read mode: ${readMode}][end stream: ${end}]`, async () => {
					const blocks = [ 'a', 'bc', 'd', 'efghijk' ];
					const readable = stream.Readable.from(blocks)
					const mode = StreamCoercer.IsCoercible(readable, desiredMode);
					expect(mode).to.eq(desiredMode, `Should coerce to desired mode (${desiredMode})`);

					const coerced = StreamCoercer.CoerceWith(readable, mode);
					const writable = new streamBuffers.WritableStreamBuffer();
					const endPromise = promisifyEvent(writable, 'finish', { timeout: 15 });
					if (readMode) {
						coerced.pipe(writable, { end });
					} else {
						coerced.getReadStream().pipe(writable, { end });
					}

					try {
						await endPromise;
					} catch (e) {
						// Only consider timeouts an error if we ended the stream
						if (end) {
							throw e;
						}
					}

					expect(writable.writable).to.eq(!end, 'writable should be ended if the stream end pass through option was selected');
					expect(writable.getContentsAsString('utf8')).to.equal(blocks.join(''), 'buffer output should be equal');
				});
			}
		}
	}
	
});