import { assert } from 'chai';
import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import SyntheticMaskInputEventsHandler from '../../../../src/main/services/SyntheticMaskInputEventsHandler';
import EventAggregator from '../../../../src/main/system/EventAggregator';
import { MockObjects } from '../../mocks/mockObjects';
import { TestUtils } from '../../../TestUtils';
import { MessageBusEventType } from '../../../../src/main/events/MessageBusEventType';
import TestFeatureSupport from '../../../TestFeatureSupport';

describe('SyntheticMaskInputEventsHandler Service Tests:', function () {
    beforeEach(function () {
        if (!TestFeatureSupport.isMutationObserverSupported()) {
            this.skip();
            return;
        }
        this.sandbox = sinon.createSandbox();

        this._messageBusStub = this.sandbox.createStubInstance(MessageBus);

        this._eventAggregator = EventAggregator;
        this.syntheticMaskInputEventsHandler = new SyntheticMaskInputEventsHandler(this._messageBusStub, this._eventAggregator, MockObjects.cdUtils);
        sinon.spy(this.syntheticMaskInputEventsHandler, 'handleKeypressEvents');

        // Re-declare the event listener property with the sinon.spy methods
        this.syntheticMaskInputEventsHandler.defaultEventListener = [
            { event: 'keypress', handler: this.syntheticMaskInputEventsHandler.handleKeypressEvents.bind(this.syntheticMaskInputEventsHandler) },
            ];

        self.jQuery = {
            _data() {
                return {
                    unmask: {},
                };
            },
        };
    });

    afterEach(function () {
        this._messageBus = null;
    });

    it('Should create a new instance of SyntheticMaskInputEventsHandler', function () {
        assert.isObject(this.syntheticMaskInputEventsHandler, 'Could not construct a new SyntheticMaskInputEventsHandler object');
        assert.instanceOf(this.syntheticMaskInputEventsHandler._elementBindingWMap, WeakMap, 'elementBindingWMap should be zero');
        assert.isObject(this.syntheticMaskInputEventsHandler._utils, '_utils parameter should be an object');
    });

    it('Should add and remove elements to/from _elementBindingWMap upon start/stop', function () {
        const inputElement = document.createElement('input');
        inputElement.setAttribute('id', 'txt1');
        inputElement.type = 'text';
        inputElement.value = 'Some input field text 1';
        inputElement.className = 'input-text-class'; // set the CSS class
        document.body.appendChild(inputElement); // put it into the DOM

        const _inputElements = Array.from(document.getElementsByTagName('input'));
        this.syntheticMaskInputEventsHandler.start(_inputElements, self);
        let getWeakMapElement = this.syntheticMaskInputEventsHandler._elementBindingWMap.get(inputElement);
        assert.isObject(getWeakMapElement, 'getWeakMapElement could not be retrieved from weakmap');
        this.syntheticMaskInputEventsHandler.stop(_inputElements);
        getWeakMapElement = this.syntheticMaskInputEventsHandler._elementBindingWMap.get(inputElement);
        assert.isUndefined(getWeakMapElement, 'Retrieving the input field element from WeakMap should return undefined');

        document.body.removeChild(inputElement);
    });

    it('SyntheticInputMaskEvent bus event is sent when a keypress event occurs', async function () {
        const inputElement = document.createElement('input');
        inputElement.setAttribute('id', 'txt1');
        inputElement.type = 'text';
        inputElement.value = 'Some input field text 1';
        inputElement.className = 'input-text-class'; // set the CSS class
        inputElement.dataset.parsleyRemote = '/validations';
        inputElement.placeholder = '___-___-____';
        document.body.appendChild(inputElement); // put it into the DOM

        const _inputElements = Array.from(document.getElementsByTagName('input'));
        this.syntheticMaskInputEventsHandler.start(_inputElements, self);

        const keyPress = document.createEvent('Event');
        keyPress.initEvent('keypress', false, true);
        inputElement.dispatchEvent(keyPress);

        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this._messageBusStub.publish.calledOnce);
            assert.equal(this._messageBusStub.publish.firstCall.args[0], MessageBusEventType.SyntheticInputMaskEvent);
            assert.equal(this._messageBusStub.publish.firstCall.args[1].type, 'input');
            assert.exists(this._messageBusStub.publish.firstCall.args[1].timeStamp);
        }).finally(() => {
            this.syntheticMaskInputEventsHandler.stop(_inputElements);
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
        this.syntheticMaskInputEventsHandler.start(_inputElements, self);

        const keyPress = document.createEvent('Event');
        keyPress.initEvent('keypress', false, true);
        inputElement.dispatchEvent(keyPress);

        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this.syntheticMaskInputEventsHandler.handleKeypressEvents.called,
                'this.syntheticMaskInputEventsHandler.handleKeypressEvents should be called with keypress event message');
        }).finally(() => {
            this.syntheticMaskInputEventsHandler.stop(_inputElements);
            document.body.removeChild(inputElement);
        });
    });
});
