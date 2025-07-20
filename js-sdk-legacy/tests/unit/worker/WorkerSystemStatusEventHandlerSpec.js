import { assert } from 'chai';
import WorkerCommunicator from '../../../src/main/technicalServices/WorkerCommunicator';
import WorkerSystemStatusEventHandler from '../../../src/worker/WorkerSystemStatusEventHandler';
import { WorkerStatusCategoryType } from '../../../src/worker/WorkerStatusCategoryType';
import { WorkerEvent } from '../../../src/main/events/WorkerEvent';
import { statusTypes } from '../../../src/main/events/HeartBeatEvent';
import HeartBeatEvent from '../../../src/main/events/HeartBeatEvent';
import MessageBus from '../../../src/main/technicalServices/MessageBus';
import { MockObjects } from '../mocks/mockObjects';

describe('WorkerSystemStatusEventHandler tests:', function () {
    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
        this._mainCommunicatorStub = sinon.createStubInstance(WorkerCommunicator);
        this._msgBusStub = sinon.createStubInstance(MessageBus);
        this._loggerStub = sinon.stub(MockObjects.logger);
        this.workerSystemStatusEventHandler = new WorkerSystemStatusEventHandler(this._mainCommunicatorStub, this._msgBusStub, this._loggerStub);
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    it('should call sendAsync on new heartBeatEvent', function () {
        const expectedHeartbeatEvent = sinon.match.instanceOf(HeartBeatEvent)
            .and(sinon.match.has('category', WorkerStatusCategoryType.WupServerResponse))
            .and(sinon.match.has('status', statusTypes.Error));
        this.workerSystemStatusEventHandler._handle(new HeartBeatEvent(WorkerStatusCategoryType.WupServerResponse, statusTypes.Error));
        assert.isTrue(this._mainCommunicatorStub.sendAsync.called, 'sendAsync was not called');
        assert.isTrue(this._mainCommunicatorStub.sendAsync.calledWith(WorkerEvent.HeartBeatStatusEvent, sinon.match(expectedHeartbeatEvent)),
            'sendAsync called with wrong args');
    });
});
