import { assert } from 'chai';
import WorkerWrapper from '../../../../src/main/technicalServices/WorkerWrapper';

describe('WorkerWrapper tests:', function () {
    describe('message passing tests:', function () {
        afterEach(function () {
            if (this.workerWrapper) {
                this.workerWrapper.close();
                this.workerWrapper = null;
            }
        });

        it('string messages between main to WorkerWrapper with dedicated worker should pass', function (done) {
            let expectedResult = null;
            const worker = new window.Worker('base/tests/unit/main/technicalServices/dummyDedicatedWorker.js');
            this.workerWrapper = new WorkerWrapper(worker);

            this.workerWrapper.port.setonmessage((e) => {
                try {
                    assert.equal(e.data, expectedResult);
                    expectedResult = 'BBB';
                    if (e.data === 'AAA') {
                        this.workerWrapper.port.postMessage('BBB');
                    } else {
                        assert.equal(e.data, 'BBB');
                        done();
                    }
                } catch (ex) {
                    // Swallow Exception
                }
            });
            expectedResult = 'AAA';
            this.workerWrapper.port.postMessage('AAA');
        });

        it('object messages between main to WorkerWrapper with dedicated worker should pass', function (done) {
            let expectedResult = null;
            const worker = new window.Worker('base/tests/unit/main/technicalServices/dummyDedicatedWorker.js');
            this.workerWrapper = new WorkerWrapper(worker);

            this.workerWrapper.port.setonmessage((e) => {
                try {
                    assert.deepEqual(e.data, expectedResult);
                    done();
                } catch (ex) {
                    // Swallow Exception
                }
            });
            const data = { a: 'bob', b: 'sabag' };
            expectedResult = data;
            this.workerWrapper.port.postMessage(data);
        });
    });

    describe('close method tests:', function () {
        it('close should terminate the worker', function () {
            const mockWorker = sinon.stub();
            mockWorker.terminate = sinon.spy();

            this.workerWrapper = new WorkerWrapper(mockWorker);

            this.workerWrapper.close();

            assert.isTrue(mockWorker.terminate.calledOnce);
        });
    });
});
