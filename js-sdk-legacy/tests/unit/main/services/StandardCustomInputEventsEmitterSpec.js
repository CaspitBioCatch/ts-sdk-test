import { assert } from 'chai';
import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import StandardCustomInputEmitter from '../../../../src/main/services/StandardCustomInputEmitter';
import EventAggregator from '../../../../src/main/system/EventAggregator';
import CDUtils from '../../../../src/main/technicalServices/CDUtils';
import TestFeatureSupport from '../../../TestFeatureSupport';

describe('StandardCustomInputEmitter Tests:', function () {
    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
        if (!TestFeatureSupport.isMutationObserverSupported()) {
            this.skip();
            return;
        }

        this._messageBus = new MessageBus();
        this._eventAggregator = EventAggregator;
        this._standardCustomInputEmitter = new StandardCustomInputEmitter(
            this._messageBus,
            this._eventAggregator,
            CDUtils
        );

        sinon.spy(this._standardCustomInputEmitter, 'handleMouseEnter');
        sinon.spy(this._standardCustomInputEmitter, 'handleFocus');
        sinon.spy(this._standardCustomInputEmitter, 'handleOnClickEvents');
        sinon.spy(this._standardCustomInputEmitter, 'mousemove');
        sinon.spy(this._standardCustomInputEmitter, 'keydown');
        sinon.spy(this._standardCustomInputEmitter, 'mouseleave');
        sinon.spy(this._standardCustomInputEmitter, 'mouseup');
        sinon.spy(this._standardCustomInputEmitter, 'mousedown');

        this._standardCustomInputEmitter.customInputEventListener = [
            { event: 'mouseenter', handler: this._standardCustomInputEmitter.handleMouseEnter },
            { event: 'focus', handler: this._standardCustomInputEmitter.handleFocus },
        ];
        this._standardCustomInputEmitter.defaultOnClickEventListener = [
            { event: 'click', handler: this._standardCustomInputEmitter.handleOnClickEvents },
        ];

        this.inputElement = document.createElement('span');
        this.inputElement.setAttribute('ariaValueNow', '150');
        this.inputElement.className = 'ngx-slider-pointer';
        document.body.appendChild(this.inputElement);

        this.increasBtn = document.createElement('button');
        this.increasBtn.className = 'increasBtn';
        this.increasBtn.innerText = '+';
        document.body.appendChild(this.increasBtn);

        this.decreasBtn = document.createElement('button');
        this.decreasBtn.className = 'decreasBtn';
        this.decreasBtn.innerText = '-';
        document.body.appendChild(this.decreasBtn);
    });

    afterEach(function () {
        this.sandbox.restore();
        this._messageBus = null;
        this._eventAggregator = null;
        this._standardCustomInputEmitter = null;
        document.body.removeChild(this.inputElement);
        document.body.removeChild(this.increasBtn);
        document.body.removeChild(this.decreasBtn);
    });

    it('Should create a new instance of standardCustomInputEmitter', function () {
        assert.isObject(
            this._standardCustomInputEmitter,
            'Could not construct a new standardCustomInputEmitter object'
        );
        assert.instanceOf(
            this._standardCustomInputEmitter._elementsBindingWMap,
            WeakMap,
            'elementBindingWMap should be zero'
        );
    });

    it('Should add and remove elements to/from _elementBindingWMap upon start/stop', function () {
        const _elements = Array.from(document.getElementsByTagName('span'));
        _elements.push(...document.getElementsByTagName('button'));
        this._standardCustomInputEmitter.start(_elements);
        let getMainElemWeakMap = this._standardCustomInputEmitter._elementsBindingWMap.get(this.inputElement);
        let getIncreasBtnElemWeakMap = this._standardCustomInputEmitter._elementsBindingWMap.get(this.increasBtn);
        let getDecreasBtnElemWeakMap = this._standardCustomInputEmitter._elementsBindingWMap.get(this.decreasBtn);

        assert.isObject(getMainElemWeakMap, 'getWeakMapElement could not be retrieved from weakmap');
        assert.isObject(getIncreasBtnElemWeakMap, 'getWeakMapElement could not be retrieved from weakmap');
        assert.isObject(getDecreasBtnElemWeakMap, 'getWeakMapElement could not be retrieved from weakmap');
        assert.equal(getMainElemWeakMap.listeners.length, 2, 'Should be 2 event listeners retrieved from weakmap');
        assert.equal(
            getIncreasBtnElemWeakMap.listeners.length,
            1,
            'Should be 1 event listeners retrieved from weakmap'
        );

        assert.equal(
            getDecreasBtnElemWeakMap.listeners.length,
            1,
            'Should be 1 event listeners retrieved from weakmap'
        );
        assert.isFalse(
            getMainElemWeakMap.isUsingJQuery &&
                getIncreasBtnElemWeakMap.isUsingJQuery &&
                getDecreasBtnElemWeakMap.isUsingJQuery,
            'Element should not have isUsingJquery set to true'
        );
        this._standardCustomInputEmitter.stop(_elements);
        getMainElemWeakMap = this._standardCustomInputEmitter._elementsBindingWMap.get(this.inputElement);
        getIncreasBtnElemWeakMap = this._standardCustomInputEmitter._elementsBindingWMap.get(this.increasBtn);
        getDecreasBtnElemWeakMap = this._standardCustomInputEmitter._elementsBindingWMap.get(this.decreasBtn);
        assert.isUndefined(
            getMainElemWeakMap && getIncreasBtnElemWeakMap && getDecreasBtnElemWeakMap,
            'Retrieving the input field element from WeakMap should return undefined'
        );
    });

    it('Should exit start function if elementsBindingWMap has element', function () {
        const _elements = Array.from(document.getElementsByTagName('span'));
        _elements.push(...document.getElementsByTagName('button'));
        
        this._standardCustomInputEmitter._elementsBindingWMap.set(this.decreasBtn);
        this._standardCustomInputEmitter.start([this.decreasBtn]);
        assert.isUndefined(this._standardCustomInputEmitter.start([this.decreasBtn]));
    });

    it('Should call handle Events upon firing Event', function () {
        const _elements = Array.from(document.getElementsByTagName('span'));
        const addEventListenerSpy = this.sandbox.spy(this._eventAggregator, 'addEventListener');
        const removeEventListenerSpy = this.sandbox.spy(this._eventAggregator, 'removeEventListener');
        const publishSpy = this.sandbox.spy(this._messageBus, 'publish');
        _elements.push(...document.getElementsByTagName('button'));

        this._standardCustomInputEmitter.start(_elements);
        const element = document.getElementsByTagName('span');
        const btnElem = document.getElementsByTagName('button');
        const elientRect = element[0]?.getBoundingClientRect();

        const focusEvent = new Event('focus', { bubbles: true, cancelable: false });
        const moveEvent = new Event('mouseenter', { clientX: elientRect.left, clientY: elientRect.top });
        const clickEvent = new Event('click', { bubbles: true, cancelable: false });
        const mousemoveEvent = new Event('mousemove', { bubbles: true, cancelable: false });
        const mouseupEvent = new Event('mouseup', { bubbles: true, cancelable: false });
        const mousedownEvent = new Event('mousedown', { bubbles: true, cancelable: false });
        const mouseleaveEvent = new Event('mouseleave', { bubbles: true, cancelable: false });
        const keydownEvent = new Event('keydown', { bubbles: true, cancelable: false });

        btnElem[0].dispatchEvent(clickEvent);

        element[0].dispatchEvent(focusEvent);
        element[0].dispatchEvent(moveEvent);
        element[0].dispatchEvent(clickEvent);

        assert.isTrue(
            this._standardCustomInputEmitter.handleMouseEnter.called,
            'this._standardCustomInputEmitter.handleFocus should be called with input event message'
        );
        assert.isTrue(
            this._standardCustomInputEmitter.handleFocus.called,
            'this._standardCustomInputEmitter.handleFocus should be called with input event message'
        );
        assert.isTrue(
            this._standardCustomInputEmitter.handleOnClickEvents.called,
            'this._standardCustomInputEmitter.handleOnClickEvents should be called with input event message'
        );
        assert.equal(addEventListenerSpy.callCount, 5);
        assert.equal(removeEventListenerSpy.callCount, 0);

        // will add 4 more events mousemove/mouseleave/mouseup/keydown
        element[0].dispatchEvent(mousedownEvent);
        element[0].dispatchEvent(keydownEvent);
        element[0].dispatchEvent(mousemoveEvent);
        element[0].dispatchEvent(mouseleaveEvent);
        element[0].dispatchEvent(mouseupEvent);
        element[0].dispatchEvent(focusEvent);

        assert.isTrue(
            this._standardCustomInputEmitter.mousemove.called,
            'this._standardCustomInputEmitter.mousemove should be called with input event message'
        );
        assert.isTrue(
            this._standardCustomInputEmitter.keydown.called,
            'this._standardCustomInputEmitter.keydown should be called with input event message'
        );
        assert.isTrue(
            this._standardCustomInputEmitter.mouseleave.called,
            'this._standardCustomInputEmitter.mouseleave should be called with input event message'
        );
        assert.isTrue(
            this._standardCustomInputEmitter.mouseup.called,
            'this._standardCustomInputEmitter.mouseup should be called with input event message'
        );
        assert.isTrue(
            this._standardCustomInputEmitter.mousedown.called,
            'this._standardCustomInputEmitter.mousedown should be called with input event message'
        );

        assert.equal(addEventListenerSpy.callCount, 9);
        assert.equal(removeEventListenerSpy.callCount, 3);
        this._standardCustomInputEmitter.stop(_elements);
        assert.equal(removeEventListenerSpy.callCount, 7);
        assert.equal(publishSpy.callCount, 6);
    });
});
