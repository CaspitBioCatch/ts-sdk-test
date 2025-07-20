import { assert } from 'chai';
import sinon from 'sinon';
import NetInfoEventCollector from '../../../../../src/main/collectors/events/NetInfoEventCollector';
import { EventStructure as NetInfoEventStructure } from '../../../../../src/main/collectors/events/NetInfoEventCollector';
import CDUtils from '../../../../../src/main/technicalServices/CDUtils';
import { dataQueue } from '../../../mocks/mockObjects';
import DataQ from '../../../../../src/main/technicalServices/DataQ';

describe('NetInfoEventCollector tests:', function () {
    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
        this.dataQueueStub = this.sandbox.createStubInstance(DataQ);
        this.clock = this.sandbox.useFakeTimers();

        // Mock connection object
        this.mockConnection = {
            addEventListener: this.sandbox.spy(),
            removeEventListener: this.sandbox.spy(),
            type: '4g',
            effectiveType: '4g',
            downlink: 10,
            rtt: 50
        };
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    describe('NetInfoEvents tests:', function () {
        it('should get NetInfo data and call queue', function () {
            CDUtils.StorageUtils.counter = 5;

            const netEvents = new NetInfoEventCollector(CDUtils, this.dataQueueStub, this.mockConnection);
            netEvents.startFeature(self);

            this.clock.tick(200);
            assert.isTrue(this.dataQueueStub.addToQueue.calledOnce, 'did event work?');
            assert.isTrue(this.dataQueueStub.addToQueue.firstCall.args[1].length === 9, 'net info event not 9 fields');
            assert.equal(this.dataQueueStub.addToQueue.firstCall.args[1][NetInfoEventStructure.indexOf('eventSequence') + 1], 5);
            netEvents.stopFeature(self);
            dataQueue.requests = []; // To empty the 'elements' event
        });

        it('should add event listener when startFeature is called', function () {
            const netEvents = new NetInfoEventCollector(CDUtils, this.dataQueueStub, this.mockConnection);
            netEvents.startFeature(self);

            assert.isTrue(this.mockConnection.addEventListener.calledOnce, 'addEventListener should be called once');
            assert.equal(this.mockConnection.addEventListener.firstCall.args[0], 'change', 'Event type should be "change"');
            assert.isFunction(this.mockConnection.addEventListener.firstCall.args[1], 'Second argument should be a function');
            assert.equal(this.mockConnection.addEventListener.firstCall.args[2], true, 'useCapture should be true');
        });

        it('should remove event listener when stopFeature is called', function () {
            const netEvents = new NetInfoEventCollector(CDUtils, this.dataQueueStub, this.mockConnection);
            netEvents.startFeature(self);
            netEvents.stopFeature(self);

            assert.isTrue(this.mockConnection.removeEventListener.calledOnce, 'removeEventListener should be called once');
            assert.equal(this.mockConnection.removeEventListener.firstCall.args[0], 'change', 'Event type should be "change"');
            assert.isFunction(this.mockConnection.removeEventListener.firstCall.args[1], 'Second argument should be a function');
            assert.equal(this.mockConnection.removeEventListener.firstCall.args[2], true, 'useCapture should be true');
        });

        it('should use the same function for adding and removing the listener', function () {
            const netEvents = new NetInfoEventCollector(CDUtils, this.dataQueueStub, this.mockConnection);
            netEvents.startFeature(self);
            const addedListener = this.mockConnection.addEventListener.firstCall.args[1];
            netEvents.stopFeature(self);
            const removedListener = this.mockConnection.removeEventListener.firstCall.args[1];

            assert.strictEqual(addedListener, removedListener, 'The same function should be used for adding and removing the listener');
        });
    });
});