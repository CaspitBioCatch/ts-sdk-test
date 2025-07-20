import { assert } from 'chai';
import MessageBus from '../../../../../src/main/technicalServices/MessageBus';
import SelectElementEvents from '../../../../../src/main/collectors/events/SelectElementEvents';
import { MessageBusEventType } from '../../../../../src/main/events/MessageBusEventType';
import TestFeatureSupport from '../../../../TestFeatureSupport';
import StandardOnChangeEventsEmitter from '../../../../../src/main/services/StandardOnChangeEventsEmitter';
import BrowserContext from '../../../../../src/main/core/browsercontexts/BrowserContext';
import ElementFocusEventEmitter from "../../../../../src/main/emitters/ElementFocusEventEmitter";
import ElementBlurEventEmitter from "../../../../../src/main/emitters/ElementBlurEventEmitter";
import ConfigurationRepository from "../../../../../src/main/core/configuration/ConfigurationRepository";
import CDUtils from "../../../../../src/main/technicalServices/CDUtils";
import sinon from "sinon";
import {TestUtils} from "../../../../TestUtils";

describe('Webpack SelectElementEvents Event Tests:', function () {
    let maskingServiceStub;

    beforeEach(function () {
        if (!TestFeatureSupport.isMutationObserverSupported()) {
            this.skip();
            return;
        }
        this._messageBus = new MessageBus();

        const select = document.createElement('select');
        const optionsValues = [];
        for (let i = 0; i < 5; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.text = i + '_text';
            optionsValues.push(i + '_text');
            select.appendChild(opt);
        }

        maskingServiceStub = {
            maskAbsoluteIfRequired: sinon.stub().returnsArg(0),
            maskText: sinon.stub().returns('maskingServiceStub.maskText.mock'),
            _shouldMask: sinon.stub().returnsArg(0),
        };

        select.setAttribute('id', 'select1');
        select.selectedIndex = 0;
        document.body.appendChild(select);
        this._configurationRepositoryStub = sinon.stub(new ConfigurationRepository());
        const sendToQueue = sinon.spy();
        this._selectElementEvents = new SelectElementEvents(
            sendToQueue,
            CDUtils,
            this._messageBus,
            sinon.createStubInstance(StandardOnChangeEventsEmitter),
            sinon.createStubInstance(ElementFocusEventEmitter),
            sinon.createStubInstance(ElementBlurEventEmitter),
            this._configurationRepositoryStub,
            maskingServiceStub
        );
        this._handleOnChangeEventsSpy = sinon.spy(this._selectElementEvents, 'handleOnChangeEvents');
        this._handleElementFocusEventsSpy = sinon.spy(this._selectElementEvents, 'handleFocusEvent');
        this._handleElementBlurEventsSpy = sinon.spy(this._selectElementEvents, 'handleBlurEvent');
    });

    afterEach(function () {
        document.body.removeChild(document.getElementById('select1'));
        this._messageBus = null;
    });

    it('Should create a new SelectElementEvents instance', function () {
        assert.isObject(this._selectElementEvents, 'Could not create a new instance of SelectElementEvents');
        assert.instanceOf(this._selectElementEvents, SelectElementEvents, 'this._selectElementEvents is not an instance of SelectElementEvents');
    });

    it('Should invoke start of events emitters', async function () {
        this._configurationRepositoryStub.get.withArgs('collectSelectElementBlurAndFocusEvents').returns(true);
        const browserContext = new BrowserContext(self);
        this._selectElementEvents.updateSettings(browserContext)
        this._selectElementEvents.bind(browserContext);
        await TestUtils.wait(1)
        assert.isTrue(this._selectElementEvents._StandardOnChangeEventsEmitter.start.called, '_StandardOnChangeEventsEmitter start method not called');
        assert.isTrue(this._selectElementEvents._elementFocusEventEmitter.start.called, '_elementFocusEventEmitter start method not called');
        assert.isTrue(this._selectElementEvents._elementBlurEventEmitter.start.called, '_elementBlurEventEmitter start method not called');
    });

    it('Should invoke stop of event emitters', async function () {
        this._selectElementEvents.unbind(new BrowserContext(self));
        await TestUtils.wait(1)
        assert.isTrue(this._selectElementEvents._StandardOnChangeEventsEmitter.stop.called, '_StandardOnChangeEventsEmitter stop method not called');
        assert.isTrue(this._selectElementEvents._elementFocusEventEmitter.stop.called, '_elementFocusEventEmitter stop method not called');
        assert.isTrue(this._selectElementEvents._elementBlurEventEmitter.stop.called, '_elementBlurEventEmitter stop method not called');
    });

    it('Should call change Events handler upon publishing related messages', function () {
        this._selectElementEvents.bind(new BrowserContext(self));
        const select = document.getElementById('select1');
        const e = document.createEvent('Event');
        e.initEvent('change', true, true);
        select.selectedIndex = 1; // in IE the click event is enough, in the other not
        select.dispatchEvent(e);
        this._messageBus.publish(MessageBusEventType.StandardOnSelectEvent, e);
        assert.isTrue(this._handleOnChangeEventsSpy.called, 'selectElementEvents.handleOnChangeEvents was not called upon publishing message');
    });

    it('Should call element Focus Event handler upon publishing related messages', function () {
        this._selectElementEvents.bind(new BrowserContext(self));
        const select = document.getElementById('select1');
        const e = document.createEvent('Event');
        e.initEvent('focus', true, false);
        select.selectedIndex = 1; // in IE the click event is enough, in the other not
        select.dispatchEvent(e);
        this._messageBus.publish(MessageBusEventType.ElementFocusEvent, e);
        assert.isTrue(this._handleElementFocusEventsSpy.called, 'selectElementEvents.handleFocusEvent was not called upon publishing message');
    });

    it('Should call element Blur Event handler upon publishing related messages', function () {
        this._selectElementEvents.bind(new BrowserContext(self));
        const select = document.getElementById('select1');
        const e = document.createEvent('Event');
        e.initEvent('blur', true, false);
        select.selectedIndex = 1; // in IE the click event is enough, in the other not
        select.dispatchEvent(e);
        this._messageBus.publish(MessageBusEventType.ElementBlurEvent, e);
        assert.isTrue(this._handleElementBlurEventsSpy.called, 'selectElementEvents.handleBlurEvent was not called upon publishing message');
    });

    it('Should call selectElementEvents._sendToQueue upon publishing related change messages', function () {
        this._selectElementEvents.bind(new BrowserContext(self));
        const select = document.getElementById('select1');
        const e = document.createEvent('Event');
        e.initEvent('change', true, true);
        select.selectedIndex = 1; // in IE the click event is enough, in the other not
        select.dispatchEvent(e);
        this._messageBus.publish(MessageBusEventType.StandardOnSelectEvent, e);
        assert.isTrue(this._selectElementEvents._sendToQueue.called, 'selectElementEvents_sentToQueue was not called upon publishing message');
    });

    describe('configuration _collectSelectElementBlurAndFocusEvents tests', function () {
        it('Should not call selectElementEvents._sendToQueue upon publishing related blur messages when configuration false', async function () {
            this._configurationRepositoryStub.get.withArgs('collectSelectElementBlurAndFocusEvents').returns(false);
            const browserContext = new BrowserContext(self);
            this._selectElementEvents.updateSettings(browserContext)
            this._selectElementEvents.bind(browserContext);
            await TestUtils.wait(1)
            assert.isFalse(this._selectElementEvents._StandardOnChangeEventsEmitter.stop.called, '_StandardOnChangeEventsEmitter stop method was called');
            assert.isTrue(this._selectElementEvents._elementFocusEventEmitter.stop.called, '_elementFocusEventEmitter stop method not called');
            assert.isTrue(this._selectElementEvents._elementFocusEventEmitter.stop.called, '_elementBlurEventEmitter stop method not called');
        });

        it('Should not call selectElementEvents._sendToQueue upon publishing related blur messages when configuration false', function () {
            this._configurationRepositoryStub.get.withArgs('collectSelectElementBlurAndFocusEvents').returns(true);
            const browserContext = new BrowserContext(self);
            this._selectElementEvents.updateSettings(browserContext)
            this._selectElementEvents.bind(browserContext);
            assert.isFalse(this._selectElementEvents._StandardOnChangeEventsEmitter.stop.called, '_StandardOnChangeEventsEmitter stop method was called');
            assert.isFalse(this._selectElementEvents._elementFocusEventEmitter.stop.called, '_elementFocusEventEmitter stop method called');
            assert.isFalse(this._selectElementEvents._elementFocusEventEmitter.stop.called, '_elementBlurEventEmitter stop method called');
        });
    });

});
