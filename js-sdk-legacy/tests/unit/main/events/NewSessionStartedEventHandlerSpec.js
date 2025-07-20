import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import ClientEventService from '../../../../src/main/api/ClientEventService';
import NewSessionStartedEventHandler from '../../../../src/main/events/NewSessionStartedEventHandler';
import { MockObjects } from '../../mocks/mockObjects';
import { MessageBusEventType } from '../../../../src/main/events/MessageBusEventType';
import CustomerApiBridge from '../../../../src/main/api/CustomerApiBridge';
import FeatureService from '../../../../src/main/collectors/FeatureService';
import SessionInfoService from '../../../../src/main/core/session/SessionInfoService';

describe('NewSessionStartedEventHandler tests:', function () {
    const assert = chai.assert;

    beforeEach(function () {
        this.messageBus = new MessageBus();

        this.featureServiceStub = sinon.createStubInstance(FeatureService);
        this.customerApiBridgeStub = sinon.createStubInstance(CustomerApiBridge);
        this.contextMgrStub = sinon.stub(MockObjects.contextMgr);
        this.clientEventServiceStub = sinon.createStubInstance(ClientEventService);
        this.sessionInfoServiceStub = sinon.createStubInstance(SessionInfoService);

        this.newSessionStartedEventHandler = new NewSessionStartedEventHandler(this.messageBus, this.featureServiceStub,
            this.customerApiBridgeStub, this.contextMgrStub, this.clientEventServiceStub, this.sessionInfoServiceStub);
    });

    it('should handle session reset once event is triggered', function () {
        const sessionId = 'new session ID';
        this.messageBus.publish(MessageBusEventType.NewSessionStartedEvent, sessionId);

        assert.isTrue(this.sessionInfoServiceStub.markStartTime.calledOnce);

        assert.isTrue(this.featureServiceStub.runPerSessionFeatures.calledOnce, 'FeatureService was not called once');

        assert.isTrue(this.customerApiBridgeStub.notifySessionReset.calledOnce, 'CustomerApiBridge was not called once');
        assert.equal(this.customerApiBridgeStub.notifySessionReset.firstCall.args[0], sessionId, 'CustomerApiBridge.notifySessionReset was not called with expected args');
        assert.isTrue(this.contextMgrStub.onSessionReset.calledOnce, 'contextMgr was not called once');
        assert.isTrue(this.clientEventServiceStub.publishNewSessionStartedEvent.calledOnce, 'ClientEventService was not called once');
        assert.equal(this.clientEventServiceStub.publishNewSessionStartedEvent.firstCall.args[0], sessionId, 'ClientEventService.publishStateChangedEvent was not called with expected args');
    });

    it('should handle multiple session resets once multiple events are triggered', function () {
        const sessionId = 'new session ID';
        this.messageBus.publish(MessageBusEventType.NewSessionStartedEvent, sessionId);
        this.messageBus.publish(MessageBusEventType.NewSessionStartedEvent, null);
        this.messageBus.publish(MessageBusEventType.NewSessionStartedEvent, undefined);

        assert.isTrue(this.sessionInfoServiceStub.markStartTime.calledThrice);

        assert.isTrue(this.featureServiceStub.runPerSessionFeatures.calledThrice, 'FeatureService was not called once');

        assert.isTrue(this.customerApiBridgeStub.notifySessionReset.calledThrice, 'CustomerApiBridge was not called once');
        assert.equal(this.customerApiBridgeStub.notifySessionReset.firstCall.args[0], sessionId, 'CustomerApiBridge.notifySessionReset was not called with expected args');
        assert.equal(this.customerApiBridgeStub.notifySessionReset.secondCall.args[0], null, 'CustomerApiBridge.notifySessionReset was not called with expected args');
        assert.equal(this.customerApiBridgeStub.notifySessionReset.thirdCall.args[0], undefined, 'CustomerApiBridge.notifySessionReset was not called with expected args');
        assert.isTrue(this.clientEventServiceStub.publishNewSessionStartedEvent.calledThrice, 'ClientEventService was not called thrice');
        assert.equal(this.clientEventServiceStub.publishNewSessionStartedEvent.firstCall.args[0], sessionId, 'ClientEventService.publishStateChangedEvent was not called with expected args');
        assert.equal(this.clientEventServiceStub.publishNewSessionStartedEvent.secondCall.args[0], null, 'ClientEventService.publishStateChangedEvent was not called with expected args');
        assert.equal(this.clientEventServiceStub.publishNewSessionStartedEvent.thirdCall.args[0], undefined, 'ClientEventService.publishStateChangedEvent was not called with expected args');
    });

    it('should not handle session reset once an irrelevant event is triggered', function () {
        const sessionId = 'new session ID';
        this.messageBus.publish(MessageBusEventType.ConfigurationLoadedEvent, sessionId);

        assert.isTrue(this.sessionInfoServiceStub.markStartTime.notCalled);
        assert.isTrue(this.featureServiceStub.runPerSessionFeatures.notCalled, 'FeatureService was called');
        assert.isTrue(this.customerApiBridgeStub.notifySessionReset.notCalled, 'CustomerApiBridge was called');
        assert.isTrue(this.clientEventServiceStub.publishNewSessionStartedEvent.notCalled, 'ClientEventService.publishStateChangedEvent was called');
    });
});
