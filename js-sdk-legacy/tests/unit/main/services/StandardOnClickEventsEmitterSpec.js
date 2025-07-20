import { assert } from 'chai';
import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import StandardOnClickEventsEmitter from '../../../../src/main/services/StandardOnClickEventsEmitter';
import EventAggregator from '../../../../src/main/system/EventAggregator';
import { MockObjects } from '../../mocks/mockObjects';
import TestFeatureSupport from '../../../TestFeatureSupport';

describe('StandardOnClickEventsEmitter Service Tests:', function () {
    beforeEach(function () {
        if (!TestFeatureSupport.isMutationObserverSupported()) {
            this.skip();
            return;
        }
        this._messageBus = new MessageBus();
        this._eventAggregator = EventAggregator;
        this.sandbox = sinon.createSandbox();
        this.cdUtilsStub = this.sandbox.stub(MockObjects.cdUtils);
        this.jQueryUtilsStub = this.sandbox.stub(this.cdUtilsStub.JQueryUtils);
        this.jQueryUtilsStub.isJQueryAvailable.returns(true);

        this.clickSelector = "input[type='button'], input[type='radio'], input[type='checkbox'], button";

        this.standardOnClickEventsEmitter = new StandardOnClickEventsEmitter(this._messageBus, this._eventAggregator, this.cdUtilsStub);

        this.jQueryUtilsStub.addEventListener.callsFake(function (element, eventType, eventHandler) {
            element.addEventListener(eventType, eventHandler);
        });
        this.jQueryUtilsStub.removeEventListener.callsFake(function (element, eventType, eventHandler) {
            element.removeEventListener(eventType, eventHandler);
        });

        sinon.spy(this.standardOnClickEventsEmitter, 'handleOnClickEvents');
        // Re-declare the event listener property with the sinon.spy methods
        this.standardOnClickEventsEmitter.defaultOnClickEventListener = [
            { event: 'click', handler: this.standardOnClickEventsEmitter.handleOnClickEvents },
        ];
    });

    afterEach(function () {
        this.sandbox.restore();
        this._messageBus = null;
    });

    it('Should call click handler upon firing click event', function () {
        const button = document.createElement('input');
        button.setAttribute('id', 'btn1');
        button.setAttribute('type', 'button');
        button.value = 'Nice Button';
        document.body.appendChild(button);

        const _clickElements = Array.from(document.querySelectorAll(this.clickSelector));
        this.standardOnClickEventsEmitter.start(_clickElements);

        const e = document.createEvent('Event');
        e.initEvent('click', true, true);
        button.dispatchEvent(e);

    });

    it('Should create a new instance of StandardOnClickEventsEmitter', function () {
        assert.isObject(this.standardOnClickEventsEmitter, 'Could not construct a new StandardOnClickEventsEmitter object');
        assert.instanceOf(this.standardOnClickEventsEmitter._elementBindingWMap, WeakMap, 'elementBindingWMap should be zero');
        assert.isObject(this.standardOnClickEventsEmitter._utils, '_utils parameter should be an object');
    });

    it('Should add and remove elements to/from _elementBindingWMap upon start/stop', function () {
        const checkBox = document.createElement('input');
        checkBox.setAttribute('id', 'cb1');
        checkBox.setAttribute('type', 'checkbox');
        checkBox.checked = false;
        document.body.appendChild(checkBox); // put it into the DOM

        const radioButton1 = document.createElement('input');
        radioButton1.setAttribute('type', 'radio');
        radioButton1.setAttribute('name', 'gender');
        radioButton1.setAttribute('value', 'female');
        radioButton1.setAttribute('id', 'radio1');
        radioButton1.checked = false;
        document.body.appendChild(radioButton1);

        const radioButton2 = document.createElement('input');
        radioButton2.setAttribute('type', 'radio');
        radioButton2.setAttribute('name', 'gender');
        radioButton2.setAttribute('value', 'male');
        radioButton2.setAttribute('id', 'radio2');
        radioButton2.checked = false;
        document.body.appendChild(radioButton2);

        const button = document.createElement('input');
        button.setAttribute('id', 'btn1');
        button.setAttribute('type', 'button');
        button.value = 'Nice Button';
        document.body.appendChild(button);

        const _clickElements = Array.from(document.querySelectorAll(this.clickSelector));
        this.standardOnClickEventsEmitter.start(_clickElements);

        let weakMapButton = this.standardOnClickEventsEmitter._elementBindingWMap.get(button);
        assert.isObject(weakMapButton, 'weakMapButton could not be retrieved from weakmap');
        assert.equal(weakMapButton.listeners.length, 1, 'weakMapButton Should be 1 event listener retrieved from weakmap');
        assert.isFalse(weakMapButton.isUsingJQuery, 'weakMapButton should not have isUsingJquery set to true');

        let weakMapRadio1 = this.standardOnClickEventsEmitter._elementBindingWMap.get(radioButton1);
        assert.isObject(weakMapRadio1, 'weakMapRadio1 could not be retrieved from weakmap');
        assert.equal(weakMapRadio1.listeners.length, 1, 'weakMapRadio1 Should be 1 event listener retrieved from weakmap');
        assert.isFalse(weakMapRadio1.isUsingJQuery, 'weakMapRadio1 should not have isUsingJquery set to true');

        let weakMapRadio2 = this.standardOnClickEventsEmitter._elementBindingWMap.get(radioButton2);
        assert.isObject(weakMapRadio2, 'weakMapRadio2 could not be retrieved from weakmap');
        assert.equal(weakMapRadio2.listeners.length, 1, 'weakMapRadio2 Should be 1 event listener retrieved from weakmap');
        assert.isFalse(weakMapRadio2.isUsingJQuery, 'weakMapRadio2 should not have isUsingJquery set to true');

        let weakMapCheckbox = this.standardOnClickEventsEmitter._elementBindingWMap.get(checkBox);
        assert.isObject(weakMapCheckbox, 'weakMapCheckbox could not be retrieved from weakmap');
        assert.equal(weakMapCheckbox.listeners.length, 1, 'weakMapCheckbox Should be 1 event listener retrieved from weakmap');
        assert.isFalse(weakMapCheckbox.isUsingJQuery, 'weakMapCheckbox should not have isUsingJquery set to true');

        this.standardOnClickEventsEmitter.stop(_clickElements);
        weakMapButton = this.standardOnClickEventsEmitter._elementBindingWMap.get(button);
        weakMapRadio1 = this.standardOnClickEventsEmitter._elementBindingWMap.get(radioButton1);
        weakMapRadio2 = this.standardOnClickEventsEmitter._elementBindingWMap.get(radioButton2);
        weakMapCheckbox = this.standardOnClickEventsEmitter._elementBindingWMap.get(checkBox);
        assert.isUndefined(weakMapButton, 'Retrieving the button element from WeakMap should return undefined');
        assert.isUndefined(weakMapRadio1, 'Retrieving the radio button element from WeakMap should return undefined');
        assert.isUndefined(weakMapRadio2, 'Retrieving the radio button element from WeakMap should return undefined');
        assert.isUndefined(weakMapCheckbox, 'Retrieving the radio button element from WeakMap should return undefined');

        document.body.removeChild(button);
        document.body.removeChild(radioButton1);
        document.body.removeChild(radioButton2);
        document.body.removeChild(checkBox);
    });


    it('Should call jQuery utils upon invoking addElementEvents', function () {
        const button = document.createElement('input');
        button.setAttribute('id', 'btn1');
        button.setAttribute('type', 'button');
        button.value = 'Nice Button';
        document.body.appendChild(button);

        const _clickElements = Array.from(document.querySelectorAll(this.clickSelector));

        this.standardOnClickEventsEmitter.addElementEvents(button, true);
        assert.isTrue(this.jQueryUtilsStub.addEventListener.called, 'this.jQueryUtilsStub was not called');
        this.standardOnClickEventsEmitter.removeElementEvents(button, true);
        assert.isTrue(this.jQueryUtilsStub.removeEventListener.called, 'this.jQueryUtilsStub was not called');
        const getSelect1 = this.standardOnClickEventsEmitter._elementBindingWMap.get(button);
        assert.isUndefined(getSelect1, 'Retrieving the button element from WeakMap should return undefined');
        this.standardOnClickEventsEmitter.stop(_clickElements);
        document.body.removeChild(button);

        this.jQueryUtilsStub.isJQueryAvailable.restore();
        this.jQueryUtilsStub.addEventListener.restore();
        this.jQueryUtilsStub.removeEventListener.restore();
    });
});
