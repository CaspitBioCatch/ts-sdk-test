import { assert } from 'chai';

import WupStatisticsService from '../../../../../src/worker/wup/WupStatisticsService';
import WupDispatchIncrementalRateCalculator
    from '../../../../../src/worker/wup/dispatching/WupDispatchIncrementalRateCalculator';

describe('WupDispatchIncrementalRateCalculator tests:', function () {
    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
        this.wupStatisticsServiceStub = this.sandbox.createStubInstance(WupStatisticsService);
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    describe('getRate tests: ', function () {
        it('returns an incrementing rate after sent wups count is above threshold', function () {
            this.wupStatisticsServiceStub.getSentWupsCount.returns(20);

            const rateCalculator = new WupDispatchIncrementalRateCalculator({
                type: 'incremental', //  (incremental, constant)
                initialRateValueMs: 1200, // The initial rate
                incrementStepMs: 100, // The rate increment rate
                incrementStopMs: 5000, // At what rate value do we stop incrementing
                incrementStartWupSendCount: 20, // After how many wups do we start increasing
            }, this.wupStatisticsServiceStub);

            assert.equal(rateCalculator.getRate(), 1300);
            assert.equal(rateCalculator.getRate(), 1400);
        });

        it('doesnt increment rate as long as the sent wups count is bellow the threshold', function () {
            this.wupStatisticsServiceStub.getSentWupsCount.returns(14);

            const rateCalculator = new WupDispatchIncrementalRateCalculator({
                type: 'incremental', //  (incremental, constant)
                initialRateValueMs: 11, // The initial rate
                incrementStepMs: 100, // The rate increment rate
                incrementStopMs: 5000, // At what rate value do we stop incrementing
                incrementStartWupSendCount: 15, // After how many wups do we start increasing
            }, this.wupStatisticsServiceStub);

            assert.equal(rateCalculator.getRate(), 11);
            assert.equal(rateCalculator.getRate(), 11);
            assert.equal(rateCalculator.getRate(), 11);

            this.wupStatisticsServiceStub.getSentWupsCount.returns(15);

            assert.equal(rateCalculator.getRate(), 111);
            assert.equal(rateCalculator.getRate(), 211);
        });

        it('stops incrementing rate once stop value is reached', function () {
            this.wupStatisticsServiceStub.getSentWupsCount.returns(15);

            const rateCalculator = new WupDispatchIncrementalRateCalculator({
                type: 'incremental', //  (incremental, constant)
                initialRateValueMs: 100, // The initial rate
                incrementStepMs: 100, // The rate increment rate
                incrementStopMs: 500, // At what rate value do we stop incrementing
                incrementStartWupSendCount: 15, // After how many wups do we start increasing
            }, this.wupStatisticsServiceStub);

            assert.equal(rateCalculator.getRate(), 200);
            assert.equal(rateCalculator.getRate(), 300);
            assert.equal(rateCalculator.getRate(), 400);
            assert.equal(rateCalculator.getRate(), 500);
            assert.equal(rateCalculator.getRate(), 500);
            assert.equal(rateCalculator.getRate(), 500);
        });
    });

    describe('updateSettings tests: ', function () {
        it('settings are updated successfully', function () {
            this.wupStatisticsServiceStub.getSentWupsCount.returns(20);

            const rateCalculator = new WupDispatchIncrementalRateCalculator({
                type: 'incremental', //  (incremental, constant)
                initialRateValueMs: 1200, // The initial rate
                incrementStepMs: 100, // The rate increment rate
                incrementStopMs: 5000, // At what rate value do we stop incrementing
                incrementStartWupSendCount: 20, // After how many wups do we start increasing
            }, this.wupStatisticsServiceStub);

            assert.equal(rateCalculator.getRate(), 1300);
            assert.equal(rateCalculator.getRate(), 1400);

            rateCalculator.updateSettings({
                type: 'incremental', //  (incremental, constant)
                initialRateValueMs: 500, // The initial rate
                incrementStepMs: 11, // The rate increment rate
                incrementStopMs: 522, // At what rate value do we stop incrementing
                incrementStartWupSendCount: 25, // After how many wups do we start increasing)
            });

            assert.equal(rateCalculator.getRate(), 500);

            this.wupStatisticsServiceStub.getSentWupsCount.returns(25);

            assert.equal(rateCalculator.getRate(), 511);
            assert.equal(rateCalculator.getRate(), 522);
            assert.equal(rateCalculator.getRate(), 522);
        });

        it('an error is thrown if invalid settings are provided', function () {
            this.wupStatisticsServiceStub.getSentWupsCount.returns(20);

            const rateCalculator = new WupDispatchIncrementalRateCalculator({
                type: 'incremental', //  (incremental, constant)
                initialRateValueMs: 1200, // The initial rate
                incrementStepMs: 100, // The rate increment rate
                incrementStopMs: 5000, // At what rate value do we stop incrementing
                incrementStartWupSendCount: 20, // After how many wups do we start increasing
            }, this.wupStatisticsServiceStub);

            assert.equal(rateCalculator.getRate(), 1300);
            assert.equal(rateCalculator.getRate(), 1400);

            assert.throws(() => {
                return rateCalculator.updateSettings({
                    type: 'constant', //  (incremental, constant)
                    initialRateValueMs: 500,
                });
            });
        });
    });
});
