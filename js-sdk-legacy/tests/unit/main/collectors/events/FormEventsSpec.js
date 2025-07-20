import { assert } from 'chai';
import MessageBus from '../../../../../src/main/technicalServices/MessageBus';
import FormEvents from '../../../../../src/main/collectors/events/FormEvents';
import { TestUtils } from '../../../../TestUtils';
import { MessageBusEventType } from '../../../../../src/main/events/MessageBusEventType';
import TestFeatureSupport from '../../../../TestFeatureSupport';
import StandardOnFormEventsEmitter from '../../../../../src/main/services/StandardOnFormEventsEmitter';
import BrowserContext from '../../../../../src/main/core/browsercontexts/BrowserContext';

describe('FormEvents Event Tests:', function () {
    beforeEach(function () {
        if (!TestFeatureSupport.isMutationObserverSupported()) {
            this.skip();
            return;
        }
        this._messageBus = new MessageBus();

        this._browserContext = new BrowserContext(self);

        const sendToQueue = sinon.spy();
        this._formEvents = new FormEvents(
            sendToQueue,
            this._messageBus,
            sinon.createStubInstance(StandardOnFormEventsEmitter),
        );
        this._handleOnFormEventsSpy = sinon.spy(this._formEvents, 'handleOnFormEvents');
    });

    it('Should create a new FormEvents instance', function () {
        assert.isObject(this._formEvents, 'Could not create a new instance of FormEvents');
        assert.instanceOf(this._formEvents, FormEvents, 'this._formEvents is not an instance of FormEvents');
    });

    it('Should invoke start of events emitters', async function () {
        this._formEvents.bind(this._browserContext);
        await TestUtils.wait(1)
        assert.isTrue(this._formEvents._StandardOnFormEventsEmitter.start.called, 'StandardOnFormEventsEmitter start method not called');
        this._formEvents.unbind(this._browserContext);
    });

    it('Should invoke stop of event emitters', async function () {
        this._formEvents.unbind(this._browserContext);
        await TestUtils.wait(1)
        assert.isTrue(this._formEvents._StandardOnFormEventsEmitter.stop.called, 'StandardOnFormEventsEmitter stop method not called');
    });

    it('Should call FormEvents handler upon publishing related messages', async function () {
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

        this._formEvents.bind(this._browserContext);
        const submitEvent = document.createEvent('Event');
        submitEvent.initEvent('submit', true, true);

        this._messageBus.publish(MessageBusEventType.StandardOnFormSubmitEvent, submitEvent);

        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this._handleOnFormEventsSpy.called, '_formEvents.handleOnFormEvents was not called upon publishing message');
        }).finally(() => {
            this._formEvents.unbind(this._browserContext);
            document.body.removeChild(_form);
        });
    });

    it('Should call FormEvents._sendToQueue upon publishing related messages', async function () {
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

        this._formEvents.bind(this._browserContext);
        const submitEvent = document.createEvent('Event');
        submitEvent.initEvent('submit', true, true);

        this._messageBus.publish(MessageBusEventType.StandardOnFormSubmitEvent, submitEvent);

        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this._formEvents._sendToQueue.called, '_formEvents_sentToQueue was not called upon publishing message');
        }).finally(() => {
            this._formEvents.unbind(this._browserContext);
            document.body.removeChild(_form);
        });
    });
});
