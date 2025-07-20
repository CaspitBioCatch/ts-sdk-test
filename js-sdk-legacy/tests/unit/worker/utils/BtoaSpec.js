import { assert } from 'chai';
import { btoa } from '../../../../src/worker/utils/Btoa';

describe('Btoa tests:', function () {
    it('Convert to ascii', function () {
        const input = 'tadada1rffsf er32p4i9f23nfafw23414';

        btoa(input);
    });

    it('Attempting to convert non latin1 chars to ascii throws an error', function () {
        const input = 'tadada1r-הלך עלינו';

        let thrownError = null;
        try {
            btoa(input);
        } catch (e) {
            thrownError = e;
        }

        assert.exists(thrownError);
    });
});
