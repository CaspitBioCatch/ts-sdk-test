import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import CopyEventEmitter from '../../../../src/main/emitters/CopyEventEmitter';
import { MessageBusEventType } from '../../../../src/main/events/MessageBusEventType';
import TestFeatureSupport from '../../../TestFeatureSupport';
import { MockObjects } from '../../mocks/mockObjects';

describe('CopyEventEmitter Service Tests:', function () {
    const assert = chai.assert;

    beforeEach(function () {
        if (!TestFeatureSupport.isClipboardEventsSupported()) {
            this.skip();
        }

        this.sandbox = sinon.createSandbox();

        this._messageBusStub = this.sandbox.createStubInstance(MessageBus);
        this._eventAggregatorStub = this.sandbox.stub(MockObjects.eventAggregator);

        this.copyEventEmitter = new CopyEventEmitter(this._messageBusStub, this._eventAggregatorStub);
    });

    afterEach(function () {
        if (this.sandbox) {
            this.sandbox.restore();
        }
    });

    describe('start', function () {
        it('start emitter successfully', function () {
            this.copyEventEmitter.start(document);

            assert.isTrue(this._eventAggregatorStub.addEventListener.calledOnce);
            assert.equal(this._eventAggregatorStub.addEventListener.firstCall.args[1], 'copy');
            assert.equal(this._eventAggregatorStub.addEventListener.firstCall.args[2], this.copyEventEmitter.handleCopyEvent);
        });

        it('start with invalid document throws an error', function () {
            let thrownError = null;
            try {
                this.copyEventEmitter.start(undefined);
            } catch (e) {
                thrownError = e;
            }

            assert.exists(thrownError);
            assert.equal(thrownError.message, 'invalid document parameter');
        });
    });

    describe('stop', function () {
        it('stop emitter successfully', function () {
            this.copyEventEmitter.stop(document);

            assert.isTrue(this._eventAggregatorStub.removeEventListener.calledOnce);
            assert.equal(this._eventAggregatorStub.removeEventListener.firstCall.args[1], 'copy');
            assert.equal(this._eventAggregatorStub.removeEventListener.firstCall.args[2], this.copyEventEmitter.handleCopyEvent);
        });

        it('stop with invalid document throws an error', function () {
            let thrownError = null;
            try {
                this.copyEventEmitter.stop(undefined);
            } catch (e) {
                thrownError = e;
            }

            assert.exists(thrownError);
            assert.equal(thrownError.message, 'invalid document parameter');
        });
    });

    describe('Trigger events', function () {
        it('Should emit a copy event', function () {
            this.copyEventEmitter.start(window.document);

            const handler = this._eventAggregatorStub.addEventListener.firstCall.args[2];

            // trigger an event
            const e = new ClipboardEvent('copy', { dataType: 'text/plain', data: 'copy data' });
            handler(e);

            assert.isTrue(this._messageBusStub.publish.calledOnce);
            assert.equal(this._messageBusStub.publish.firstCall.args[0], MessageBusEventType.CopyEvent);
            assert.equal(this._messageBusStub.publish.firstCall.args[1], e);
        });

        it('Should emit multiple copy events', function () {
            this.copyEventEmitter.start(window.document);

            const handler = this._eventAggregatorStub.addEventListener.firstCall.args[2];

            // trigger an event
            let e = new ClipboardEvent('copy', { dataType: 'text/plain', data: 'copy data' });
            handler(e);

            e = new ClipboardEvent('copy', { dataType: 'text/plain', data: 'copy data 2' });
            handler(e);

            e = new ClipboardEvent('copy', { dataType: 'text/plain', data: 'copy data again' });
            handler(e);

            e = new ClipboardEvent('copy', { dataType: 'text/plain', data: 'copy data and again' });
            handler(e);

            assert.equal(this._messageBusStub.publish.callCount, 4);
        });
    });
});
