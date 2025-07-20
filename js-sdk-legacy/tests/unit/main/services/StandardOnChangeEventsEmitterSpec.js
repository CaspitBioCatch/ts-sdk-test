import { assert } from 'chai';
import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import StandardOnChangeEventsEmitter from '../../../../src/main/services/StandardOnChangeEventsEmitter';
import EventAggregator from '../../../../src/main/system/EventAggregator';
import { MockObjects } from '../../mocks/mockObjects';
import TestFeatureSupport from '../../../TestFeatureSupport';

describe('StandardOnChangeEventsEmitter Service Tests:', function () {
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
        this.standardOnChangeEventsEmitter = new StandardOnChangeEventsEmitter(this._messageBus, this._eventAggregator, this.cdUtils);
        this.standardOnChangeEventsEmitter._utils = this.cdUtils;
        this.jQueryUtilsStub.addEventListener.callsFake(function (element, eventType, eventHandler) {
            element.addEventListener(eventType, eventHandler);
        });
        this.jQueryUtilsStub.removeEventListener.callsFake(function (element, eventType, eventHandler) {
            element.removeEventListener(eventType, eventHandler);
        });

        sinon.spy(this.standardOnChangeEventsEmitter, 'handleOnChangeEvents');
        // Re-declare the event listener property with the sinon.spy methods
        this.standardOnChangeEventsEmitter.defaultOnChangeEventListener = [
            { event: 'change', handler: this.standardOnChangeEventsEmitter.handleOnChangeEvents },
        ];
    });

    afterEach(function () {
        this._messageBus = null;
    });

    it('Should create a new instance of StandardOnChangeEventsEmitter', function () {
        assert.isObject(this.standardOnChangeEventsEmitter, 'Could not construct a new standardOnChangeEventsEmitter object');
        assert.instanceOf(this.standardOnChangeEventsEmitter._elementBindingWMap, WeakMap, 'elementBindingWMap should be zero');
        assert.isObject(this.standardOnChangeEventsEmitter._utils, '_utils parameter should be an object');
    });

    it('Should add and remove elements to/from _elementBindingWMap upon start/stop', function () {
        const select1 = document.createElement('select');
        const optionsValues1 = [];
        for (let i = 0; i < 5; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.text = i + '_text';
            optionsValues1.push(i + '_text');
            select1.appendChild(opt);
        }

        select1.setAttribute('id', 'select1');
        select1.selectedIndex = 0;
        document.body.appendChild(select1);

        const select2 = document.createElement('select');
        const optionsValues2 = [];
        for (let i = 0; i < 5; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.text = i + '_text';
            optionsValues2.push(i + '_text');
            select2.appendChild(opt);
        }

        select2.setAttribute('id', 'select2');
        select2.selectedIndex = 0;
        document.body.appendChild(select2);

        const _selectElements = Array.from(document.getElementsByTagName('select'));
        this.standardOnChangeEventsEmitter.start(_selectElements);
        let getWeakMapElement1 = this.standardOnChangeEventsEmitter._elementBindingWMap.get(select1);
        assert.isObject(getWeakMapElement1, 'getWeakMapElement could not be retrieved from weakmap');
        assert.equal(getWeakMapElement1.listeners.length, 1, 'Should be 1 event listener retrieved from weakmap');
        assert.isFalse(getWeakMapElement1.isUsingJQuery, 'Element should not have isUsingJquery set to true');

        let getWeakMapElement2 = this.standardOnChangeEventsEmitter._elementBindingWMap.get(select2);
        assert.isObject(getWeakMapElement2, 'getWeakMapElement could not be retrieved from weakmap');
        assert.equal(getWeakMapElement2.listeners.length, 1, 'Should be 1 event listener retrieved from weakmap');
        assert.isFalse(getWeakMapElement2.isUsingJQuery, 'Element should not have isUsingJquery set to true');

        this.standardOnChangeEventsEmitter.stop(_selectElements);
        getWeakMapElement1 = this.standardOnChangeEventsEmitter._elementBindingWMap.get(select1);
        getWeakMapElement2 = this.standardOnChangeEventsEmitter._elementBindingWMap.get(select2);
        assert.isUndefined(getWeakMapElement1, 'Retrieving the select element from WeakMap should return undefined');
        assert.isUndefined(getWeakMapElement2, 'Retrieving the select element from WeakMap should return undefined');

        document.body.removeChild(select1);
        document.body.removeChild(select2);
    });

    it('Should call change handler upon firing change event', function () {
        const select1 = document.createElement('select');
        const optionsValues1 = [];
        for (let i = 0; i < 5; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.text = i + '_text';
            optionsValues1.push(i + '_text');
            select1.appendChild(opt);
        }

        select1.setAttribute('id', 'select1');
        select1.selectedIndex = 0;
        document.body.appendChild(select1);

        const _selectElements = Array.from(document.getElementsByTagName('select'));
        this.standardOnChangeEventsEmitter.start(_selectElements);

        const e = document.createEvent('Event');
        e.initEvent('change', true, true);
        select1.selectedIndex = 1; // in IE the click event is enough, in the other not
        select1.dispatchEvent(e);

        assert.isTrue(this.standardOnChangeEventsEmitter.handleOnChangeEvents.called, 'this.standardOnChangeEventsEmitter.handleOnChangeEvents should be called with change event message');

        const handleOnChangeEventsLastCall = this.standardOnChangeEventsEmitter.handleOnChangeEvents.getCall(0);
        const data = handleOnChangeEventsLastCall.args[0];

        assert.instanceOf(data, window.Event, 'handleOnChangeEvents should be called with an Event object');

        this.standardOnChangeEventsEmitter.stop(_selectElements);
        document.body.removeChild(select1);
    });

    it('Should call jQuery utils upon invoking addElementEvents', function () {
        const select1 = document.createElement('select');
        const optionsValues1 = [];
        for (let i = 0; i < 5; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.text = i + '_text';
            optionsValues1.push(i + '_text');
            select1.appendChild(opt);
        }

        select1.setAttribute('id', 'select1');
        select1.selectedIndex = 0;
        document.body.appendChild(select1);

        const _selectElements = Array.from(document.getElementsByTagName('select'));

        this.standardOnChangeEventsEmitter.addElementEvents(select1, true);
        assert.isTrue(this.jQueryUtilsStub.addEventListener.called, 'this.jQueryUtilsStub was not called');
        this.standardOnChangeEventsEmitter.removeElementEvents(select1, true);
        assert.isTrue(this.jQueryUtilsStub.removeEventListener.called, 'this.jQueryUtilsStub was not called');
        const getSelect1 = this.standardOnChangeEventsEmitter._elementBindingWMap.get(select1);
        assert.isUndefined(getSelect1, 'Retrieving the select element from WeakMap should return undefined');
        this.standardOnChangeEventsEmitter.stop(_selectElements);
        document.body.removeChild(select1);

        this.jQueryUtilsStub.isJQueryAvailable.restore();
        this.jQueryUtilsStub.addEventListener.restore();
        this.jQueryUtilsStub.removeEventListener.restore();
    });
});
