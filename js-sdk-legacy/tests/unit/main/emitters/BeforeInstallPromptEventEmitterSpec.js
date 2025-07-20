import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import EventAggregator from '../../../../src/main/system/EventAggregator';
import BeforeInstallPromptEventEmitter from '../../../../src/main/emitters/BeforeInstallPromptEventEmitter';
import { MessageBusEventType } from '../../../../src/main/events/MessageBusEventType';

describe('BeforeInstallPromptEventEmitter Tests:', function () {
    const assert = chai.assert;

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();

        this._messageBusStub = this.sandbox.stub(new MessageBus());

        this._eventAggregatorAddEventListenerSpy = this.sandbox.spy(EventAggregator, 'addEventListener');
        this.beforeInstallPromptEventEmitter = new BeforeInstallPromptEventEmitter(this._messageBusStub, EventAggregator);
    });

    afterEach(function () {
        this.sandbox.restore();

        this._messageBusStub = null;
        this._eventAggregatorAddEventListenerSpy = null;
    });

    it('Should create a new instance of BeforeInstallPromptEventEmitter', function () {
        assert.isObject(this.beforeInstallPromptEventEmitter, 'Could not construct a new BeforeInstallPromptEventEmitter object');
        assert.instanceOf(this.beforeInstallPromptEventEmitter._messageBus, MessageBus, '_messageBus instance is not the expected one');
    });

    describe('start tests:', function () {
        it('starting the emitter registers for beforeinstallprompt events', function () {
            this.beforeInstallPromptEventEmitter.start(window);

            assert.isTrue(this._eventAggregatorAddEventListenerSpy.calledOnce);
            assert.isTrue(this._eventAggregatorAddEventListenerSpy.firstCall.args[0] === window);
            assert.equal(this._eventAggregatorAddEventListenerSpy.firstCall.args[1], 'beforeinstallprompt');
            assert.equal(this._eventAggregatorAddEventListenerSpy.firstCall.args[2], this.beforeInstallPromptEventEmitter.handleBeforeInstallPrompt);
        });

        it('starting the emitter with a null window parameter throws an exception', function () {
            assert.throws(() => { return this.beforeInstallPromptEventEmitter.start(null); }, 'invalid window parameter');
        });

        it('starting the emitter with a undefined window parameter throws an exception', function () {
            assert.throws(() => { return this.beforeInstallPromptEventEmitter.start(); }, 'invalid window parameter');
        });
    });

    describe('stop tests:', function () {
        it('stopping the emitter registers for InstallPromptEventEmitter events', function () {
            const eventAggregatorRemoveEventListenerSpy = this.sandbox.spy(EventAggregator, 'removeEventListener');

            this.beforeInstallPromptEventEmitter.stop(window);

            assert.isTrue(eventAggregatorRemoveEventListenerSpy.calledOnce);
            assert.isTrue(eventAggregatorRemoveEventListenerSpy.firstCall.args[0] === window);
            assert.equal(eventAggregatorRemoveEventListenerSpy.firstCall.args[1], 'beforeinstallprompt');
            assert.equal(eventAggregatorRemoveEventListenerSpy.firstCall.args[2], this.beforeInstallPromptEventEmitter.handleBeforeInstallPrompt);
        });

        it('stopping the emitter with a null window parameter throws an exception', function () {
            assert.throws(() => { return this.beforeInstallPromptEventEmitter.stop(null); }, 'invalid window parameter');
        });

        it('stopping the emitter with a undefined window parameter throws an exception', function () {
            assert.throws(() => { return this.beforeInstallPromptEventEmitter.stop(); }, 'invalid window parameter');
        });
    });

    describe('event tests:', function () {
        it('Should emit a beforeinstallprompt event', function () {
            this.beforeInstallPromptEventEmitter.start(window);

            // Get the handler registered for the event so we can execute it
            const handler = this._eventAggregatorAddEventListenerSpy.firstCall.args[2];

            handler('beforeinstallprompt Event');

            assert.isTrue(this._messageBusStub.publish.calledOnce);
            assert.equal(this._messageBusStub.publish.firstCall.args[0], MessageBusEventType.BeforeInstallPromptEvent);
            assert.deepEqual(this._messageBusStub.publish.firstCall.args[1], 'beforeinstallprompt Event');
        });

        it('Should emit multiple beforeinstallprompt events', function () {
            this.beforeInstallPromptEventEmitter.start(window);

            // Get the handler registered for the event so we can execute it
            const handler = this._eventAggregatorAddEventListenerSpy.firstCall.args[2];

            handler('beforeinstallprompt Event 1');

            handler('beforeinstallprompt Event again?');

            handler('beforeinstallprompt Event again!!');

            assert.isTrue(this._messageBusStub.publish.calledThrice);
            assert.equal(this._messageBusStub.publish.firstCall.args[0], MessageBusEventType.BeforeInstallPromptEvent);
            assert.deepEqual(this._messageBusStub.publish.firstCall.args[1], 'beforeinstallprompt Event 1');
            assert.equal(this._messageBusStub.publish.secondCall.args[0], MessageBusEventType.BeforeInstallPromptEvent);
            assert.deepEqual(this._messageBusStub.publish.secondCall.args[1], 'beforeinstallprompt Event again?');
            assert.equal(this._messageBusStub.publish.thirdCall.args[0], MessageBusEventType.BeforeInstallPromptEvent);
            assert.deepEqual(this._messageBusStub.publish.thirdCall.args[1], 'beforeinstallprompt Event again!!');
        });
    });
});
