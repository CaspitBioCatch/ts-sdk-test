import {assert} from 'chai';
import MessageBus from '../../../../../src/main/technicalServices/MessageBus';
import ClickEvents from '../../../../../src/main/collectors/events/ClickEvents';
import CDUtils from '../../../../../src/main/technicalServices/CDUtils';
import {MessageBusEventType} from '../../../../../src/main/events/MessageBusEventType';
import TestFeatureSupport from '../../../../TestFeatureSupport';
import StandardOnClickEventsEmitter from '../../../../../src/main/services/StandardOnClickEventsEmitter';
import ConfigurationRepository from '../../../../../src/main/core/configuration/ConfigurationRepository';
import BrowserContext from '../../../../../src/main/core/browsercontexts/BrowserContext';
import sinon from "sinon";
import ElementsCollector from "../../../../../src/main/collectors/events/ElementsCollector";
import {ConfigurationFields} from "../../../../../src/main/core/configuration/ConfigurationFields";
import {TestUtils} from "../../../../TestUtils";

describe('ClickEvents Event Tests:', function () {
    let maskingServiceStub;

    beforeEach(function () {
        if (!TestFeatureSupport.isMutationObserverSupported()) {
            this.skip();
            return;
        }
        this._messageBus = new MessageBus();
        this._browserContext = new BrowserContext(self);

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
        this._configurationRepositoryStub = sinon.createStubInstance(ConfigurationRepository);
        this._configurationRepositoryStub.get.withArgs(ConfigurationFields.enableElementHierarchy).returns(true);

        maskingServiceStub = {
            maskAbsoluteIfRequired: sinon.stub().returnsArg(0),
            maskText: sinon.stub().returns('maskingServiceStub.maskText.mock'),
            _shouldMask: sinon.stub().returnsArg(0)
        };

        this.elementsStub = sinon.createStubInstance(ElementsCollector);

        const sendToQueue = sinon.spy();

        this._clickEvents = new ClickEvents(
            sendToQueue,
            CDUtils,
            this._messageBus,
            this._configurationRepositoryStub,
            sinon.createStubInstance(StandardOnClickEventsEmitter),
            maskingServiceStub,
            this.elementsStub
        );
        this._handleOnClickEventsSpy = sinon.spy(this._clickEvents, 'handleOnClickEvents');
    });

    afterEach(function () {
        document.body.removeChild(document.getElementById('cb1'));
        document.body.removeChild(document.getElementById('radio1'));
        document.body.removeChild(document.getElementById('radio2'));
        document.body.removeChild(document.getElementById('btn1'));
        this._messageBus = null;
    });

    it('Should create a new ClickEvents instance', function () {
        assert.isObject(this._clickEvents, 'Could not create a new instance of ClickEvents');
        assert.instanceOf(this._clickEvents, ClickEvents, 'this._clickEvents is not an instance of ClickEvents');
    });

    it('Should invoke start of events emitters', async function () {
        this._clickEvents.bind(new BrowserContext(self));
        await TestUtils.wait(1);
        assert.isTrue(this._clickEvents._StandardOnClickEventsEmitter.start.called, '_StandardOnClickEventsEmitter start method not called');
    });

    it('Should invoke stop of event emitters', async function () {
        this._clickEvents.unbind(new BrowserContext(self));
        await TestUtils.wait(1);
        assert.isTrue(this._clickEvents._StandardOnClickEventsEmitter.stop.called, '_StandardOnClickEventsEmitter stop method not called');
    });

    it('Should call ClickEvents handler upon publishing related messages', function () {
        this._clickEvents.bind(new BrowserContext(self));
        const e = document.createEvent('Event');
        e.initEvent('click', true, true);
        const button = document.getElementById('btn1');
        button.dispatchEvent(e);
        this._messageBus.publish(MessageBusEventType.StandardOnClickEvent, e);
        assert.isTrue(this._handleOnClickEventsSpy.called, 'clickEvents.handleOnClickEvents was not called upon publishing message');
    });

    it('Should call ClickEvents._sendToQueue upon publishing related messages', function () {
        this._clickEvents.bind(new BrowserContext(self));
        const e = document.createEvent('Event');
        e.initEvent('click', true, true);
        const button = document.getElementById('btn1');
        button.dispatchEvent(e);
        this._messageBus.publish(MessageBusEventType.StandardOnClickEvent, e);
        assert.isTrue(this._clickEvents._sendToQueue.called, 'clickEvents_sentToQueue was not called upon publishing message');
    });

    it('Should mask value field', function () {
        const sendToQueue = sinon.spy();

        this._clickEvents = new ClickEvents(sendToQueue, CDUtils, this._messageBus,
            this._configurationRepositoryStub, sinon.createStubInstance(StandardOnClickEventsEmitter), maskingServiceStub);

        this._clickEvents.bind(new BrowserContext(self));
        const e = document.createEvent('Event');
        e.initEvent('click', true, true);
        const button = document.getElementById('btn1');

        // Set value to some value which requires masking
        button.value = 'valuE124Tadad245a';

        button.dispatchEvent(e);
        this._messageBus.publish(MessageBusEventType.StandardOnClickEvent, e);
        assert.isTrue(this._clickEvents._sendToQueue.called, 'clickEvents_sentToQueue was not called upon publishing message');
        // Verify the value numbers were masked
        assert.equal(this._clickEvents._sendToQueue.firstCall.args[1].elementValues, maskingServiceStub.maskText(button.value));
    });

    it('Should fully mask an empty value field', function () {
        this._clickEvents.bind(new BrowserContext(self));
        const e = document.createEvent('Event');
        e.initEvent('click', true, true);
        const button = document.getElementById('btn1');

        // Set value to some value which requires masking
        button.value = '';

        button.dispatchEvent(e);
        this._messageBus.publish(MessageBusEventType.StandardOnClickEvent, e);
        assert.isTrue(this._clickEvents._sendToQueue.called, 'clickEvents_sentToQueue was not called upon publishing message');
        // Verify the value numbers were masked
        assert.equal(this._clickEvents._sendToQueue.firstCall.args[1].elementValues, maskingServiceStub.maskText(button.value));
    });

    it('Should add elements upon invoking addOnLoadInputData', async function () {

        const buttonElement = document.createElement('button');
        buttonElement.setAttribute('id', 'txt1');
        buttonElement.type = 'button';
        buttonElement.value = 'Some button field text 1';
        buttonElement.className = 'button-text-class'; // set the CSS class
        document.body.appendChild(buttonElement); // put it into the DOM

        const buttonElementB = document.createElement('button');
        buttonElementB.setAttribute('id', 'txt2');
        buttonElementB.type = 'button';
        buttonElementB.value = 'Some button field text 2';
        buttonElementB.className = 'button-text-class'; // set the CSS class
        document.body.appendChild(buttonElementB); // put it into the DOM

        this._clickEvents.addOnLoadInputData(this._browserContext);
        await TestUtils.wait(5);
        assert.isTrue(this.elementsStub.getElement.called, '_elements.getElement was not called upon invoking addOnLoadInputData');

        document.body.removeChild(buttonElement);
        document.body.removeChild(buttonElementB);
    });

    it('Should call processElements when auto element ID is enabled', function () {
        // Arrange
        this._clickEvents._enableElementHierarchy = false;

        // Act
        this._clickEvents.addOnLoadInputData(this._browserContext, false);

        // Assert
        assert.isFalse(this.elementsStub.getElement.called, 'should not be called when auto element ID is disabled');
    });

    it('Should call the correct methods based on element status and change flag', function () {
        let resendMethodStub, getMethodStub;

        resendMethodStub = sinon.stub();
        getMethodStub = sinon.stub();

        // Arrange
        const element1 = {id: 'element1'};
        const element2 = {id: 'element2'};
        const elements = [element1, element2];

        // Define behavior for isListed
        this.elementsStub.isListed.withArgs(element1).returns(true);
        this.elementsStub.isListed.withArgs(element2).returns(false);

        // Act
        this._clickEvents.processElements(elements, false, this.elementsStub, resendMethodStub, getMethodStub);

        // Assert
        assert.isTrue(resendMethodStub.calledOnce, 'resendMethod should be called once for element1');
        assert.isTrue(resendMethodStub.calledWith(element1), 'resendMethod should be called with element1');

        assert.isTrue(getMethodStub.calledOnce, 'getMethod should be called once for element2');
        assert.isTrue(getMethodStub.calledWith(element2, false), 'getMethod should be called with element2 and false');

        // Act again with isChange = true
        this._clickEvents.processElements(elements, true, this.elementsStub, resendMethodStub, getMethodStub);

        // Assert that resendMethod is not called again
        assert.isTrue(resendMethodStub.calledOnce, 'resendMethod should not be called again');
        // Assert that getMethod is called again
        assert.isTrue(getMethodStub.calledTwice, 'getMethod should be called twice (once for each case)');
    });
});
