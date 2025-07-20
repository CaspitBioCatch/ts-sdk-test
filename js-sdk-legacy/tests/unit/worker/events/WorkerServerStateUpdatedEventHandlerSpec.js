import { assert } from 'chai';
import WupServerSessionState from '../../../../src/worker/communication/WupServerSessionState';
import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import { MockObjects } from '../../mocks/mockObjects';
import WorkerServerStateUpdatedEventHandler
    from '../../../../src/worker/events/WorkerServerStateUpdatedEventHandler';
import { MessageBusEventType } from '../../../../src/main/events/MessageBusEventType';
import { WorkerEvent } from '../../../../src/main/events/WorkerEvent';
import WupMessage from '../../../../src/worker/communication/WupMessage';
import WorkerCommunicator from '../../../../src/main/technicalServices/WorkerCommunicator';

describe('WorkerServerStateUpdatedEventHandler tests:', function () {
    beforeEach(function () {
        this.messageBus = new MessageBus();

        this.sandbox = sinon.createSandbox();

        this._wupServerSessionStateStub = sinon.stub(new WupServerSessionState());
        this._mainCommunicatorStub = sinon.createStubInstance(WorkerCommunicator);
        this._wupServerSessionStateStub.setSid.returns('cdsnum');
        this._wupServerSessionStateStub.setCsid.returns('csid');
        this._wupServerSessionStateStub.setMuid.returns('muid');
        this._wupServerSessionStateStub.setContextName.returns('context');
        this._wupServerSessionStateStub.setRequestId.returns(1234);

        this.loggerStub = sinon.stub(MockObjects.logger);
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    it('should handle a new session once triggered', function () {
        const pendingMessage = new WupMessage();
        pendingMessage.sid = 'sidsid';
        pendingMessage.sts = 'stststs';
        pendingMessage.std = 'stdddsdsd';

        const workerServerStateUpdatedEventHandler = new WorkerServerStateUpdatedEventHandler(this.messageBus, this.loggerStub, this._mainCommunicatorStub);

        this.messageBus.publish(MessageBusEventType.ServerStateUpdatedEvent, {
            sts: 'ststs', std: 'stdtdtd', sid: 'sidddd', requestId: '11',
        });

        assert.exists(workerServerStateUpdatedEventHandler);
        assert.isTrue(this._mainCommunicatorStub.sendAsync.calledOnce, 'MainCommunicator publish was not called once');
        assert.equal(this._mainCommunicatorStub.sendAsync.firstCall.args[0], WorkerEvent.ServerStateUpdatedEvent, 'MainCommunicator publish was not called once');
    });

    it('should handle multiple new session events are triggered', function () {
        const pendingMessage = new WupMessage();
        pendingMessage.sid = 'sidsid';
        pendingMessage.sts = 'stststs';
        pendingMessage.std = 'stdddsdsd';

        const workerServerStateUpdatedEventHandler = new WorkerServerStateUpdatedEventHandler(this.messageBus, this.loggerStub, this._mainCommunicatorStub);

        this.messageBus.publish(MessageBusEventType.ServerStateUpdatedEvent, {
            sts: 'ststsssss', std: 'stdtd222td', sid: 'sidddd', requestId: '1121',
        });
        this.messageBus.publish(MessageBusEventType.ServerStateUpdatedEvent, {
            sts: 'ststs', std: 'stdtdtd', sid: 'sidddd', requestId: '11',
        });

        this.messageBus.publish(MessageBusEventType.ServerStateUpdatedEvent, 'NEW SID 333');

        assert.exists(workerServerStateUpdatedEventHandler);
        assert.isTrue(this._mainCommunicatorStub.sendAsync.calledThrice, 'MainCommunicator publish was not called thrice');
        assert.equal(this._mainCommunicatorStub.sendAsync.firstCall.args[0], WorkerEvent.ServerStateUpdatedEvent, 'MainCommunicator publish was not called once');
    });

    it('should not handle new session once an irrelevant event is triggered', function () {
        const workerServerStateUpdatedEventHandler = new WorkerServerStateUpdatedEventHandler(this.messageBus, this.loggerStub, this._mainCommunicatorStub);

        this.messageBus.publish(MessageBusEventType.TouchEvent, this.configurationRepositoryStub);

        assert.exists(workerServerStateUpdatedEventHandler);
        assert.isTrue(this._mainCommunicatorStub.sendAsync.notCalled, 'MainCommunicator publish was called');
    });
});
