import { assert } from 'chai';
import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import StandardInputEventsEmitter from '../../../../src/main/services/StandardInputEventsEmitter';
import EventAggregator from '../../../../src/main/system/EventAggregator';
import CDUtils from '../../../../src/main/technicalServices/CDUtils';
import TestFeatureSupport from '../../../TestFeatureSupport';

describe('StandardInputEventsEmitter Tests:', function () {
    beforeEach(function () {
        if (!TestFeatureSupport.isMutationObserverSupported()) {
            this.skip();
            return;
        }
        this._messageBus = new MessageBus();
        this._eventAggregator = EventAggregator;
        this.standardInputEventsEmitter = new StandardInputEventsEmitter(this._messageBus, this._eventAggregator, CDUtils);

        sinon.spy(this.standardInputEventsEmitter, 'handleInputEvents');
        sinon.spy(this.standardInputEventsEmitter, 'handleBlurEvents');
        sinon.spy(this.standardInputEventsEmitter, 'handleFocusEvents');

        // Re-declare the event listener property with the sinon.spy methods
        this.standardInputEventsEmitter.defaultInputEventListener = [
            { event: 'input', handler: this.standardInputEventsEmitter.handleInputEvents },
            { event: 'focus', handler: this.standardInputEventsEmitter.handleBlurEvents },
            { event: 'blur', handler: this.standardInputEventsEmitter.handleFocusEvents },
        ];

        this.inputElement = document.createElement('input');
        this.inputElement.setAttribute('id', 'txt1');
        this.inputElement.type = 'text';
        this.inputElement.value = 'Some input field text 1';
        this.inputElement.className = 'input-text-class'; // set the CSS class
        document.body.appendChild(this.inputElement); // put it into the DOM

        this.inputElementB = document.createElement('input');
        this.inputElementB.setAttribute('id', 'txt2');
        this.inputElementB.type = 'text';
        this.inputElementB.value = 'Some input field text 2';
        this.inputElementB.className = 'input-text-class'; // set the CSS class
        document.body.appendChild(this.inputElementB); // put it into the DOM
    });

    afterEach(function () {
        this._messageBus = null;
    });

    it('Should create a new instance of StandardInputEventsEmitter', function () {
        assert.isObject(this.standardInputEventsEmitter, 'Could not construct a new StandardInputEventsEmitter object');
        assert.instanceOf(this.standardInputEventsEmitter._elementBindingWMap, WeakMap, 'elementBindingWMap should be zero');
    });

    it('Should add and remove elements to/from _elementBindingWMap upon start/stop', function () {
        const _inputElements = Array.from(document.getElementsByTagName('input'));
        this.standardInputEventsEmitter.start(_inputElements);
        let getWeakMapElement = this.standardInputEventsEmitter._elementBindingWMap.get(this.inputElement);
        assert.isObject(getWeakMapElement, 'getWeakMapElement could not be retrieved from weakmap');
        assert.equal(getWeakMapElement.listeners.length, 3, 'Should be 3 event listeners retrieved from weakmap');

        assert.isFalse(getWeakMapElement.isUsingJQuery, 'Element should not have isUsingJquery set to true');
        this.standardInputEventsEmitter.stop(_inputElements);
        getWeakMapElement = this.standardInputEventsEmitter._elementBindingWMap.get(this.inputElement);
        assert.isUndefined(getWeakMapElement, 'Retrieving the input field element from WeakMap should return undefined');
    });

    it('Should call handle[Input/Blur/Focus]Events upon firing input,blur,focus event', function () {
        const _inputElements = Array.from(document.getElementsByTagName('input'));
        this.standardInputEventsEmitter.start(_inputElements);
        const inputElement = document.getElementById('txt1');

        if (typeof (Event) === 'function') {
            const inputEvent = new Event('input', { 'bubbles': true, 'cancelable': false });
            inputElement.value = 'txt1 input';
            inputElement.dispatchEvent(inputEvent);

            const focusEvent = new Event('focus', { 'bubbles': true, 'cancelable': false });
            inputElement.dispatchEvent(focusEvent);

            const blurEvent = new Event('blur', { 'bubbles': true, 'cancelable': false });
            inputElement.dispatchEvent(blurEvent);
        } else { // Dedicated IE11 handling
            const inputEvent = document.createEvent('Event');
            inputElement.value = 'txt1 input';

            inputEvent.initEvent('input', false, true);
            inputElement.dispatchEvent(inputEvent);

            const focusEvent = document.createEvent('Event');
            focusEvent.initEvent('focus', false, true);
            inputElement.dispatchEvent(focusEvent);

            const blurEvent = document.createEvent('Event');
            blurEvent.initEvent('blur', false, true);
            inputElement.dispatchEvent(blurEvent);
        }
        assert.isTrue(this.standardInputEventsEmitter.handleInputEvents.called, 'this.standardInputEventsEmitter.handleInputEvents should be called with input event message');
        assert.isTrue(this.standardInputEventsEmitter.handleFocusEvents.called, 'this.standardInputEventsEmitter.handleFocusEvents should be called with focus event message');
        assert.isTrue(this.standardInputEventsEmitter.handleBlurEvents.called, 'this.standardInputEventsEmitter.handleBlurEvents should be called with blur event message');
    });

    it('Should emit events of two elements', function () {
        const _inputElements = Array.from(document.getElementsByTagName('input'));
        this.standardInputEventsEmitter.start(_inputElements);
        const inputElementA = document.getElementById('txt1');
        const inputElementB = document.getElementById('txt2');

        if (typeof (Event) === 'function') {
            const inputEvent = new Event('input', { 'bubbles': true, 'cancelable': false });
            inputElementA.value = 'txt1 input';
            inputElementA.dispatchEvent(inputEvent);

            inputElementB.value = 'txt2 input';
            inputElementB.dispatchEvent(inputEvent);
        } else { // Dedicated IE11 handling
            const event = document.createEvent('Event');
            event.initEvent('input', false, true);

            inputElementA.value = 'txt1 input';
            inputElementA.dispatchEvent(event);

            inputElementB.value = 'txt2 input';
            inputElementB.dispatchEvent(event);
        }

        assert.isTrue(this.standardInputEventsEmitter.handleInputEvents.calledTwice, 'this.standardInputEventsEmitter.handleInputEvents should be called with input event message');
    });

    it('Should invoke shouldSkipElement function upon calling start', function () {
        const shouldSkipElementFunc = sinon.stub();
        shouldSkipElementFunc.returns(true);

        const shouldSkipElement = {
            'func': shouldSkipElementFunc,
            'allowedEvents': ['focus', 'blur'],
        };

        const inputElement = document.createElement('input');

        inputElement.setAttribute('id', 'specialInput');
        inputElement.type = 'text';
        inputElement.value = 'Some input field text 1';
        inputElement.className = 'input-text-class'; // set the CSS class
        inputElement.dataset.parsleyRemote = '/validations';
        inputElement.placeholder = '___-___-____';
        document.body.appendChild(inputElement); // put it into the DOM

        this.standardInputEventsEmitter.start(Array.from([document.getElementById('specialInput')]), self, shouldSkipElement);
        const getWeakMapElement = this.standardInputEventsEmitter._elementBindingWMap.get(inputElement);

        assert.isTrue(shouldSkipElement.func.called, 'shouldSkipElement.func was not called by standardInputEventsEmitter');
        assert.isObject(getWeakMapElement, 'Unable to locate the special input element in the service weakmap');

        this.standardInputEventsEmitter.stop(Array.from([document.getElementById('specialInput')]));
    });
});
