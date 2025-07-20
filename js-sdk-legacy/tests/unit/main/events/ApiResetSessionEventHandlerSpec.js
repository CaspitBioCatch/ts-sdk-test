import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import ApiResetSessionEventHandler from '../../../../src/main/events/ApiResetSessionEventHandler';
import { MessageBusEventType } from '../../../../src/main/events/MessageBusEventType';
import SessionService from '../../../../src/main/core/session/SessionService';

describe('ApiResetSessionEventHandler tests:', function () {
    const assert = chai.assert;

    beforeEach(function () {
        this.messageBus = new MessageBus();

        this.sessionServiceStub = sinon.createStubInstance(SessionService);

        this.apiResetSessionEventHandler = new ApiResetSessionEventHandler(this.messageBus, this.sessionServiceStub);
    });

    it('should handle reset session once event is triggered', function () {
        const event = { type: 'ResetSession', resetReason: 'customerApi' };
        this.messageBus.publish(MessageBusEventType.ApiResetSessionEvent, event);

        assert.isTrue(this.sessionServiceStub.onResetSession.calledOnce, 'SessionService was not called once');
        assert.equal(this.sessionServiceStub.onResetSession.firstCall.args[0], event, 'SessionService.onResetSession was not called with expected args');
    });

    it('should handle multiple reset sessions once multiple events are triggered', function () {
        const firstEvent = { type: 'ResetSession', resetReason: 'customerApi' };
        const secondEvent = { type: 'ResetSession', resetReason: 'customerApi' };
        const thirdEvent = { type: 'ResetSession', resetReason: 'customerApi' };

        this.messageBus.publish(MessageBusEventType.ApiResetSessionEvent, firstEvent);
        this.messageBus.publish(MessageBusEventType.ApiResetSessionEvent, secondEvent);
        this.messageBus.publish(MessageBusEventType.ApiResetSessionEvent, thirdEvent);

        assert.isTrue(this.sessionServiceStub.onResetSession.calledThrice, 'SessionService was not called once');
        assert.equal(this.sessionServiceStub.onResetSession.firstCall.args[0], firstEvent, 'SessionService.onResetSession was not called with expected args');
        assert.equal(this.sessionServiceStub.onResetSession.secondCall.args[0], secondEvent, 'SessionService.onResetSession was not called with expected args');
        assert.equal(this.sessionServiceStub.onResetSession.thirdCall.args[0], thirdEvent, 'SessionService.onResetSession was not called with expected args');
    });

    it('should not handle reset session once an irrelevant event is triggered', function () {
        this.messageBus.publish(MessageBusEventType.ConfigurationLoadedEvent, {});

        assert.isTrue(this.sessionServiceStub.onResetSession.notCalled, 'SessionService was called');
    });
});
