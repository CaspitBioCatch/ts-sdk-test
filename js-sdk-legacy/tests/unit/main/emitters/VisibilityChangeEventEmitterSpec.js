import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import EventAggregator from '../../../../src/main/system/EventAggregator';
import VisibilityChangeEventEmitter from '../../../../src/main/emitters/VisibilityChangeEventEmitter';
import { MessageBusEventType } from '../../../../src/main/events/MessageBusEventType';

describe('VisibilityChangeEventEmitter Tests:', function () {
    const assert = chai.assert;

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();

        this._messageBusStub = this.sandbox.stub(new MessageBus());
        this._eventAggregator = EventAggregator;
        this._eventAggregatorAddEventListenerSpy = this.sandbox.spy(this._eventAggregator, 'addEventListener');
        this.visibilityChangeEventEmitter = new VisibilityChangeEventEmitter(this._messageBusStub, this._eventAggregator);
    });

    afterEach(function () {
        this.sandbox.restore();
        this._eventAggregator = null;
        this._messageBusStub = null;
        this._eventAggregatorAddEventListenerSpy = null;
    });

    it('Should create a new instance of VisibilityChangeEventEmitter', function () {
        assert.isObject(this.visibilityChangeEventEmitter, 'Could not construct a new VisibilityChangeEventEmitter object');
        assert.instanceOf(this.visibilityChangeEventEmitter._messageBus, MessageBus, '_messageBus instance is not the expected one');
    });

    describe('start tests:', function () {
        it('starting the emitter registers for visibilitychange events', function () {
            this.visibilityChangeEventEmitter.start(window.document);

            assert.isTrue(this._eventAggregatorAddEventListenerSpy.calledOnce);
            assert.isTrue(this._eventAggregatorAddEventListenerSpy.firstCall.args[0] === window.document);
            assert.equal(this._eventAggregatorAddEventListenerSpy.firstCall.args[1], 'visibilitychange');
            assert.equal(this._eventAggregatorAddEventListenerSpy.firstCall.args[2], this.visibilityChangeEventEmitter.handleVisibilityChangeEvent);
        });

        it('starting the emitter with a null document parameter throws an exception', function () {
            assert.throws(() => { return this.visibilityChangeEventEmitter.start(null); }, 'invalid document parameter');
        });

        it('starting the emitter with a undefined document parameter throws an exception', function () {
            assert.throws(() => { return this.visibilityChangeEventEmitter.start(); }, 'invalid document parameter');
        });
    });

    describe('stop tests:', function () {
        it('stopping the emitter registers for InstallPromptEventEmitter events', function () {
            const eventAggregatorRemoveEventListenerSpy = this.sandbox.spy(EventAggregator, 'removeEventListener');

            this.visibilityChangeEventEmitter.stop(window.document);

            assert.isTrue(eventAggregatorRemoveEventListenerSpy.calledOnce);
            assert.isTrue(eventAggregatorRemoveEventListenerSpy.firstCall.args[0] === window.document);
            assert.equal(eventAggregatorRemoveEventListenerSpy.firstCall.args[1], 'visibilitychange');
            assert.equal(eventAggregatorRemoveEventListenerSpy.firstCall.args[2], this.visibilityChangeEventEmitter.handleVisibilityChangeEvent);
        });

        it('stopping the emitter with a null document parameter throws an exception', function () {
            assert.throws(() => { return this.visibilityChangeEventEmitter.stop(null); }, 'invalid document parameter');
        });

        it('stopping the emitter with a undefined document parameter throws an exception', function () {
            assert.throws(() => { return this.visibilityChangeEventEmitter.stop(); }, 'invalid document parameter');
        });
    });

    describe('event tests:', function () {
        it('Should emit a visibilitychange event', function () {
            this.visibilityChangeEventEmitter.start(window.document);

            // Get the handler registered for the event so we can execute it
            const handler = this._eventAggregatorAddEventListenerSpy.firstCall.args[2];

            handler('visibilitychange Event');

            assert.isTrue(this._messageBusStub.publish.calledOnce);
            assert.equal(this._messageBusStub.publish.firstCall.args[0], MessageBusEventType.VisibilityChangeEvent);
            assert.deepEqual(this._messageBusStub.publish.firstCall.args[1], 'visibilitychange Event');
        });

        it('Should emit multiple visibilitychange events', function () {
            this.visibilityChangeEventEmitter.start(window.document);

            // Get the handler registered for the event so we can execute it
            const handler = this._eventAggregatorAddEventListenerSpy.firstCall.args[2];

            handler('visibilitychange Event 1');

            handler('visibilitychange Event again?');

            handler('visibilitychange Event again!!');

            assert.isTrue(this._messageBusStub.publish.calledThrice);
            assert.equal(this._messageBusStub.publish.firstCall.args[0], MessageBusEventType.VisibilityChangeEvent);
            assert.deepEqual(this._messageBusStub.publish.firstCall.args[1], 'visibilitychange Event 1');
            assert.equal(this._messageBusStub.publish.secondCall.args[0], MessageBusEventType.VisibilityChangeEvent);
            assert.deepEqual(this._messageBusStub.publish.secondCall.args[1], 'visibilitychange Event again?');
            assert.equal(this._messageBusStub.publish.thirdCall.args[0], MessageBusEventType.VisibilityChangeEvent);
            assert.deepEqual(this._messageBusStub.publish.thirdCall.args[1], 'visibilitychange Event again!!');
        });
    });
});
