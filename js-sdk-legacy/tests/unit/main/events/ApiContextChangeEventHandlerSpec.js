import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import ApiContextChangeEventHandler from '../../../../src/main/events/ApiContextChangeEventHandler';
import { MockObjects } from '../../mocks/mockObjects';
import { MessageBusEventType } from '../../../../src/main/events/MessageBusEventType';

describe('ApiContextChangeEventHandler tests:', function () {
    const assert = chai.assert;

    beforeEach(function () {
        this.messageBus = new MessageBus();

        this.contextManagerStub = sinon.stub(MockObjects.contextMgr);

        this.apiContextChangeEventHandler = new ApiContextChangeEventHandler(this.messageBus, this.contextManagerStub);
    });

    it('should handle context change once event is triggered', function () {
        const event = { type: 'ContextChange', context: 'tadada' };
        this.messageBus.publish(MessageBusEventType.ApiContextChangeEvent, event);

        assert.isTrue(this.contextManagerStub.changeContext.calledOnce, 'ContextManager was not called once');
        assert.equal(this.contextManagerStub.changeContext.firstCall.args[0], event.context, 'ContextManager.changeContext was not called with expected args');
    });

    it('should handle multiple context changes once multiple events are triggered', function () {
        const firstEvent = { type: 'ContextChange', context: 'a' };
        const secondEvent = { type: 'ContextChange', context: 'ab' };
        const thirdEvent = { type: 'ContextChange', context: 'abc' };

        this.messageBus.publish(MessageBusEventType.ApiContextChangeEvent, firstEvent);
        this.messageBus.publish(MessageBusEventType.ApiContextChangeEvent, secondEvent);
        this.messageBus.publish(MessageBusEventType.ApiContextChangeEvent, thirdEvent);

        assert.isTrue(this.contextManagerStub.changeContext.calledThrice, 'ContextManager was not called once');
        assert.equal(this.contextManagerStub.changeContext.firstCall.args[0], firstEvent.context, 'ContextManager.changeContext was not called with expected args');
        assert.equal(this.contextManagerStub.changeContext.secondCall.args[0], secondEvent.context, 'ContextManager.changeContext was not called with expected args');
        assert.equal(this.contextManagerStub.changeContext.thirdCall.args[0], thirdEvent.context, 'ContextManager.changeContext was not called with expected args');
    });

    it('should not handle context change once an irrelevant event is triggered', function () {
        this.messageBus.publish(MessageBusEventType.ConfigurationLoadedEvent, {});

        assert.isTrue(this.contextManagerStub.changeContext.notCalled, 'ContextManager was called');
    });
});
