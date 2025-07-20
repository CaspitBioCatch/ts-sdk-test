import CsidService from '../../../../src/main/core/session/CsidService';
import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import ApiSetCsidEventHandler from '../../../../src/main/events/ApiSetCsidEventHandler';
import { MessageBusEventType } from '../../../../src/main/events/MessageBusEventType';

describe('ApiSetCsidEventHandler tests:', function () {
    const assert = chai.assert;

    beforeEach(function () {
        this.messageBus = new MessageBus();
        this.csidServiceStub = sinon.createStubInstance(CsidService);

        this.apiSetCsidEventHandler = new ApiSetCsidEventHandler(this.messageBus, this.csidServiceStub);
    });

    it('should handle set csid once event is triggered', function () {
        const event = { type: 'cdSetCsid', csid: 'cccsiddd' };
        this.messageBus.publish(MessageBusEventType.ApiSetCsidEvent, event);

        assert.isTrue(this.csidServiceStub.set.calledOnce, 'CsidService was not called once');
        assert.equal(this.csidServiceStub.set.firstCall.args[0], event.csid, 'CsidService.set was not called with expected args');
    });

    it('should handle multiple set csids once multiple events are triggered', function () {
        const firstEvent = { type: 'cdSetPsid', csid: 'csccccsddi' };
        const secondEvent = { type: 'cdSetPsid', csid: 'aaadgg' };
        const thirdEvent = { type: 'cdSetPsid', csid: '22222111' };

        this.messageBus.publish(MessageBusEventType.ApiSetCsidEvent, firstEvent);
        this.messageBus.publish(MessageBusEventType.ApiSetCsidEvent, secondEvent);
        this.messageBus.publish(MessageBusEventType.ApiSetCsidEvent, thirdEvent);

        assert.isTrue(this.csidServiceStub.set.calledThrice, 'CsidService was not called thrice');
        assert.equal(this.csidServiceStub.set.firstCall.args[0], firstEvent.csid, 'CsidService.set was not called with expected args');
        assert.equal(this.csidServiceStub.set.secondCall.args[0], secondEvent.csid, 'CsidService.set was not called with expected args');
        assert.equal(this.csidServiceStub.set.thirdCall.args[0], thirdEvent.csid, 'CsidService.set was not called with expected args');
    });

    it('should not handle set csid once an irrelevant event is triggered', function () {
        this.messageBus.publish(MessageBusEventType.ConfigurationLoadedEvent, {});

        assert.isTrue(this.csidServiceStub.set.notCalled, 'CsidService was called');
    });

    it('abort if csid is invalid', function () {
        const event = { type: 'cdSetCsid' };
        this.messageBus.publish(MessageBusEventType.ApiSetCsidEvent, event);

        assert.isTrue(this.csidServiceStub.set.notCalled, 'CsidService was called at least once');
    });
});
