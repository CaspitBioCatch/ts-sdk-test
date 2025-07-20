import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import CutEventEmitter from '../../../../src/main/emitters/CutEventEmitter';
import { MessageBusEventType } from '../../../../src/main/events/MessageBusEventType';
import TestFeatureSupport from '../../../TestFeatureSupport';
import { MockObjects } from '../../mocks/mockObjects';

describe('CutEventEmitter Tests:', function () {
    const assert = chai.assert;

    beforeEach(function () {
        if (!TestFeatureSupport.isClipboardEventsSupported()) {
            this.skip();
        }

        this.sandbox = sinon.createSandbox();

        this._messageBusStub = this.sandbox.createStubInstance(MessageBus);
        this._eventAggregatorStub = this.sandbox.stub(MockObjects.eventAggregator);

        this.cutEventEmitter = new CutEventEmitter(this._messageBusStub, this._eventAggregatorStub);
    });

    afterEach(function () {
        if (this.sandbox) {
            this.sandbox.restore();
        }
    });

    describe('start', function () {
        it('start emitter successfully', function () {
            this.cutEventEmitter.start(window.document);

            assert.isTrue(this._eventAggregatorStub.addEventListener.calledOnce);
            assert.equal(this._eventAggregatorStub.addEventListener.firstCall.args[1], 'cut');
            assert.equal(this._eventAggregatorStub.addEventListener.firstCall.args[2], this.cutEventEmitter.handleCutEvent);
        });

        it('start with invalid document throws an error', function () {
            let thrownError = null;
            try {
                this.cutEventEmitter.start(undefined);
            } catch (e) {
                thrownError = e;
            }

            assert.exists(thrownError);
            assert.equal(thrownError.message, 'invalid document parameter');
        });
    });

    describe('stop', function () {
        it('stop emitter successfully', function () {
            this.cutEventEmitter.stop(window.document);

            assert.isTrue(this._eventAggregatorStub.removeEventListener.calledOnce);
            assert.equal(this._eventAggregatorStub.removeEventListener.firstCall.args[1], 'cut');
            assert.equal(this._eventAggregatorStub.removeEventListener.firstCall.args[2], this.cutEventEmitter.handleCutEvent);
        });

        it('stop with invalid document throws an error', function () {
            let thrownError = null;
            try {
                this.cutEventEmitter.stop(undefined);
            } catch (e) {
                thrownError = e;
            }

            assert.exists(thrownError);
            assert.equal(thrownError.message, 'invalid document parameter');
        });
    });

    describe('Trigger events', function () {
        it('Should emit a cut event', function () {
            this.cutEventEmitter.start(window.document);

            const handler = this._eventAggregatorStub.addEventListener.firstCall.args[2];

            // trigger an event
            const e = new ClipboardEvent('cut', { dataType: 'text/plain', data: 'cut data' });
            handler(e);

            assert.isTrue(this._messageBusStub.publish.calledOnce);
            assert.equal(this._messageBusStub.publish.firstCall.args[0], MessageBusEventType.CutEvent);
            assert.equal(this._messageBusStub.publish.firstCall.args[1], e);
        });

        it('Should emit multiple cut events', function () {
            this.cutEventEmitter.start(window.document);

            const handler = this._eventAggregatorStub.addEventListener.firstCall.args[2];

            // trigger an event
            let e = new ClipboardEvent('cut', { dataType: 'text/plain', data: 'cut data' });
            handler(e);

            e = new ClipboardEvent('cut', { dataType: 'text/plain', data: 'cut data 2' });
            handler(e);

            e = new ClipboardEvent('cut', { dataType: 'text/plain', data: 'cut data again' });
            handler(e);

            e = new ClipboardEvent('cut', { dataType: 'text/plain', data: 'cut data and again' });
            handler(e);

            assert.equal(this._messageBusStub.publish.callCount, 4);
        });
    });
});
