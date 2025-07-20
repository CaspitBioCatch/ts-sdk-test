import BlurEventEmitter from '../../../../src/main/emitters/BlurEventEmitter';
import { MessageBusEventType } from '../../../../src/main/events/MessageBusEventType';
import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import TestFeatureSupport from '../../../TestFeatureSupport';
import { MockObjects } from '../../mocks/mockObjects';

describe('BlurEventEmitter Tests:', function () {
    const assert = chai.assert;

    beforeEach(function () {
        if (!TestFeatureSupport.isClipboardEventsSupported()) {
            this.skip();
        }

        this.sandbox = sinon.createSandbox();

        this._messageBusStub = this.sandbox.createStubInstance(MessageBus);
        this._eventAggregatorStub = this.sandbox.stub(MockObjects.eventAggregator);

        this.blurEventEmitter = new BlurEventEmitter(this._messageBusStub, this._eventAggregatorStub);
    });

    afterEach(function () {
        if (this.sandbox) {
            this.sandbox.restore();
        }
    });

    describe('start', function () {
        it('start emitter successfully', function () {
            this.blurEventEmitter.start(window);

            assert.isTrue(this._eventAggregatorStub.addEventListener.calledOnce);
            assert.equal(this._eventAggregatorStub.addEventListener.firstCall.args[1], 'blur');
            assert.equal(this._eventAggregatorStub.addEventListener.firstCall.args[2], this.blurEventEmitter.handleBlurEvent);
        });

        it('start with invalid document throws an error', function () {
            let thrownError = null;
            try {
                this.blurEventEmitter.start(undefined);
            } catch (e) {
                thrownError = e;
            }

            assert.exists(thrownError);
            assert.equal(thrownError.message, 'invalid window parameter');
        });
    });

    describe('stop', function () {
        it('stop emitter successfully', function () {
            this.blurEventEmitter.stop(window);

            assert.isTrue(this._eventAggregatorStub.removeEventListener.calledOnce);
            assert.equal(this._eventAggregatorStub.removeEventListener.firstCall.args[1], 'blur');
            assert.equal(this._eventAggregatorStub.removeEventListener.firstCall.args[2], this.blurEventEmitter.handleBlurEvent);
        });

        it('stop with invalid document throws an error', function () {
            let thrownError = null;
            try {
                this.blurEventEmitter.stop(undefined);
            } catch (e) {
                thrownError = e;
            }

            assert.exists(thrownError);
            assert.equal(thrownError.message, 'invalid window parameter');
        });
    });

    describe('Trigger events', function () {
        it('Should emit a blur event', function () {
            this.blurEventEmitter.start(window);

            const handler = this._eventAggregatorStub.addEventListener.firstCall.args[2];

            // trigger an event
            handler('blurEvent');

            assert.isTrue(this._messageBusStub.publish.calledOnce);
            assert.equal(this._messageBusStub.publish.firstCall.args[0], MessageBusEventType.BlurEvent);
            assert.deepEqual(this._messageBusStub.publish.firstCall.args[1], 'blurEvent');
        });

        it('Should emit multiple blur events', function () {
            this.blurEventEmitter.start(window);

            const handler = this._eventAggregatorStub.addEventListener.firstCall.args[2];

            // trigger an event
            handler('blurEvent 1');

            handler('blurEvent again?');

            handler('blurEvent again!!');

            assert.isTrue(this._messageBusStub.publish.calledThrice);
            assert.equal(this._messageBusStub.publish.firstCall.args[0], MessageBusEventType.BlurEvent);
            assert.deepEqual(this._messageBusStub.publish.firstCall.args[1], 'blurEvent 1');
            assert.equal(this._messageBusStub.publish.secondCall.args[0], MessageBusEventType.BlurEvent);
            assert.deepEqual(this._messageBusStub.publish.secondCall.args[1], 'blurEvent again?');
            assert.equal(this._messageBusStub.publish.thirdCall.args[0], MessageBusEventType.BlurEvent);
            assert.deepEqual(this._messageBusStub.publish.thirdCall.args[1], 'blurEvent again!!');
        });
    });
});
