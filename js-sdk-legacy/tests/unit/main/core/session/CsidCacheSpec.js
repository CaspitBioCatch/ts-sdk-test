import { assert } from 'chai';
import CsidCache from '../../../../../src/main/core/session/CsidCache';

describe('CsidCache tests:', function () {
    describe('get tests:', function () {
        it('should return the csid if available', function () {
            const csidCache = new CsidCache();

            const expectedCsid = 'csiDD';
            csidCache.set(expectedCsid);
            const actualCsid = csidCache.get();
            assert.equal(actualCsid, expectedCsid, 'csid is not equal to expected value');
        });

        it('should return null when csid is unavailable', function () {
            const csidCache = new CsidCache();

            const actualCsid = csidCache.get();
            assert.isNull(actualCsid, 'csid is not null');
        });
    });

    describe('set tests:', function () {
        it('should set csid', function () {
            const csidCache = new CsidCache();

            const expectedCsid = 'cccSidtoSet';
            csidCache.set(expectedCsid);
            const actualCsid = csidCache.get();
            assert.equal(actualCsid, expectedCsid, 'csid is not equal to expected value');
        });

        it('should set csid multiple times', function () {
            const csidCache = new CsidCache();

            let expectedCsid = 'cccSidtoSet';
            csidCache.set(expectedCsid);
            let actualCsid = csidCache.get();
            assert.equal(actualCsid, expectedCsid, 'csid is not equal to expected value');

            expectedCsid = 'aaaa';
            csidCache.set(expectedCsid);
            actualCsid = csidCache.get();
            assert.equal(actualCsid, expectedCsid, 'csid is not equal to expected value');

            expectedCsid = null;
            csidCache.set(expectedCsid);
            actualCsid = csidCache.get();
            assert.isNull(actualCsid, 'csid is not null');
        });

        it('should throw an error if set csid is undefined', function () {
            const csidCache = new CsidCache();

            assert.throws(() => { return csidCache.set(undefined); });
        });
    });
});
