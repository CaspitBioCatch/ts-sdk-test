import { assert } from 'chai';
import WorkerStartPoint from '../../../src/worker/WorkerStartPoint';
import WorkerCommunicator from '../../../src/main/technicalServices/WorkerCommunicator';
import WorkerSysLoader from '../../../src/worker/WorkerSysLoader';
import { WorkerStatusCategoryType } from '../../../src/worker/WorkerStatusCategoryType';
import CDPort from '../../../src/main/infrastructure/CDPort';
import { statusTypes } from '../../../src/main/events/HeartBeatEvent';
import MessageBus from '../../../src/main/technicalServices/MessageBus';
import HeartBeatEvent from '../../../src/main/events/HeartBeatEvent';
import { MessageBusEventType } from '../../../src/main/events/MessageBusEventType';

describe('WorkerStartPoint tests:', function () {
    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
        this.workerCommunicatorStub = sinon.createStubInstance(WorkerCommunicator);
        this.messageBus = sinon.createStubInstance(MessageBus);
        this.workerSysLoaderStub = sinon.createStubInstance(WorkerSysLoader);
        this.portStub = sinon.createStubInstance(CDPort);
        this.workerSysLoader = new WorkerStartPoint();
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    it('should load worker system successfully', function () {
        const expectedHeartbeatEvent = sinon.match.instanceOf(HeartBeatEvent)
            .and(sinon.match.has('category', WorkerStatusCategoryType.WorkerSetup))
            .and(sinon.match.has('status', statusTypes.Ok));
        this.workerSysLoader._loadWorkerSystem(this.workerCommunicatorStub, this.messageBus, this.workerSysLoaderStub, this.portStub);

        assert.isTrue(this.workerCommunicatorStub.setMessagingPort.called, 'setMessaging port was not called');
        assert.equal(this.workerCommunicatorStub.setMessagingPort.firstCall.args[0], this.portStub, 'first arg is not as expected');
        assert.isTrue(this.workerSysLoaderStub.loadSystem.called, 'loadSystem was not called');
        assert.isTrue(this.messageBus.publish.called, 'publish was not called');
        assert.isTrue(this.messageBus.publish.calledWith(MessageBusEventType.WorkerSystemStatusEvent, sinon.match(expectedHeartbeatEvent)), 'publish was called with wrong args');
    });

    it('should fail to load worker system and publish heartBeatEvent with error', function () {
        const expectedHeartbeatEvent = sinon.match.instanceOf(HeartBeatEvent)
        .and(sinon.match.has('category', WorkerStatusCategoryType.WorkerSetup))
        .and(sinon.match.has('status', statusTypes.Error));

        this.workerCommunicatorStub.setMessagingPort.throws('error');

        this.workerSysLoader._loadWorkerSystem(this.workerCommunicatorStub, this.messageBus, this.workerSysLoaderStub, this.portStub);

        assert.isTrue(this.messageBus.publish.called, 'publish was not called');
        assert.isTrue(this.messageBus.publish.calledWith(MessageBusEventType.WorkerSystemStatusEvent, sinon.match(expectedHeartbeatEvent)), 'publish was called with wrong args');
    });
});
