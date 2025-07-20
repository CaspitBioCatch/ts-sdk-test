import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import EventAggregator from '../../../../src/main/system/EventAggregator';
import ResizeEventEmitter from '../../../../src/main/emitters/ResizeEventEmitter';
import { MessageBusEventType } from '../../../../src/main/events/MessageBusEventType';

describe('ResizeEventEmitter Tests:', function () {
    const assert = chai.assert;

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();

        this._messageBusStub = this.sandbox.stub(new MessageBus());

        this._eventAggregatorAddEventListenerSpy = this.sandbox.spy(EventAggregator, 'addEventListener');
        this.resizeEventEmitter = new ResizeEventEmitter(this._messageBusStub, EventAggregator);
    });

    afterEach(function () {
        this.sandbox.restore();

        this._messageBusStub = null;
        this._eventAggregatorAddEventListenerSpy = null;
    });

    it('Should create a new instance of ResizeEventEmitter', function () {
        assert.isObject(this.resizeEventEmitter, 'Could not construct a new ResizeEventEmitter object');
        assert.instanceOf(this.resizeEventEmitter._messageBus, MessageBus, '_messageBus instance is not the expected one');
    });

    describe('start tests:', function () {
        it('starting the emitter registers for resize events', function () {
            this.resizeEventEmitter.start(window);

            assert.isTrue(this._eventAggregatorAddEventListenerSpy.calledOnce);
            assert.isTrue(this._eventAggregatorAddEventListenerSpy.firstCall.args[0] === window);
            assert.equal(this._eventAggregatorAddEventListenerSpy.firstCall.args[1], 'resize');
            assert.equal(this._eventAggregatorAddEventListenerSpy.firstCall.args[2], this.resizeEventEmitter.handleResizeEvent);
        });

        it('starting the emitter with a null window parameter throws an exception', function () {
            assert.throws(() => { return this.resizeEventEmitter.start(null); }, 'invalid window parameter');
        });

        it('starting the emitter with a undefined window parameter throws an exception', function () {
            assert.throws(() => { return this.resizeEventEmitter.start(); }, 'invalid window parameter');
        });
    });

    describe('stop tests:', function () {
        it('stopping the emitter registers for InstallPromptEventEmitter events', function () {
            const eventAggregatorRemoveEventListenerSpy = this.sandbox.spy(EventAggregator, 'removeEventListener');

            this.resizeEventEmitter.stop(window);

            assert.isTrue(eventAggregatorRemoveEventListenerSpy.calledOnce);
            assert.isTrue(eventAggregatorRemoveEventListenerSpy.firstCall.args[0] === window);
            assert.equal(eventAggregatorRemoveEventListenerSpy.firstCall.args[1], 'resize');
            assert.equal(eventAggregatorRemoveEventListenerSpy.firstCall.args[2], this.resizeEventEmitter.handleResizeEvent);
        });

        it('stopping the emitter with a null window parameter throws an exception', function () {
            assert.throws(() => { return this.resizeEventEmitter.stop(null); }, 'invalid window parameter');
        });

        it('stopping the emitter with a undefined window parameter throws an exception', function () {
            assert.throws(() => { return this.resizeEventEmitter.stop(); }, 'invalid window parameter');
        });
    });

    describe('event tests:', function () {
        it('Should emit a resize event', function () {
            this.resizeEventEmitter.start(window);

            // Get the handler registered for the event so we can execute it
            const handler = this._eventAggregatorAddEventListenerSpy.firstCall.args[2];

            handler('resize Event');

            assert.isTrue(this._messageBusStub.publish.calledOnce);
            assert.equal(this._messageBusStub.publish.firstCall.args[0], MessageBusEventType.ResizeEvent);
            assert.deepEqual(this._messageBusStub.publish.firstCall.args[1], 'resize Event');
        });

        it('Should emit multiple resize events', function () {
            this.resizeEventEmitter.start(window);

            // Get the handler registered for the event so we can execute it
            const handler = this._eventAggregatorAddEventListenerSpy.firstCall.args[2];

            handler('resize Event 1');

            handler('resize Event again?');

            handler('resize Event again!!');

            assert.isTrue(this._messageBusStub.publish.calledThrice);
            assert.equal(this._messageBusStub.publish.firstCall.args[0], MessageBusEventType.ResizeEvent);
            assert.deepEqual(this._messageBusStub.publish.firstCall.args[1], 'resize Event 1');
            assert.equal(this._messageBusStub.publish.secondCall.args[0], MessageBusEventType.ResizeEvent);
            assert.deepEqual(this._messageBusStub.publish.secondCall.args[1], 'resize Event again?');
            assert.equal(this._messageBusStub.publish.thirdCall.args[0], MessageBusEventType.ResizeEvent);
            assert.deepEqual(this._messageBusStub.publish.thirdCall.args[1], 'resize Event again!!');
        });
    });
});
