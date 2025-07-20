import { assert } from 'chai';
import WupStatisticsService from '../../../../../src/worker/wup/WupStatisticsService';
import WupServerSessionState from '../../../../../src/worker/communication/WupServerSessionState';
import WupDispatchRateCalculatorFactory
    from '../../../../../src/worker/wup/dispatching/WupDispatchRateCalculatorFactory';
import WupDispatchConstantRateCalculator
    from '../../../../../src/worker/wup/dispatching/WupDispatchConstantRateCalculator';
import WupDispatchIncrementalRateCalculator
    from '../../../../../src/worker/wup/dispatching/WupDispatchIncrementalRateCalculator';
import WupDispatchDynamicRateCalculator
    from '../../../../../src/worker/wup/dispatching/WupDispatchDynamicRateCalculator';

describe('WupDispatchRateCalculatorFactory tests:', function () {
    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
        this.wupStatisticsServiceStub = this.sandbox.createStubInstance(WupStatisticsService);
        this.wupServerSessionStateStub = this.sandbox.createStubInstance(WupServerSessionState);
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    describe('create tests: ', function () {
        it('constant calculator is created successfully', function () {
            const wupDispatchRateCalculatorFactory = new WupDispatchRateCalculatorFactory(this.wupStatisticsServiceStub, this.wupServerSessionStateStub);

            const rateCalculator = wupDispatchRateCalculatorFactory.create({
                type: 'constant', //  (incremental, constant)
                initialRateValueMs: 1000,
            });

            assert.isTrue(rateCalculator instanceof WupDispatchConstantRateCalculator);

            // Check the rate is constantly 1000
            assert.equal(rateCalculator.getRate(), 1000);
            assert.equal(rateCalculator.getRate(), 1000);
        });

        it('incremental calculator is created successfully', function () {
            const wupDispatchRateCalculatorFactory = new WupDispatchRateCalculatorFactory(this.wupStatisticsServiceStub, this.wupServerSessionStateStub);
            // Make sure we get to the minimal sent wups count so rate will start incrementing
            this.wupStatisticsServiceStub.getSentWupsCount.returns(20);

            const rateCalculator = wupDispatchRateCalculatorFactory.create({
                type: 'incremental', //  (incremental, constant)
                initialRateValueMs: 500, // The initial rate
                incrementStepMs: 500, // The rate increment rate
                incrementStopMs: 5000, // At what rate value do we stop incrementing
                incrementStartWupSendCount: 20, // After how many wups do we start increasing
            });

            assert.isTrue(rateCalculator instanceof WupDispatchIncrementalRateCalculator);

            // Check the rate is incrementing
            assert.equal(rateCalculator.getRate(), 1000);
            assert.equal(rateCalculator.getRate(), 1500);
            assert.equal(rateCalculator.getRate(), 2000);
            assert.equal(rateCalculator.getRate(), 2500);
            assert.equal(rateCalculator.getRate(), 3000);
        });

        it('dynamic calculator is created successfully', function () {
            const wupDispatchRateCalculatorFactory = new WupDispatchRateCalculatorFactory(this.wupStatisticsServiceStub, this.wupServerSessionStateStub);
            this.wupServerSessionStateStub.getWupDispatchRate.returns(5000);

            const rateCalculator = wupDispatchRateCalculatorFactory.create({
                type: 'dynamic',
            });

            assert.isTrue(rateCalculator instanceof WupDispatchDynamicRateCalculator);

            // Check the rate is constantly 5000
            assert.equal(rateCalculator.getRate(), 5000);
            assert.equal(rateCalculator.getRate(), 5000);
        });

        it('an error is thrown when an unknown calculator type is created', function () {
            const wupDispatchRateCalculatorFactory = new WupDispatchRateCalculatorFactory(this.wupStatisticsServiceStub, this.wupServerSessionStateStub);

            assert.throws(() => {
                return wupDispatchRateCalculatorFactory.create({
                    type: 'invalidCalc',
                    initialRateValueMs: 500,
                });
            });
        });
    });
});
