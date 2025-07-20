import { assert } from 'chai';
import CDPort from '../../../../src/main/infrastructure/CDPort';
import TestFeatureSupport from '../../../TestFeatureSupport';

describe('CDPort test:', function () {
    beforeEach(function () {
        if (!TestFeatureSupport.isWorkerSupported()) {
            this.skip();
            return;
        }

        this.sandbox = sinon.createSandbox();
        this.workerStub = this.sandbox.createStubInstance(window.Worker);
    });

    afterEach(function () {
        if (this.sandbox) {
            this.sandbox.restore();
        }
    });

    describe('postMessage tests:', function () {
        it('post a message successfully', function () {
            const cdPort = new CDPort(this.workerStub);

            cdPort.postMessage('aaa');

            assert.isTrue(this.workerStub.postMessage.calledOnce);
            assert.equal(this.workerStub.postMessage.firstCall.args[0], 'aaa');
        });

        it('post a message multiple times successfully', function () {
            const cdPort = new CDPort(this.workerStub);

            cdPort.postMessage(null);
            cdPort.postMessage('aaa');
            cdPort.postMessage('bbb');

            assert.isTrue(this.workerStub.postMessage.calledThrice);
            assert.isNull(this.workerStub.postMessage.firstCall.args[0]);
            assert.equal(this.workerStub.postMessage.secondCall.args[0], 'aaa');
            assert.equal(this.workerStub.postMessage.thirdCall.args[0], 'bbb');
        });
    });

    describe('close tests:', function () {
        it('close port successfully', function () {
            const cdPort = new CDPort(this.workerStub);

            cdPort.close();

            assert.isTrue(this.workerStub.terminate.calledOnce);
        });

        it('multiple close operations are successful', function () {
            const cdPort = new CDPort(this.workerStub);

            cdPort.close();
            cdPort.close();
            cdPort.close();

            assert.isTrue(this.workerStub.terminate.calledThrice);
        });
    });
});
