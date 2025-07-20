import { assert } from 'chai';
import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import WupServerSessionState from '../../../../src/worker/communication/WupServerSessionState';
import { MockObjects } from '../../mocks/mockObjects';
import WupMessage from '../../../../src/worker/communication/WupMessage';
import WorkerNewSessionStartedEventHandler
    from '../../../../src/worker/events/WorkerNewSessionStartedEventHandler';
import { MessageBusEventType } from '../../../../src/main/events/MessageBusEventType';
import WorkerCommunicator from '../../../../src/main/technicalServices/WorkerCommunicator';

describe('WorkerNewSessionStartedEventHandler tests:', function () {
    beforeEach(function () {
        this.messageBus = new MessageBus();

        this._wupServerSessionState = new WupServerSessionState();
        this._mainCommunicatorStub = sinon.createStubInstance(WorkerCommunicator);
        this._wupServerSessionState.setSid('cdsnum');
        this._wupServerSessionState.setCsid('csid');
        this._wupServerSessionState.setMuid('muid');
        this._wupServerSessionState.setContextName('context');
        this._wupServerSessionState.setRequestId(1234);

        this.loggerStub = sinon.stub(MockObjects.logger);
    });

    it('should handle a new session once triggered', function () {
        const pendingMessage = new WupMessage();
        pendingMessage.sid = 'sidsid';
        pendingMessage.sts = 'stststs';
        pendingMessage.std = 'stdddsdsd';

        const workerNewSessionStartedEventHandler = new WorkerNewSessionStartedEventHandler(this.messageBus, this.loggerStub, this._mainCommunicatorStub);

        this.messageBus.publish(MessageBusEventType.NewSessionStartedEvent, 'NEW SID');

        assert.exists(workerNewSessionStartedEventHandler);
        assert.isTrue(this._mainCommunicatorStub.sendAsync.calledOnce, 'MainCommunicator publish was not called once');
    });

    it('should handle multiple new session events are triggered', function () {
        const pendingMessage = new WupMessage();
        pendingMessage.sid = 'sidsid';
        pendingMessage.sts = 'stststs';
        pendingMessage.std = 'stdddsdsd';

        const workerNewSessionStartedEventHandler = new WorkerNewSessionStartedEventHandler(this.messageBus, this.loggerStub, this._mainCommunicatorStub);

        this.messageBus.publish(MessageBusEventType.NewSessionStartedEvent, 'NEW SID');
        this.messageBus.publish(MessageBusEventType.NewSessionStartedEvent, 'NEW SID 2');

        this.messageBus.publish(MessageBusEventType.NewSessionStartedEvent, 'NEW SID 333');

        assert.exists(workerNewSessionStartedEventHandler);
        assert.isTrue(this._mainCommunicatorStub.sendAsync.calledThrice, 'MainCommunicator publish was not called thrice');
    });

    it('should not handle new session once an irrelevant event is triggered', function () {
        const workerNewSessionStartedEventHandler = new WorkerNewSessionStartedEventHandler(this.messageBus, this.loggerStub, this._mainCommunicatorStub);

        this.messageBus.publish(MessageBusEventType.TouchEvent, this.configurationRepositoryStub);

        assert.exists(workerNewSessionStartedEventHandler);
        assert.isTrue(this._mainCommunicatorStub.sendAsync.notCalled, 'MainCommunicator publish was called');
    });
});
