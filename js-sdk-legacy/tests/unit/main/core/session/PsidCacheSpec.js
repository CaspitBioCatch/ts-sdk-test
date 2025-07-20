import PsidCache from '../../../../../src/main/core/session/PsidCache';

describe('PsidCache tests:', function () {
    const assert = chai.assert;

    describe('get tests:', function () {
        it('should return the psid if available', function () {
            const psidCache = new PsidCache();

            const expectedPsid = 'pppSid';
            psidCache.set(expectedPsid);
            const actualPsid = psidCache.get();
            assert.equal(actualPsid, expectedPsid, 'psid is not equal to expected value');
        });

        it('should return null when psid is unavailable', function () {
            const psidCache = new PsidCache();

            const actualPsid = psidCache.get();
            assert.isNull(actualPsid, 'psid is not null');
        });
    });

    describe('set tests:', function () {
        it('should set psid', function () {
            const psidCache = new PsidCache();

            const expectedPsid = 'pppSidtoSet';
            psidCache.set(expectedPsid);
            const actualPsid = psidCache.get();
            assert.equal(actualPsid, expectedPsid, 'psid is not equal to expected value');
        });

        it('should set psid multiple times', function () {
            const psidCache = new PsidCache();

            let expectedPsid = 'pppSidtoSet';
            psidCache.set(expectedPsid);
            let actualPsid = psidCache.get();
            assert.equal(actualPsid, expectedPsid, 'psid is not equal to expected value');

            expectedPsid = 'aaaa';
            psidCache.set(expectedPsid);
            actualPsid = psidCache.get();
            assert.equal(actualPsid, expectedPsid, 'psid is not equal to expected value');

            expectedPsid = null;
            psidCache.set(expectedPsid);
            actualPsid = psidCache.get();
            assert.isNull(actualPsid, 'psid is not null');
        });

        it('should throw an error if set psid is undefined', function () {
            const psidCache = new PsidCache();

            assert.throws(() => { return psidCache.set(undefined); });
        });
    });
});
