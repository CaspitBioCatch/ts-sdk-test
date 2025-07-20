import { assert } from 'chai';
import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import WindowMessageEventEmitter from '../../../../src/main/services/WindowMessageEventEmitter';
import { TestUtils } from '../../../TestUtils';
import BrowserContext from '../../../../src/main/core/browsercontexts/BrowserContext';
import { MessageBusEventType } from '../../../../src/main/events/MessageBusEventType';
import { MockObjects } from '../../mocks/mockObjects';

const _self = self;

describe('WindowMessageEventEmitter Service Tests:', function () {
    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
        this._messageBusStub = this.sandbox.createStubInstance(MessageBus);

        this._eventAggregatorStub = this.sandbox.stub(MockObjects.eventAggregator);
        this._browserContext = new BrowserContext(self);

        this.windowMessageEventEmitter = new WindowMessageEventEmitter(this._messageBusStub, this._eventAggregatorStub);
        this.windowMessageEventEmitter.defaultPostMessageEventListener = [
            { event: 'message', handler: this.windowMessageEventEmitter.handleWindowMessage },
        ];
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    it('Should create a new instance of WindowMessageEventEmitter', function () {
        assert.isObject(this.windowMessageEventEmitter, 'Could not construct a new windowMessageEventEmitter object');
        assert.instanceOf(this.windowMessageEventEmitter._windowListeners, WeakMap, 'elementBindingWMap should be zero');
        assert.instanceOf(this.windowMessageEventEmitter._messageBus, MessageBus, 'this.windowMessageEventEmitter._messageBus should be an object');
    });

    it('Should add window to the windowListeners', function () {
        this.windowMessageEventEmitter.startObserver(this._browserContext);
        assert.isTrue(this._eventAggregatorStub.addEventListener.calledOnce);
        assert.isNotNull(this.windowMessageEventEmitter._windowListeners.get(_self), 'Self window is null');
        this.windowMessageEventEmitter.stopObserver(this._browserContext);
    });

    it('Should handle change event upon firing change event', async function () {
        this.windowMessageEventEmitter.startObserver(this._browserContext);
        const eventHandler = this._eventAggregatorStub.addEventListener.firstCall.args[2];

        eventHandler('Posting a message');

        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this._messageBusStub.publish.calledOnce,
                `messagebus publish no called once. It was called ${this._messageBusStub.publish.callCount}`);
            assert.equal(this._messageBusStub.publish.firstCall.args[0], MessageBusEventType.WindowMessageEvent);
        }).finally(() => {
            this.windowMessageEventEmitter.stopObserver(this._browserContext);
        });
    });

    it('fail silently when message object is unavailable', async function () {
        this.windowMessageEventEmitter.startObserver(this._browserContext);
        const eventHandler = this._eventAggregatorStub.addEventListener.firstCall.args[2];

        eventHandler(null);

        await TestUtils.waitForNoAssertion(() => {
            assert.isFalse(this._messageBusStub.publish.called,
                'messagebus publish called.');
        }).finally(() => {
            this.windowMessageEventEmitter.stopObserver(this._browserContext);
        });
    });
});
