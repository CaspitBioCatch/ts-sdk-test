import { assert } from 'chai';
import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import ClientEventService from '../../../../src/main/api/ClientEventService';
import StateChangedEventHandler from '../../../../src/main/events/StateChangedEventHandler';
import { MessageBusEventType } from '../../../../src/main/events/MessageBusEventType';

describe('StateChangedEventHandler tests:', function () {
    beforeEach(function () {
        this.messageBus = new MessageBus();

        this.clientEventServiceStub = sinon.createStubInstance(ClientEventService);

        this.newSessionStartedEventHandler = new StateChangedEventHandler(this.messageBus, this.clientEventServiceStub);
    });

    it('should handle session reset once event is triggered', function () {
        this.messageBus.publish(MessageBusEventType.StateChangedEvent, { state: 'started' });

        assert.isTrue(this.clientEventServiceStub.publishStateChangedEvent.calledOnce, 'ClientEventService was not called once');
        assert.equal(this.clientEventServiceStub.publishStateChangedEvent.firstCall.args[0], 'started', 'ClientEventService.publishStateChangedEvent was not called with expected args');
    });

    it('should handle multiple session resets once multiple events are triggered', function () {
        this.messageBus.publish(MessageBusEventType.StateChangedEvent, { state: 'starting' });
        this.messageBus.publish(MessageBusEventType.StateChangedEvent, { state: 'started' });
        this.messageBus.publish(MessageBusEventType.StateChangedEvent, { state: 'stopped' });

        assert.isTrue(this.clientEventServiceStub.publishStateChangedEvent.calledThrice, 'ClientEventService was not called thrice');
        assert.equal(this.clientEventServiceStub.publishStateChangedEvent.firstCall.args[0], 'starting', 'ClientEventService.publishStateChangedEvent was not called with expected args');
        assert.equal(this.clientEventServiceStub.publishStateChangedEvent.secondCall.args[0], 'started', 'ClientEventService.publishStateChangedEvent was not called with expected args');
        assert.equal(this.clientEventServiceStub.publishStateChangedEvent.thirdCall.args[0], 'stopped', 'ClientEventService.publishStateChangedEvent was not called with expected args');
    });

    it('should not handle session reset once an irrelevant event is triggered', function () {
        this.messageBus.publish(MessageBusEventType.ConfigurationLoadedEvent, null);

        assert.isTrue(this.clientEventServiceStub.publishStateChangedEvent.notCalled, 'ClientEventService was called');
    });
});
