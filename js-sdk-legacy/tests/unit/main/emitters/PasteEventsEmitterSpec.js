import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import PasteEventEmitter from '../../../../src/main/emitters/PasteEventEmitter';
import { MessageBusEventType } from '../../../../src/main/events/MessageBusEventType';
import TestFeatureSupport from '../../../TestFeatureSupport';
import { MockObjects } from '../../mocks/mockObjects';

describe('PasteEventEmitter Tests:', function () {
    const assert = chai.assert;

    beforeEach(function () {
        if (!TestFeatureSupport.isClipboardEventsSupported()) {
            this.skip();
        }

        this.sandbox = sinon.createSandbox();

        this._messageBusStub = this.sandbox.createStubInstance(MessageBus);
        this._eventAggregatorStub = this.sandbox.stub(MockObjects.eventAggregator);

        this.pasteEventEmitter = new PasteEventEmitter(this._messageBusStub, this._eventAggregatorStub);
    });

    afterEach(function () {
        if (this.sandbox) {
            this.sandbox.restore();
        }
    });

    describe('start', function () {
        it('start emitter successfully', function () {
            this.pasteEventEmitter.start(window.document);

            assert.isTrue(this._eventAggregatorStub.addEventListener.calledOnce);
            assert.equal(this._eventAggregatorStub.addEventListener.firstCall.args[1], 'paste');
            assert.equal(this._eventAggregatorStub.addEventListener.firstCall.args[2], this.pasteEventEmitter.handlePasteEvent);
        });

        it('start with invalid document throws an error', function () {
            let thrownError = null;
            try {
                this.pasteEventEmitter.start(undefined);
            } catch (e) {
                thrownError = e;
            }

            assert.exists(thrownError);
            assert.equal(thrownError.message, 'invalid document parameter');
        });
    });

    describe('stop', function () {
        it('stop emitter successfully', function () {
            this.pasteEventEmitter.stop(window.document);

            assert.isTrue(this._eventAggregatorStub.removeEventListener.calledOnce);
            assert.equal(this._eventAggregatorStub.removeEventListener.firstCall.args[1], 'paste');
            assert.equal(this._eventAggregatorStub.removeEventListener.firstCall.args[2], this.pasteEventEmitter.handlePasteEvent);
        });

        it('stop with invalid document throws an error', function () {
            let thrownError = null;
            try {
                this.pasteEventEmitter.stop(undefined);
            } catch (e) {
                thrownError = e;
            }

            assert.exists(thrownError);
            assert.equal(thrownError.message, 'invalid document parameter');
        });
    });

    describe('Trigger events', function () {
        it('Should emit a paste event', function () {
            this.pasteEventEmitter.start(window.document);

            const handler = this._eventAggregatorStub.addEventListener.firstCall.args[2];

            // trigger an event
            const e = new ClipboardEvent('paste', { dataType: 'text/plain', data: 'paste data' });
            handler(e);

            assert.isTrue(this._messageBusStub.publish.calledOnce);
            assert.equal(this._messageBusStub.publish.firstCall.args[0], MessageBusEventType.PasteEvent);
            assert.equal(this._messageBusStub.publish.firstCall.args[1], e);
        });

        it('Should emit multiple cut events', function () {
            this.pasteEventEmitter.start(window.document);

            const handler = this._eventAggregatorStub.addEventListener.firstCall.args[2];

            // trigger an event
            let e = new ClipboardEvent('paste', { dataType: 'text/plain', data: 'paste data' });
            handler(e);

            e = new ClipboardEvent('paste', { dataType: 'text/plain', data: 'paste data 2' });
            handler(e);

            e = new ClipboardEvent('paste', { dataType: 'text/plain', data: 'paste data again' });
            handler(e);

            e = new ClipboardEvent('paste', { dataType: 'text/plain', data: 'paste data and again' });
            handler(e);

            assert.equal(this._messageBusStub.publish.callCount, 4);
        });
    });
});
