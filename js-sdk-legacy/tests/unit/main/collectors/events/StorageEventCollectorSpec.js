import { assert } from 'chai';
import StorageEventCollector from '../../../../../src/main/collectors/events/StorageEventCollector';
import CDUtils from '../../../../../src/main/technicalServices/CDUtils';
import { TestUtils } from '../../../../TestUtils';
import TestEvents from '../../../../TestEvents';
import MessageBus from '../../../../../src/main/technicalServices/MessageBus';
import DataQ from '../../../../../src/main/technicalServices/DataQ';
import ElementsCollector from '../../../../../src/main/collectors/events/ElementsCollector';
import BrowserContext from '../../../../../src/main/core/browsercontexts/BrowserContext';
import sinon from "sinon";

describe('StorageEvents tests:', function () {
    let maskingServiceStub;

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
        this._browserContext = new BrowserContext(self);
        maskingServiceStub = {
            maskAbsoluteIfRequired: sinon.stub().returnsArg(0),
            maskText: sinon.stub().returns('maskingServiceStub.maskText.mock'),
            _shouldMask: sinon.stub().returnsArg(0)
        };

        this.dataQStub = this.sandbox.createStubInstance(DataQ);
        this.messageBusStub = this.sandbox.createStubInstance(MessageBus);
        this.elementsStub = this.sandbox.createStubInstance(ElementsCollector);
        this.elementsStub.getElement.returns(32);
        this.elementsStub.isListed.returns(false);
        this.elementsStub._maskingService = maskingServiceStub
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    it('initialize StorageEvents events module', function () {
        const storageEvents = new StorageEventCollector(CDUtils, this.elementsStub, this.dataQStub, this.messageBusStub);
        storageEvents.startFeature(this._browserContext);

        assert.isTrue(this.dataQStub.addToQueue.notCalled, 'addToQueue was called although it should not');

        assert.isTrue(typeof storageEvents !== 'undefined' && storageEvents != null, 'StorageEvents object was not created');
        storageEvents.stopFeature(this._browserContext);
    });

    it('stop StorageEvents events module without starting', function () {
        const storageEvents = new StorageEventCollector(CDUtils, this.elementsStub, this.dataQStub, this.messageBusStub);

        storageEvents.stopFeature(this._browserContext);
    });

    it('stop StorageEvents stops sending events', async function () {
        const storageEvents = new StorageEventCollector(CDUtils, this.elementsStub, this.dataQStub, this.messageBusStub);
        storageEvents.startFeature(this._browserContext);

        TestEvents.publishStorageEvent('test_key', 'test_value');

        await TestUtils.waitForNoAssertion(() => {
            // Verify the storage events work...
            assert.equal(this.dataQStub.addToQueue.callCount, 1, 'addToQueue was not called on storage');
            const lastCall = this.dataQStub.addToQueue.getCall(0);
            assert.equal(lastCall.args[0], 'storage_events', 'expected to dispatch storage_events');
        });

        this.dataQStub.addToQueue.resetHistory();

        storageEvents.stopFeature(this._browserContext);

        TestEvents.publishStorageEvent('test_key2', 'test_value2');

        // Verify the storage events were not received...
        assert.equal(this.dataQStub.addToQueue.callCount, 0, 'addToQueue was called on storage but shouldnt have');
    });

    it('should call onStorageEvents for storage events ', function () {
        const storageEvents = new StorageEventCollector(CDUtils, this.elementsStub, this.dataQStub, this.messageBusStub);
        storageEvents.startFeature(this._browserContext);

        TestEvents.publishStorageEvent('tadadada', 'valNewVal');

        assert.equal(this.dataQStub.addToQueue.callCount, 1, 'addToQueue was not called on storage');
        const lastCall = this.dataQStub.addToQueue.getCall(0);
        assert.equal(lastCall.args[0], 'storage_events', 'expected to dispatch storage_events');

        storageEvents.stopFeature(this._browserContext);
    });
});
