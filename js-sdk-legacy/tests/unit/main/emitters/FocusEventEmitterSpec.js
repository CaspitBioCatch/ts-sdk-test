import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import EventAggregator from '../../../../src/main/system/EventAggregator';
import FocusEventEmitter from '../../../../src/main/emitters/FocusEventEmitter';
import { MessageBusEventType } from '../../../../src/main/events/MessageBusEventType';

describe('FocusEventEmitter Tests:', function () {
    const assert = chai.assert;

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();

        this._messageBusStub = this.sandbox.stub(new MessageBus());

        this._eventAggregatorAddEventListenerSpy = this.sandbox.spy(EventAggregator, 'addEventListener');
        this.focusEventEmitter = new FocusEventEmitter(this._messageBusStub, EventAggregator);
    });

    afterEach(function () {
        this.sandbox.restore();

        this._messageBusStub = null;
        this._eventAggregatorAddEventListenerSpy = null;
    });

    it('Should create a new instance of FocusEventEmitter', function () {
        assert.isObject(this.focusEventEmitter, 'Could not construct a new FocusEventEmitter object');
        assert.instanceOf(this.focusEventEmitter._messageBus, MessageBus, '_messageBus instance is not the expected one');
    });

    describe('start tests:', function () {
        it('starting the emitter registers for focus events', function () {
            this.focusEventEmitter.start(window);

            assert.isTrue(this._eventAggregatorAddEventListenerSpy.calledOnce);
            assert.isTrue(this._eventAggregatorAddEventListenerSpy.firstCall.args[0] === window);
            assert.equal(this._eventAggregatorAddEventListenerSpy.firstCall.args[1], 'focus');
            assert.equal(this._eventAggregatorAddEventListenerSpy.firstCall.args[2], this.focusEventEmitter.handleFocusEvent);
        });

        it('starting the emitter with a null window parameter throws an exception', function () {
            assert.throws(() => { return this.focusEventEmitter.start(null); }, 'invalid window parameter');
        });

        it('starting the emitter with a undefined window parameter throws an exception', function () {
            assert.throws(() => { return this.focusEventEmitter.start(); }, 'invalid window parameter');
        });
    });

    describe('stop tests:', function () {
        it('stopping the emitter registers for FocusEventEmitter events', function () {
            const eventAggregatorRemoveEventListenerSpy = this.sandbox.spy(EventAggregator, 'removeEventListener');

            this.focusEventEmitter.stop(window);

            assert.isTrue(eventAggregatorRemoveEventListenerSpy.calledOnce);
            assert.isTrue(eventAggregatorRemoveEventListenerSpy.firstCall.args[0] === window);
            assert.equal(eventAggregatorRemoveEventListenerSpy.firstCall.args[1], 'focus');
            assert.equal(eventAggregatorRemoveEventListenerSpy.firstCall.args[2], this.focusEventEmitter.handleFocusEvent);
        });

        it('stopping the emitter with a null window parameter throws an exception', function () {
            assert.throws(() => { return this.focusEventEmitter.stop(null); }, 'invalid window parameter');
        });

        it('stopping the emitter with a undefined window parameter throws an exception', function () {
            assert.throws(() => { return this.focusEventEmitter.stop(); }, 'invalid window parameter');
        });
    });

    describe('event tests:', function () {
        it('Should emit a focus event', function () {
            this.focusEventEmitter.start(window);

            // Get the handler registered for the event so we can execute it
            const handler = this._eventAggregatorAddEventListenerSpy.firstCall.args[2];

            handler('focusEvent');

            assert.isTrue(this._messageBusStub.publish.calledOnce);
            assert.equal(this._messageBusStub.publish.firstCall.args[0], MessageBusEventType.FocusEvent);
            assert.deepEqual(this._messageBusStub.publish.firstCall.args[1], 'focusEvent');
        });

        it('Should emit multiple focus events', function () {
            this.focusEventEmitter.start(window);

            // Get the handler registered for the event so we can execute it
            const handler = this._eventAggregatorAddEventListenerSpy.firstCall.args[2];

            handler('FocusEvent 1');

            handler('FocusEvent again?');

            handler('FocusEvent again!!');

            assert.isTrue(this._messageBusStub.publish.calledThrice);
            assert.equal(this._messageBusStub.publish.firstCall.args[0], MessageBusEventType.FocusEvent);
            assert.deepEqual(this._messageBusStub.publish.firstCall.args[1], 'FocusEvent 1');
            assert.equal(this._messageBusStub.publish.secondCall.args[0], MessageBusEventType.FocusEvent);
            assert.deepEqual(this._messageBusStub.publish.secondCall.args[1], 'FocusEvent again?');
            assert.equal(this._messageBusStub.publish.thirdCall.args[0], MessageBusEventType.FocusEvent);
            assert.deepEqual(this._messageBusStub.publish.thirdCall.args[1], 'FocusEvent again!!');
        });
    });
});
