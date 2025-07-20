import { assert } from 'chai';
import CidCache from '../../../../../src/main/core/session/CidCache';

describe('CidCache tests:', function () {

    const urlWithoutParameters = 'https://wup-dtrackers.bc2.customers.biocatch.com/client/v3.1/web/wup'
    const cid = "test-cid";

    it('cid extracted successfully from url', function () {
        const cidCache = new CidCache(urlWithoutParameters + '?cid=' + cid);

        const actualCid = cidCache.get();
        assert.equal(actualCid, cid, 'cid is not equal to expected value');
    });

    it('should throw an error if set cid is not found on url', function () {
        assert.throws(() => { return new CidCache(urlWithoutParameters) });
    });
});
