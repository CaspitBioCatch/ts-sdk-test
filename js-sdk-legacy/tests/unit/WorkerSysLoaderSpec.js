import { assert } from 'chai';
import MessageBus from '../../src/main/technicalServices/MessageBus';
import WorkerCommunicator from '../../src/main/technicalServices/WorkerCommunicator';
import WorkerSysLoader from '../../src/worker/WorkerSysLoader';


describe('WorkerSysLoader tests:', function () {
    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
        this.workerCommunicatorStub = sinon.createStubInstance(WorkerCommunicator);
        this.messageBus = sinon.createStubInstance(MessageBus);
        this.workerSysLoader = new WorkerSysLoader(this.workerCommunicatorStub, this.messageBus);
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    it('should load worker system successfully', function () {
        this.workerSysLoader.loadSystem();
        assert.isTrue(this.workerCommunicatorStub.addMessageListener.called, 'addMessageListener was not called');

    });
});
