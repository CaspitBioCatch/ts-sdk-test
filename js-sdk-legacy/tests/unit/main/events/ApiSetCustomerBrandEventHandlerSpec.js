import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import BrandService from '../../../../src/main/core/branding/BrandService';
import { MessageBusEventType } from '../../../../src/main/events/MessageBusEventType';
import ApiSetCustomerBrandEventHandler from '../../../../src/main/events/ApiSetCustomerBrandEventHandler';

describe('ApiSetCustomerBrandEventHandler tests:', function () {
    const assert = chai.assert;

    beforeEach(function() {
        this.messageBus = new MessageBus();
        this.brandServiceStub = sinon.createStubInstance(BrandService);

        this.apiSetCustomerBrandEventHandler = new ApiSetCustomerBrandEventHandler(this.messageBus, this.brandServiceStub);
    });

    it('should handle brand once an event is triggered', function () {
        const event = { type: 'cdSetCustomerBrand', brand: 'brand123' };
        this.messageBus.publish(MessageBusEventType.ApiSetCustomerBrand, event);

        assert.isTrue(this.brandServiceStub.set.calledOnce, 'BrandService set was not called');
        assert.equal(this.brandServiceStub.set.firstCall.args[0], event.brand, 'BrandService was not called with expected args');
    });

    it('should log warning is brand is empty', function () {
        const event = { type: 'cdSetCustomerBrand', brand: '' };
        this.messageBus.publish(MessageBusEventType.ApiSetCustomerBrand, event);

        assert.isTrue(this.brandServiceStub.set.notCalled, 'BrandService set was called when it should not');
    });

    it('should handle multiple set of brand once multiple events are triggered', function () {
        const firstEvent = { type: 'cdSetCustomerBrand', brand: 'brand123' };
        const secondEvent = { type: 'cdSetCustomerBrand', brand: 'other Brand' };
        const thirdEvent = { type: 'cdSetCustomerBrand', brand: 'brand_name' };

        this.messageBus.publish(MessageBusEventType.ApiSetCustomerBrand, firstEvent);
        this.messageBus.publish(MessageBusEventType.ApiSetCustomerBrand, secondEvent);
        this.messageBus.publish(MessageBusEventType.ApiSetCustomerBrand, thirdEvent);

        assert.isTrue(this.brandServiceStub.set.calledThrice, 'BrandService was not called thrice');
        assert.equal(this.brandServiceStub.set.firstCall.args[0], firstEvent.brand, 'BrandService.set was not called with expected args');
        assert.equal(this.brandServiceStub.set.secondCall.args[0], secondEvent.brand, 'BrandService.set was not called with expected args');
        assert.equal(this.brandServiceStub.set.thirdCall.args[0], thirdEvent.brand, 'BrandService.set was not called with expected args');
    });

    it('should not handle set brand once a different event is triggered', function() {
        this.messageBus.publish(MessageBusEventType.ConfigurationLoadedEvent, {});

        assert.isTrue(this.brandServiceStub.set.notCalled, 'BrandService was called');
    });
});
