import PerfMonitor from '../../../../src/main/technicalServices/PerfMonitor';
import DataQ from '../../../../src/main/technicalServices/DataQ';

describe('PerfMonitor tests:', function () {
    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
        this.dataQStub = this.sandbox.createStubInstance(DataQ);
        this.perfMonitor = new PerfMonitor(this.dataQStub);
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    describe('startMonitor', function () {
        it('start monitoring adds a monitor to the list', function () {
            const counterName = 'testCounterName';

            this.perfMonitor.startMonitor(counterName);

            assert.isTrue(this.perfMonitor._monitors.has(counterName));
            assert.equal(this.perfMonitor._monitors.size, 1);
        });

        it('start multiple monitors', function () {
            const counterName1 = 'testCounterName1';
            const counterName2 = 'testCounterName2';
            const counterName3 = 'testCounterName3';
            const counterName4 = 'testCounterName4';

            this.perfMonitor.startMonitor(counterName1);
            this.perfMonitor.startMonitor(counterName2);
            this.perfMonitor.startMonitor(counterName3);
            this.perfMonitor.startMonitor(counterName4);

            assert.isTrue(this.perfMonitor._monitors.has(counterName1));
            assert.isTrue(this.perfMonitor._monitors.has(counterName2));
            assert.isTrue(this.perfMonitor._monitors.has(counterName3));
            assert.isTrue(this.perfMonitor._monitors.has(counterName4));
            assert.equal(this.perfMonitor._monitors.size, 4);
        });

        it('starting the same monitor multiple times overwrites the same monitor', function () {
            const counterName = 'testCounterName';

            this.perfMonitor.startMonitor(counterName);
            this.perfMonitor.startMonitor(counterName);
            this.perfMonitor.startMonitor(counterName);
            this.perfMonitor.startMonitor(counterName);

            assert.isTrue(this.perfMonitor._monitors.has(counterName));
            assert.equal(this.perfMonitor._monitors.size, 1);
        });
    });

    describe('stopMonitor', function () {
        it('stop monitoring a monitor', function () {
            const counterName = 'testCounterName';

            this.perfMonitor.startMonitor(counterName);

            this.perfMonitor.stopMonitor(counterName);

            assert.isFalse(this.perfMonitor._monitors.has(counterName));
            assert.equal(this.perfMonitor._monitors.size, 0);
            assert.isTrue(this.dataQStub.addToQueue.calledOnce);
        });

        it('stopping a monitor which does not exist, does nothing', function () {
            const counterName = 'testCounterName';

            this.perfMonitor.stopMonitor(counterName);

            assert.isFalse(this.perfMonitor._monitors.has(counterName));
            assert.equal(this.perfMonitor._monitors.size, 0);
            assert.isTrue(this.dataQStub.addToQueue.notCalled);
        });
    });

    describe('cancelMonitor', function () {
        it('cancel a monitor', function () {
            const counterName = 'testCounterName';

            this.perfMonitor.startMonitor(counterName);

            this.perfMonitor.cancelMonitor(counterName);

            assert.isFalse(this.perfMonitor._monitors.has(counterName));
            assert.equal(this.perfMonitor._monitors.size, 0);
            assert.isTrue(this.dataQStub.addToQueue.notCalled);
        });

        it('cancel a non existing monitor', function () {
            const counterName = 'testCounterName';

            this.perfMonitor.cancelMonitor(counterName);

            assert.isFalse(this.perfMonitor._monitors.has(counterName));
            assert.equal(this.perfMonitor._monitors.size, 0);
            assert.isTrue(this.dataQStub.addToQueue.notCalled);
        });
    });

    describe('reportMonitor', function () {
        it('report a monitor', function () {
            const counterName = 'testCounterName';

            this.perfMonitor.reportMonitor(counterName);

            assert.isFalse(this.perfMonitor._monitors.has(counterName));
            assert.equal(this.perfMonitor._monitors.size, 0);
            assert.isTrue(this.dataQStub.addToQueue.calledOnce);
        });
    });
});
