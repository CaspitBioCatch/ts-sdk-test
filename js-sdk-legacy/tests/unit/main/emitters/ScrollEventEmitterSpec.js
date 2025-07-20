import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import EventAggregator from '../../../../src/main/system/EventAggregator';
import ScrollEventEmitter from '../../../../src/main/emitters/ScrollEventEmitter';
import { MessageBusEventType } from '../../../../src/main/events/MessageBusEventType';

describe('ScrollEventEmitter Tests:', function () {
    const assert = chai.assert;

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();

        this._messageBusStub = this.sandbox.createStubInstance(MessageBus);

        this._eventAggregatorAddEventListenerSpy = this.sandbox.spy(EventAggregator, 'addEventListener');
        this.scrollEventEmitter = new ScrollEventEmitter(this._messageBusStub, EventAggregator);
    });

    afterEach(function () {
        this.sandbox.restore();

        this._messageBusStub = null;
        this._eventAggregatorAddEventListenerSpy = null;
    });

    it('Should create a new instance of ScrollEventEmitter', function () {
        assert.isObject(this.scrollEventEmitter, 'Could not construct a new ScrollEventEmitter object');
        assert.instanceOf(this.scrollEventEmitter._messageBus, MessageBus, '_messageBus instance is not the expected one');
    });

    describe('start tests:', function () {
        it('starting the emitter registers for scroll events', function () {
            this.scrollEventEmitter.start(window);

            assert.isTrue(this._eventAggregatorAddEventListenerSpy.calledOnce);
            assert.isTrue(this._eventAggregatorAddEventListenerSpy.firstCall.args[0] === window);
            assert.equal(this._eventAggregatorAddEventListenerSpy.firstCall.args[1], 'scroll');
            assert.equal(this._eventAggregatorAddEventListenerSpy.firstCall.args[2], this.scrollEventEmitter.handleScrollEvent);
        });

        it('starting the emitter with a null document parameter throws an exception', function () {
            assert.throws(() => { return this.scrollEventEmitter.start(null); }, 'invalid window parameter');
        });

        it('starting the emitter with a undefined document parameter throws an exception', function () {
            assert.throws(() => { return this.scrollEventEmitter.start(); }, 'invalid window parameter');
        });
    });

    describe('stop tests:', function () {
        it('stopping the emitter registers for scroll events', function () {
            const eventAggregatorRemoveEventListenerSpy = this.sandbox.spy(EventAggregator, 'removeEventListener');

            this.scrollEventEmitter.stop(window);

            assert.isTrue(eventAggregatorRemoveEventListenerSpy.calledOnce);
            assert.isTrue(eventAggregatorRemoveEventListenerSpy.firstCall.args[0] === window);
            assert.equal(eventAggregatorRemoveEventListenerSpy.firstCall.args[1], 'scroll');
            assert.equal(eventAggregatorRemoveEventListenerSpy.firstCall.args[2], this.scrollEventEmitter.handleScrollEvent);
        });

        it('stopping the emitter with a null document parameter throws an exception', function () {
            assert.throws(() => { return this.scrollEventEmitter.stop(null); }, 'invalid window parameter');
        });

        it('stopping the emitter with a undefined document parameter throws an exception', function () {
            assert.throws(() => { return this.scrollEventEmitter.stop(); }, 'invalid window parameter');
        });
    });

    describe('event tests:', function () {
        it('Should emit a scroll event', function () {
            this.scrollEventEmitter.start(window.document);

            // Get the handler registered for the event so we can execute it
            const handler = this._eventAggregatorAddEventListenerSpy.firstCall.args[2];

            handler('scrollEvent');

            assert.isTrue(this._messageBusStub.publish.calledOnce);
            assert.equal(this._messageBusStub.publish.firstCall.args[0], MessageBusEventType.ScrollEvent);
            assert.deepEqual(this._messageBusStub.publish.firstCall.args[1], 'scrollEvent');
        });

        it('Should emit multiple scroll events', function () {
            this.scrollEventEmitter.start(window);

            // Get the handler registered for the event so we can execute it
            const handler = this._eventAggregatorAddEventListenerSpy.firstCall.args[2];

            handler('scrollEvent 1');

            handler('scrollEvent again?');

            handler('scrollEvent again!!');

            assert.isTrue(this._messageBusStub.publish.calledThrice);
            assert.equal(this._messageBusStub.publish.firstCall.args[0], MessageBusEventType.ScrollEvent);
            assert.deepEqual(this._messageBusStub.publish.firstCall.args[1], 'scrollEvent 1');
            assert.equal(this._messageBusStub.publish.secondCall.args[0], MessageBusEventType.ScrollEvent);
            assert.deepEqual(this._messageBusStub.publish.secondCall.args[1], 'scrollEvent again?');
            assert.equal(this._messageBusStub.publish.thirdCall.args[0], MessageBusEventType.ScrollEvent);
            assert.deepEqual(this._messageBusStub.publish.thirdCall.args[1], 'scrollEvent again!!');
        });
    });
});
