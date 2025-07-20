import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import PsidService from '../../../../src/main/core/session/PsidService';
import ApiSetPsidEventHandler from '../../../../src/main/events/ApiSetPsidEventHandler';
import { MessageBusEventType } from '../../../../src/main/events/MessageBusEventType';

describe('ApiSetPsidEventHandler tests:', function () {
    const assert = chai.assert;

    beforeEach(function () {
        this.messageBus = new MessageBus();
        this.psidServiceStub = sinon.createStubInstance(PsidService);

        this.apiSetPsidEventHandler = new ApiSetPsidEventHandler(this.messageBus, this.psidServiceStub);
    });

    it('should handle set psid once event is triggered', function () {
        const event = { type: 'cdSetPsid', psid: 'pspspspdiid' };
        this.messageBus.publish(MessageBusEventType.ApiSetPsidEvent, event);

        assert.isTrue(this.psidServiceStub.set.calledOnce, 'PsidService was not called once');
        assert.equal(this.psidServiceStub.set.firstCall.args[0], event.psid, 'PsidService.set was not called with expected args');
    });

    it('should handle multiple set psids once multiple events are triggered', function () {
        const firstEvent = { type: 'cdSetPsid', psid: 'pspspspdiid' };
        const secondEvent = { type: 'cdSetPsid', psid: 'aaadgg' };
        const thirdEvent = { type: 'cdSetPsid', psid: '22222111' };

        this.messageBus.publish(MessageBusEventType.ApiSetPsidEvent, firstEvent);
        this.messageBus.publish(MessageBusEventType.ApiSetPsidEvent, secondEvent);
        this.messageBus.publish(MessageBusEventType.ApiSetPsidEvent, thirdEvent);

        assert.isTrue(this.psidServiceStub.set.calledThrice, 'PsidService was not called thrice');
        assert.equal(this.psidServiceStub.set.firstCall.args[0], firstEvent.psid, 'PsidService.set was not called with expected args');
        assert.equal(this.psidServiceStub.set.secondCall.args[0], secondEvent.psid, 'PsidService.set was not called with expected args');
        assert.equal(this.psidServiceStub.set.thirdCall.args[0], thirdEvent.psid, 'PsidService.set was not called with expected args');
    });

    it('should not handle set psid once an irrelevant event is triggered', function () {
        this.messageBus.publish(MessageBusEventType.ConfigurationLoadedEvent, {});

        assert.isTrue(this.psidServiceStub.set.notCalled, 'PsidService was called');
    });

    it('abort if psid is invalid', function () {
        const event = { type: 'cdSetPsid' };
        this.messageBus.publish(MessageBusEventType.ApiSetPsidEvent, event);

        assert.isTrue(this.psidServiceStub.set.notCalled, 'PsidService was called at least once');
    });
});
