import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import ApiChangeStateEventHandler from '../../../../src/main/events/ApiChangeStateEventHandler';
import { MessageBusEventType } from '../../../../src/main/events/MessageBusEventType';
import PauseResumeManager from '../../../../src/main/core/state/PauseResumeManager';
import SlaveListener from '../../../../src/main/services/SlaveListener';

describe('ApiChangeStateEventHandler tests:', function () {
    const assert = chai.assert;

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();

        this.messageBus = new MessageBus();

        this.pauseResumeManagerStub = this.sandbox.createStubInstance(PauseResumeManager);
        this.slaveListenerStub = this.sandbox.createStubInstance(SlaveListener);

        this.apiChangeStateEventHandler = new ApiChangeStateEventHandler(this.messageBus, this.pauseResumeManagerStub,
            this.slaveListenerStub);
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    it('should handle state change once event is triggered', function () {
        const event = { type: 'cdChangeState', toState: 'pause' };
        this.messageBus.publish(MessageBusEventType.ApiChangeStateEvent, event);

        assert.isTrue(this.pauseResumeManagerStub.onStateChange.calledOnce, 'PauseResumeManager was not called once');
        assert.equal(this.pauseResumeManagerStub.onStateChange.firstCall.args[0], event, 'PauseResumeManager.onStateChange was not called with expected args');
        assert.isTrue(this.slaveListenerStub.notifyStateChange.calledOnce, 'SlaveListener was not called once');
        assert.equal(this.slaveListenerStub.notifyStateChange.firstCall.args[0], event, 'SlaveListener.notifyStateChange was not called with expected args');
    });

    it('should handle multiple state changes once multiple events are triggered', function () {
        const firstEvent = { type: 'cdChangeState', toState: 'pause' };
        const secondEvent = { type: 'cdChangeState', toState: 'run' };
        const thirdEvent = { type: 'cdChangeState', toState: 'pause' };

        this.messageBus.publish(MessageBusEventType.ApiChangeStateEvent, firstEvent);
        this.messageBus.publish(MessageBusEventType.ApiChangeStateEvent, secondEvent);
        this.messageBus.publish(MessageBusEventType.ApiChangeStateEvent, thirdEvent);

        assert.isTrue(this.pauseResumeManagerStub.onStateChange.calledThrice, 'PauseResumeManager was not called once');
        assert.equal(this.pauseResumeManagerStub.onStateChange.firstCall.args[0], firstEvent, 'PauseResumeManager.onStateChange was not called with expected args');
        assert.equal(this.pauseResumeManagerStub.onStateChange.secondCall.args[0], secondEvent, 'PauseResumeManager.onStateChange was not called with expected args');
        assert.equal(this.pauseResumeManagerStub.onStateChange.thirdCall.args[0], thirdEvent, 'PauseResumeManager.onStateChange was not called with expected args');

        assert.isTrue(this.slaveListenerStub.notifyStateChange.calledThrice, 'SlaveListener was not called once');
        assert.equal(this.slaveListenerStub.notifyStateChange.firstCall.args[0], firstEvent, 'SlaveListener.notifyStateChange was not called with expected args');
        assert.equal(this.slaveListenerStub.notifyStateChange.secondCall.args[0], secondEvent, 'SlaveListener.notifyStateChange was not called with expected args');
        assert.equal(this.slaveListenerStub.notifyStateChange.thirdCall.args[0], thirdEvent, 'SlaveListener.notifyStateChange was not called with expected args');
    });

    it('should not handle state change once an irrelevant event is triggered', function () {
        const sessionId = 'new session ID';
        this.messageBus.publish(MessageBusEventType.ConfigurationLoadedEvent, sessionId);

        assert.isTrue(this.pauseResumeManagerStub.onStateChange.notCalled, 'PauseResumeManager was called');
        assert.isTrue(this.slaveListenerStub.notifyStateChange.notCalled, 'SlaveListener was called');
    });
});
