import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import ApiCustomerMetadataEventHandler from '../../../../src/main/events/ApiCustomerMetadataEventHandler';
import { MessageBusEventType } from '../../../../src/main/events/MessageBusEventType';
import MetadataService from '../../../../src/main/core/metadata/MetadataService';

describe('ApiCustomerMetadataEventHandler tests:', function () {
    const assert = chai.assert;

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();

        this.messageBus = new MessageBus();

        this.handleMetadataStub = this.sandbox.createStubInstance(MetadataService);

        this.apiCustomerMetadataEventHandler = new ApiCustomerMetadataEventHandler(this.messageBus, this.handleMetadataStub);
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    it('should handle customer metadata once event is triggered', function () {
        const event = { type: 'cdCustomerMetadata', data: 'meta' };
        this.messageBus.publish(MessageBusEventType.ApiCustomerMetadataEvent, event);

        assert.isTrue(this.handleMetadataStub.onCustomerMetadata.calledOnce, 'HandleMetadata was not called once');
        assert.equal(this.handleMetadataStub.onCustomerMetadata.firstCall.args[0], event, 'HandleMetadata.onCustomerMetadata was not called with expected args');
    });

    it('should handle multiple customer metadatas once multiple events are triggered', function () {
        const firstEvent = { type: 'cdCustomerMetadata', data: 'data' };
        const secondEvent = { type: 'cdCustomerMetadata', data: 'd2' };
        const thirdEvent = { type: 'cdCustomerMetadata', data: '11' };

        this.messageBus.publish(MessageBusEventType.ApiCustomerMetadataEvent, firstEvent);
        this.messageBus.publish(MessageBusEventType.ApiCustomerMetadataEvent, secondEvent);
        this.messageBus.publish(MessageBusEventType.ApiCustomerMetadataEvent, thirdEvent);

        assert.isTrue(this.handleMetadataStub.onCustomerMetadata.calledThrice, 'HandleMetadata was not called once');
        assert.equal(this.handleMetadataStub.onCustomerMetadata.firstCall.args[0], firstEvent, 'HandleMetadata.onCustomerMetadata was not called with expected args');
        assert.equal(this.handleMetadataStub.onCustomerMetadata.secondCall.args[0], secondEvent, 'HandleMetadata.onCustomerMetadata was not called with expected args');
        assert.equal(this.handleMetadataStub.onCustomerMetadata.thirdCall.args[0], thirdEvent, 'HandleMetadata.onCustomerMetadata was not called with expected args');
    });

    it('should not handle customer metadata once an irrelevant event is triggered', function () {
        this.messageBus.publish(MessageBusEventType.ConfigurationLoadedEvent, {});

        assert.isTrue(this.handleMetadataStub.onCustomerMetadata.notCalled, 'HandleMetadata was called');
    });
});
