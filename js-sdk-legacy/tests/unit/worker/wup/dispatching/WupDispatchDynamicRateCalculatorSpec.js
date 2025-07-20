import { assert } from 'chai';
import WupServerSessionState from '../../../../../src/worker/communication/WupServerSessionState';
import WupDispatchDynamicRateCalculator
    from '../../../../../src/worker/wup/dispatching/WupDispatchDynamicRateCalculator';

describe('WupDispatchDynamicRateCalculator tests:', function () {
    beforeEach(function () {
        this.wupServerSessionState = new WupServerSessionState();
    });

    describe('getRate tests: ', function () {
        it('returns dynamic rate successfully', function () {
            const rateCalculator = new WupDispatchDynamicRateCalculator(this.wupServerSessionState);

            // Check the rate is the default 5000
            assert.equal(rateCalculator.getRate(), 5000);

            this.wupServerSessionState.setWupDispatchRate(234);

            assert.equal(rateCalculator.getRate(), 234);
        });

        it('returns default dynamic rate if not change successfully', function () {
            const rateCalculator = new WupDispatchDynamicRateCalculator(this.wupServerSessionState);

            // Check the rate is the default 5000
            assert.equal(rateCalculator.getRate(), 5000);
        });
    });

    describe('updateDispatchRate tests: ', function () {
        it('rate is updated successfully', function () {
            const rateCalculator = new WupDispatchDynamicRateCalculator(this.wupServerSessionState);

            this.wupServerSessionState.setWupDispatchRate(234);

            assert.equal(rateCalculator.getRate(), 234);

            this.wupServerSessionState.setWupDispatchRate(1);

            assert.equal(rateCalculator.getRate(), 1);
        });

        it('rate is not updated if invalid rate is provided', function () {
            const rateCalculator = new WupDispatchDynamicRateCalculator(this.wupServerSessionState);

            this.wupServerSessionState.setWupDispatchRate(0);
            assert.notEqual(rateCalculator.getRate(), 0);
            this.wupServerSessionState.setWupDispatchRate('');
            assert.notEqual(rateCalculator.getRate(), '');
            this.wupServerSessionState.setWupDispatchRate(null);
            assert.notEqual(rateCalculator.getRate(), null);
            this.wupServerSessionState.setWupDispatchRate(undefined);
            assert.notEqual(rateCalculator.getRate(), undefined);
        });
    });
});
