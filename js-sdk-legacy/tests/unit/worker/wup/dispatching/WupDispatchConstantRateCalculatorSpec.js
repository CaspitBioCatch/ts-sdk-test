import { assert } from 'chai';
import WupDispatchConstantRateCalculator
    from '../../../../../src/worker/wup/dispatching/WupDispatchConstantRateCalculator';

describe('WupDispatchConstantRateCalculator tests:', function () {
    describe('getRate tests: ', function () {
        it('returns constant rate successfully', function () {
            const rateCalculator = new WupDispatchConstantRateCalculator({
                type: 'constant', //  (incremental, constant)
                initialRateValueMs: 1234,
            });

            // Check the rate is constantly 1234
            assert.equal(rateCalculator.getRate(), 1234);
            assert.equal(rateCalculator.getRate(), 1234);
        });
    });

    describe('updateSettings tests: ', function () {
        it('settings are updated successfully', function () {
            const rateCalculator = new WupDispatchConstantRateCalculator({
                type: 'constant',
                initialRateValueMs: 1200,
            });

            assert.equal(rateCalculator.getRate(), 1200);
            assert.equal(rateCalculator.getRate(), 1200);

            rateCalculator.updateSettings({
                type: 'constant', //  (incremental, constant)
                initialRateValueMs: 500,
            });

            assert.equal(rateCalculator.getRate(), 500);
        });

        it('an error is thrown if invalid settings are provided', function () {
            const rateCalculator = new WupDispatchConstantRateCalculator({
                type: 'constant',
                initialRateValueMs: 111,
            });

            assert.equal(rateCalculator.getRate(), 111);
            assert.equal(rateCalculator.getRate(), 111);

            assert.throws(() => {
                return rateCalculator.updateSettings({
                    type: 'incremental', //  (incremental, constant)
                    initialRateValueMs: 1200, // The initial rate
                    incrementStepMs: 100, // The rate increment rate
                    incrementStopMs: 5000, // At what rate value do we stop incrementing
                    incrementStartWupSendCount: 20, // After how many wups do we start increasing
                });
            });
        });
    });
});
