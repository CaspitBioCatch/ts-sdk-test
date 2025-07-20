import { assert } from 'chai';
import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import SyntheticAutotabInputEventsHandler from '../../../../src/main/services/SyntheticAutotabInputEventsHandler';
import EventAggregator from '../../../../src/main/system/EventAggregator';
import { MockObjects } from '../../mocks/mockObjects';
import { TestUtils } from '../../../TestUtils';
import { MessageBusEventType } from '../../../../src/main/events/MessageBusEventType';
import TestFeatureSupport from '../../../TestFeatureSupport';

describe('SyntheticAutotabInputEventsHandler Service Tests:', function () {
    beforeEach(function () {
        if (!TestFeatureSupport.isMutationObserverSupported()) {
            this.skip();
            return;
        }
        this.sandbox = sinon.createSandbox();

        this._messageBusStub = this.sandbox.stub(new MessageBus());

        this._eventAggregator = EventAggregator;
        this.syntheticAutoTabInputEventsHandler = new SyntheticAutotabInputEventsHandler(this._messageBusStub, this._eventAggregator, MockObjects.cdUtils);
        sinon.spy(this.syntheticAutoTabInputEventsHandler, 'handleKeypressEvents');

        // Re-declare the event listener property with the sinon.spy methods
        this.syntheticAutoTabInputEventsHandler.defaultEventListener = [
            { event: 'keypress', handler: this.syntheticAutoTabInputEventsHandler.handleKeypressEvents.bind(this.syntheticAutoTabInputEventsHandler) },
        ];

        self.jQuery = {
            _data() {
                return {
                    autotab: {},
                };
            },
        };
    });

    afterEach(function () {
        this._messageBus = null;
    });

    it('Should create a new instance of SyntheticAutotabInputEventsHandler', function () {
        assert.isObject(this.syntheticAutoTabInputEventsHandler, 'Could not construct a new SyntheticAutotabInputEventsHandler object');
        assert.instanceOf(this.syntheticAutoTabInputEventsHandler._elementBindingWMap, WeakMap, 'elementBindingWMap should be zero');
        assert.isObject(this.syntheticAutoTabInputEventsHandler._utils, '_utils parameter should be an object');
    });

    it('Should add and remove elements to/from _elementBindingWMap upon start/stop', function () {
        const inputElement = document.createElement('input');
        inputElement.setAttribute('id', 'txt1');
        inputElement.type = 'text';
        inputElement.value = 'Some input field text 1';
        inputElement.className = 'input-text-class'; // set the CSS class
        document.body.appendChild(inputElement); // put it into the DOM

        const _inputElements = Array.from(document.getElementsByTagName('input'));
        this.syntheticAutoTabInputEventsHandler.start(_inputElements, self);
        let getWeakMapElement = this.syntheticAutoTabInputEventsHandler._elementBindingWMap.get(inputElement);
        assert.isObject(getWeakMapElement, 'getWeakMapElement could not be retrieved from weakmap');
        this.syntheticAutoTabInputEventsHandler.stop(_inputElements);
        getWeakMapElement = this.syntheticAutoTabInputEventsHandler._elementBindingWMap.get(inputElement);
        assert.isUndefined(getWeakMapElement, 'Retrieving the input field element from WeakMap should return undefined');

        document.body.removeChild(inputElement);
    });

    it('SyntheticInputMaskEvent bus event is sent when a keyup event occurs', async function () {
        const inputElement = document.createElement('input');
        inputElement.setAttribute('id', 'txt1');
        inputElement.type = 'text';
        inputElement.value = 'Some input field text 1';
        inputElement.className = 'input-text-class'; // set the CSS class
        inputElement.dataset.parsleyRemote = '/validations';
        inputElement.placeholder = '___-___-____';
        document.body.appendChild(inputElement); // put it into the DOM

        const _inputElements = Array.from(document.getElementsByTagName('input'));
        this.syntheticAutoTabInputEventsHandler.start(_inputElements, self);

        const keyPress = document.createEvent('Event');
        keyPress.initEvent('keypress', false, true);
        inputElement.dispatchEvent(keyPress);

        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this._messageBusStub.publish.calledOnce);
            assert.equal(this._messageBusStub.publish.firstCall.args[0], MessageBusEventType.SyntheticInputMaskEvent);
            assert.equal(this._messageBusStub.publish.firstCall.args[1].type, 'input');
            assert.exists(this._messageBusStub.publish.firstCall.args[1].timeStamp);
        }).finally(() => {
            this.syntheticAutoTabInputEventsHandler.stop(_inputElements);
            document.body.removeChild(inputElement);
        });
    });

    it('Should call handleKeypressEvents upon firing key press event', async function () {
        const inputElement = document.createElement('input');
        inputElement.setAttribute('id', 'txt1');
        inputElement.type = 'text';
        inputElement.value = 'Some input field text 1';
        inputElement.className = 'input-text-class'; // set the CSS class
        document.body.appendChild(inputElement); // put it into the DOM

        const _inputElements = Array.from(document.getElementsByTagName('input'));
        this.syntheticAutoTabInputEventsHandler.start(_inputElements, self);

        const keyPress = document.createEvent('Event');
        keyPress.initEvent('keypress', false, true);
        inputElement.dispatchEvent(keyPress);

        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this.syntheticAutoTabInputEventsHandler.handleKeypressEvents.called,
                'this.syntheticAutoTabInputEventsHandler.handleKeypressEvents should be called with keypress event message');
        }).finally(() => {
            this.syntheticAutoTabInputEventsHandler.stop(_inputElements);
            document.body.removeChild(inputElement);
        });
    });
});
