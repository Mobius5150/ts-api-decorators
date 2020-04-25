import 'mocha';
import { expect, assert } from 'chai';
import { asyncGlob } from '../../src/Util/AsyncGlob';
import * as path from 'path';

describe('AsyncGlob', () => {
	it('should handle errors', async () => {
        let failed = false;
        try {
            await asyncGlob('*.*', { matchBase: true, noglobstar: true });
        } catch (e) {
            failed = true;
        } finally {
            expect(failed).to.be.eq(true, 'globstar');
        }

        failed = false;
        try {
            await asyncGlob('\0/' + '*.*');
        } catch (e) {
            failed = true;
        } finally {
            expect(failed).to.be.eq(true, 'bad path');
        }

        failed = false;
        try {
            await asyncGlob('*.*', undefined, (path, options, cb) => {
                cb(new Error(), null);
            });
        } catch (e) {
            failed = true;
        } finally {
            expect(failed).to.be.eq(true, 'thrown error');
        }
    });

    it('should find files', async () => {
        const files = await asyncGlob(path.join(__dirname, '*.*'));
        expect(files).to.have.length.greaterThan(0, 'should have found files');
    });
});