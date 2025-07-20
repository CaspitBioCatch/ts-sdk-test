import { assert } from 'chai';
import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import StandardOnFormEventsEmitter from '../../../../src/main/services/StandardOnFormEventsEmitter';
import EventAggregator from '../../../../src/main/system/EventAggregator';
import { MockObjects } from '../../mocks/mockObjects';
import { TestUtils } from '../../../TestUtils';
import TestFeatureSupport from '../../../TestFeatureSupport';

describe('StandardOnFormEventsEmitter Service Tests:', function () {
    beforeEach(function () {
        if (!TestFeatureSupport.isMutationObserverSupported()) {
            this.skip();
            return;
        }
        this._messageBus = new MessageBus(self.Map, self.Set);
        this._eventAggregator = EventAggregator;
        this.cdUtils = sinon.stub(MockObjects.cdUtils);
        this.jQueryUtilsStub = sinon.stub(this.cdUtils.JQueryUtils);
        this.jQueryUtilsStub.isJQueryAvailable.returns(true);

        this.formSelector = 'form';

        this.standardOnFormEventsEmitter = new StandardOnFormEventsEmitter(this._messageBus, this._eventAggregator, MockObjects.cdUtils);

        this.standardOnFormEventsEmitter._utils = this.cdUtils;
        this.jQueryUtilsStub.addEventListener.callsFake(function (element, eventType, eventHandler) {
            element.addEventListener(eventType, eventHandler);
        });
        this.jQueryUtilsStub.removeEventListener.callsFake(function (element, eventType, eventHandler) {
            element.removeEventListener(eventType, eventHandler);
        });

        const _handleOnFormSubmitEvents = sinon.spy(this.standardOnFormEventsEmitter, 'handleOnFormSubmitEvents');
        this.standardOnFormEventsEmitter.handleOnFormSubmitEvents = _handleOnFormSubmitEvents;
        // Re-declare the event listener property with the sinon.spy methods
        this.standardOnFormEventsEmitter.defaultOnFormEventListener = [
            { event: 'submit', handler: this.standardOnFormEventsEmitter.handleOnFormSubmitEvents },
        ];
    });

    it('Should create a new instance of StandardOnFormEventsEmitter', function () {
        assert.isObject(this.standardOnFormEventsEmitter, 'Could not construct a new StandardOnFormEventsEmitter object');
        assert.instanceOf(this.standardOnFormEventsEmitter._elementBindingWMap, WeakMap, 'elementBindingWMap should be zero');
        assert.isObject(this.standardOnFormEventsEmitter._utils, '_utils parameter should be an object');
    });

    it('Should add and remove elements to/from _elementBindingWMap upon start/stop', function () {
        const _form = document.createElement('form');
        _form.setAttribute('method', 'post');
        _form.setAttribute('id', 'myForm');
        _form.setAttribute('action', 'submit.php');

        const inputElement = document.createElement('input');
        inputElement.setAttribute('id', 'inputxt1');
        inputElement.type = 'text';
        inputElement.value = 'Some input field text 1';
        inputElement.className = 'input-text-class'; // set the CSS class
        document.body.appendChild(inputElement); // put it into the DOM

        const inputElementB = document.createElement('input');
        inputElementB.setAttribute('id', 'inputxt2');
        inputElementB.type = 'text';
        inputElementB.value = 'Some input field text 2';
        inputElementB.className = 'input-text-class'; // set the CSS class
        document.body.appendChild(inputElementB); // put it into the DOM

        _form.appendChild(inputElement);
        _form.appendChild(inputElementB);

        document.body.appendChild(_form);

        const _formElements = Array.from(document.querySelectorAll(this.formSelector));
        this.standardOnFormEventsEmitter.start(_formElements);

        let weakMapForm = this.standardOnFormEventsEmitter._elementBindingWMap.get(_form);
        assert.isObject(weakMapForm, 'weakMapForm could not be retrieved from weakmap');
        assert.equal(weakMapForm.listeners.length, 1, 'weakMapForm Should be 1 event listener retrieved from weakmap');
        assert.isFalse(weakMapForm.isUsingJQuery, 'weakMapForm should not have isUsingJquery set to true');

        this.standardOnFormEventsEmitter.stop(_formElements);
        weakMapForm = this.standardOnFormEventsEmitter._elementBindingWMap.get(_form);
        assert.isUndefined(weakMapForm, 'Retrieving the form element from WeakMap should return undefined');

        document.body.removeChild(_form);
    });

    /**
     * This function dispatch a submit event and its submit form handler
     * must prevent the redirection or Firefox will throw unexplained errors
     */
    it('Should call submit handler upon firing submit event', async function () {
        const _form = document.createElement('form');
        _form.setAttribute('method', 'post');
        _form.setAttribute('id', 'testForm');
        _form.setAttribute('action', 'submit.php');

        const inputElement = document.createElement('input');
        inputElement.setAttribute('id', 'inputxt1');
        inputElement.type = 'text';
        inputElement.value = 'Some input field text 1';
        inputElement.className = 'input-text-class'; // set the CSS class
        document.body.appendChild(inputElement); // put it into the DOM

        const inputElementB = document.createElement('input');
        inputElementB.setAttribute('id', 'inputxt2');
        inputElementB.type = 'text';
        inputElementB.value = 'Some input field text 2';
        inputElementB.className = 'input-text-class'; // set the CSS class
        document.body.appendChild(inputElementB); // put it into the DOM

        _form.appendChild(inputElement);
        _form.appendChild(inputElementB);

        document.body.appendChild(_form);

        const _formElements = Array.from(document.querySelectorAll(this.formSelector));
        this.standardOnFormEventsEmitter.start(_formElements);

        _form.addEventListener('submit', (e) => {
           e.preventDefault();
        });

        const submitEvent = document.createEvent('Event');
        submitEvent.initEvent('submit', true, true);
        _form.dispatchEvent(submitEvent);

        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this.standardOnFormEventsEmitter.handleOnFormSubmitEvents.called, 'this.standardOnFormEventsEmitter.handleOnFormSubmitEvents should be called with submit event message');
        }).finally(() => {
            const handleOnFormEventsLastCall = this.standardOnFormEventsEmitter.handleOnFormSubmitEvents.getCall(0);
            const data = handleOnFormEventsLastCall.args[0];
            assert.instanceOf(data, window.Event, 'handleOnFormSubmitEvents should be called with an Event object');
            this.standardOnFormEventsEmitter.stop(_formElements);
            document.body.removeChild(_form);
        });
    });

    it('Should call jQuery utils upon invoking addElementEvents', function () {
        const _form = document.createElement('form');
        _form.setAttribute('method', 'post');
        _form.setAttribute('id', 'testForm');
        _form.setAttribute('action', 'submit.php');

        const inputElement = document.createElement('input');
        inputElement.setAttribute('id', 'inputxt1');
        inputElement.type = 'text';
        inputElement.value = 'Some input field text 1';
        inputElement.className = 'input-text-class'; // set the CSS class
        document.body.appendChild(inputElement); // put it into the DOM

        const inputElementB = document.createElement('input');
        inputElementB.setAttribute('id', 'inputxt2');
        inputElementB.type = 'text';
        inputElementB.value = 'Some input field text 2';
        inputElementB.className = 'input-text-class'; // set the CSS class
        document.body.appendChild(inputElementB); // put it into the DOM

        _form.appendChild(inputElement);
        _form.appendChild(inputElementB);

        document.body.appendChild(_form);

        const _formElements = Array.from(document.querySelectorAll(this.formSelector));

        this.standardOnFormEventsEmitter.addElementEvents(_form, true);
        assert.isTrue(this.jQueryUtilsStub.addEventListener.called, 'this.jQueryUtilsStub was not called');
        this.standardOnFormEventsEmitter.removeElementEvents(_form, true);
        assert.isTrue(this.jQueryUtilsStub.removeEventListener.called, 'this.jQueryUtilsStub was not called');
        const getForm = this.standardOnFormEventsEmitter._elementBindingWMap.get(_form);
        assert.isUndefined(getForm, 'Retrieving the button element from WeakMap should return undefined');
        this.standardOnFormEventsEmitter.stop(_formElements);

        document.body.removeChild(_form);

        this.jQueryUtilsStub.isJQueryAvailable.restore();
        this.jQueryUtilsStub.addEventListener.restore();
        this.jQueryUtilsStub.removeEventListener.restore();
    });
});
