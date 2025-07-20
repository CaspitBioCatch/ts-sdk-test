import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import EventAggregator from '../../../../src/main/system/EventAggregator';
import DOMContentLoadedEventEmitter from '../../../../src/main/emitters/DOMContentLoadedEventEmitter';
import { MessageBusEventType } from '../../../../src/main/events/MessageBusEventType';

describe('DOMContentLoadedEventEmitter Tests:', function () {
    const assert = chai.assert;

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();

        this._messageBusStub = this.sandbox.createStubInstance(MessageBus);

        this._eventAggregatorAddEventListenerSpy = this.sandbox.spy(EventAggregator, 'addEventListener');
        this.domContentLoadedEventEmitter = new DOMContentLoadedEventEmitter(this._messageBusStub, EventAggregator);
    });

    afterEach(function () {
        this.sandbox.restore();

        this._messageBusStub = null;
        this._eventAggregatorAddEventListenerSpy = null;
    });

    it('Should create a new instance of DOMContentLoadedEventEmitter', function () {
        assert.isObject(this.domContentLoadedEventEmitter, 'Could not construct a new DOMContentLoadedEventEmitter object');
        assert.instanceOf(this.domContentLoadedEventEmitter._messageBus, MessageBus, '_messageBus instance is not the expected one');
    });

    describe('start tests:', function () {
        it('starting the emitter registers for DOMContentLoaded events', function () {
            this.domContentLoadedEventEmitter.start(window.document);

            assert.isTrue(this._eventAggregatorAddEventListenerSpy.calledOnce);
            assert.isTrue(this._eventAggregatorAddEventListenerSpy.firstCall.args[0] === window.document);
            assert.equal(this._eventAggregatorAddEventListenerSpy.firstCall.args[1], 'DOMContentLoaded');
            assert.equal(this._eventAggregatorAddEventListenerSpy.firstCall.args[2], this.domContentLoadedEventEmitter.handleDOMContentLoadedEvent);
        });

        it('starting the emitter with a null document parameter throws an exception', function () {
            assert.throws(() => { return this.domContentLoadedEventEmitter.start(null); }, 'invalid document parameter');
        });

        it('starting the emitter with a undefined document parameter throws an exception', function () {
            assert.throws(() => { return this.domContentLoadedEventEmitter.start(); }, 'invalid document parameter');
        });
    });

    describe('stop tests:', function () {
        it('stopping the emitter registers for DOMContentLoaded events', function () {
            const eventAggregatorRemoveEventListenerSpy = this.sandbox.spy(EventAggregator, 'removeEventListener');

            this.domContentLoadedEventEmitter.stop(window.document);

            assert.isTrue(eventAggregatorRemoveEventListenerSpy.calledOnce);
            assert.isTrue(eventAggregatorRemoveEventListenerSpy.firstCall.args[0] === window.document);
            assert.equal(eventAggregatorRemoveEventListenerSpy.firstCall.args[1], 'DOMContentLoaded');
            assert.equal(eventAggregatorRemoveEventListenerSpy.firstCall.args[2], this.domContentLoadedEventEmitter.handleDOMContentLoadedEvent);
        });

        it('stopping the emitter with a null document parameter throws an exception', function () {
            assert.throws(() => { return this.domContentLoadedEventEmitter.stop(null); }, 'invalid document parameter');
        });

        it('stopping the emitter with a undefined document parameter throws an exception', function () {
            assert.throws(() => { return this.domContentLoadedEventEmitter.stop(); }, 'invalid document parameter');
        });
    });

    describe('event tests:', function () {
        it('Should emit a DOMContentLoaded event', function () {
            this.domContentLoadedEventEmitter.start(window.document);

            // Get the handler registered for the event so we can execute it
            const handler = this._eventAggregatorAddEventListenerSpy.firstCall.args[2];

            handler('DOMContentLoadedEvent');

            assert.isTrue(this._messageBusStub.publish.calledOnce);
            assert.equal(this._messageBusStub.publish.firstCall.args[0], MessageBusEventType.DOMContentLoadedEvent);
            assert.deepEqual(this._messageBusStub.publish.firstCall.args[1], 'DOMContentLoadedEvent');
        });

        it('Should emit multiple DOMContentLoaded events', function () {
            this.domContentLoadedEventEmitter.start(window.document);

            // Get the handler registered for the event so we can execute it
            const handler = this._eventAggregatorAddEventListenerSpy.firstCall.args[2];

            handler('DOMContentLoadedEvent 1');

            handler('DOMContentLoadedEvent again?');

            handler('DOMContentLoadedEvent again!!');

            assert.isTrue(this._messageBusStub.publish.calledThrice);
            assert.equal(this._messageBusStub.publish.firstCall.args[0], MessageBusEventType.DOMContentLoadedEvent);
            assert.deepEqual(this._messageBusStub.publish.firstCall.args[1], 'DOMContentLoadedEvent 1');
            assert.equal(this._messageBusStub.publish.secondCall.args[0], MessageBusEventType.DOMContentLoadedEvent);
            assert.deepEqual(this._messageBusStub.publish.secondCall.args[1], 'DOMContentLoadedEvent again?');
            assert.equal(this._messageBusStub.publish.thirdCall.args[0], MessageBusEventType.DOMContentLoadedEvent);
            assert.deepEqual(this._messageBusStub.publish.thirdCall.args[1], 'DOMContentLoadedEvent again!!');
        });
    });
});
