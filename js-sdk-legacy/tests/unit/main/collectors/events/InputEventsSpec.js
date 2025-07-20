import { assert } from 'chai';
import MessageBus from '../../../../../src/main/technicalServices/MessageBus';
import InputEvents from '../../../../../src/main/collectors/events/InputEvents';
import { MockObjects } from '../../../mocks/mockObjects';
import { MessageBusEventType } from '../../../../../src/main/events/MessageBusEventType';
import TestFeatureSupport from '../../../../TestFeatureSupport';
import StandardInputEventsEmitter from '../../../../../src/main/services/StandardInputEventsEmitter';
import SyntheticMaskInputEventsHandler from '../../../../../src/main/services/SyntheticMaskInputEventsHandler';
import SyntheticAutotabInputEventsHandler from '../../../../../src/main/services/SyntheticAutotabInputEventsHandler';
import ElementsCollector from '../../../../../src/main/collectors/events/ElementsCollector';
import BrowserContext from '../../../../../src/main/core/browsercontexts/BrowserContext';
import MaskingService from "../../../../../src/main/core/masking/MaskingService";
import {TestUtils} from "../../../../TestUtils";

describe('InputEvents Event Tests:', function () {
    const getInputEvent = (target, data) => {
        return {
            bubbles: true,
            cancelBubble: false,
            cancelable: false,
            composed: true,
            currentTarget: null,
            data,
            dataTransfer: null,
            defaultPrevented: false,
            detail: 0,
            eventPhase: 0,
            inputType: 'insertText',
            isComposing: false,
            isTrusted: true,
            returnValue: true,
            sourceCapabilities: null,
            srcElement: Object.assign(target, {}),
            target: Object.assign(target, {}),
            timestamp: Date.now(),
            type: 'input',
            view: null,
            which: 0,
        };
    };
    beforeEach(function () {
        if (!TestFeatureSupport.isMutationObserverSupported()) {
            this.skip();
            return;
        }
        this._messageBus = new MessageBus();

        this._browserContext = new BrowserContext(self);

        const sendToQueue = sinon.spy();
        this.elementsStub = sinon.createStubInstance(ElementsCollector);
        this.elementsStub.getElement.returns(32);
        this.elementsStub.isListed.returns(false);
        this.maskingServiceStub = sinon.createStubInstance(MaskingService);
        this.elementsStub._maskingService = this.maskingServiceStub

        this._inputEvents = new InputEvents(
            this.elementsStub,
            sendToQueue,
            MockObjects.cdUtils,
            this._messageBus,
            sinon.createStubInstance(StandardInputEventsEmitter),
            sinon.createStubInstance(SyntheticMaskInputEventsHandler),
            sinon.createStubInstance(SyntheticAutotabInputEventsHandler),
            this.maskingServiceStub,
            5
        );
        this._handleInputEventsSpy = sinon.spy(this._inputEvents, 'handleInputEvents');
        this._handleFocusBlurEventsSpy = sinon.spy(this._inputEvents, 'handleFocusBlurEvents');
        this._handleSyntheticInputEventsSpy = sinon.spy(this._inputEvents, 'handleSyntheticInputEvents');
    });

    it('Should create a new InputEvents instance', function () {
        assert.isObject(this._inputEvents, 'Could not create a new instance of InputEvents');
        assert.instanceOf(this._inputEvents, InputEvents, 'this._inputEvents is not an instance of InputEvents');
    });

    it('Should invoke start of events emitters', async function () {
        const inputElement = document.createElement('input');
        inputElement.setAttribute('id', 'txt1');
        inputElement.type = 'text';
        inputElement.value = 'Some input field text 1';
        inputElement.className = 'input-text-class'; // set the CSS class
        document.body.appendChild(inputElement); // put it into the DOM

        const inputElementB = document.createElement('input');
        inputElementB.setAttribute('id', 'txt2');
        inputElementB.type = 'text';
        inputElementB.value = 'Some input field text 2';
        inputElementB.className = 'input-text-class'; // set the CSS class
        document.body.appendChild(inputElementB); // put it into the DOM

        this._inputEvents.bind(this._browserContext);
        await TestUtils.wait(10)
        assert.isTrue(this._inputEvents._StandardInputEventsEmitter.start.called, 'StandardInputEventsEmitter start method not called');
        assert.isTrue(this._inputEvents._SyntheticMaskInputEventsHandler.start.called, 'SyntheticMaskInputEventsHandler start method not called');
        assert.isTrue(this._inputEvents._SyntheticAutotabInputEventsHandler.start.called, 'SyntheticAutotabInputEventsHandler start method not called');
        document.body.removeChild(inputElement);
        document.body.removeChild(inputElementB);
    });

    it('Should invoke stop of event emitters', async function () {
        const inputElement = document.createElement('input');
        inputElement.setAttribute('id', 'txt1');
        inputElement.type = 'text';
        inputElement.value = 'Some input field text 1';
        inputElement.className = 'input-text-class'; // set the CSS class
        document.body.appendChild(inputElement); // put it into the DOM

        const inputElementB = document.createElement('input');
        inputElementB.setAttribute('id', 'txt2');
        inputElementB.type = 'text';
        inputElementB.value = 'Some input field text 2';
        inputElementB.className = 'input-text-class'; // set the CSS class
        document.body.appendChild(inputElementB); // put it into the DOM

        this._inputEvents.unbind(this._browserContext);
        await TestUtils.wait(10)

        assert.isTrue(this._inputEvents._StandardInputEventsEmitter.stop.called, 'StandardInputEventsEmitter stop method not called');
        assert.isTrue(this._inputEvents._SyntheticMaskInputEventsHandler.stop.called, 'SyntheticMaskInputEventsHandler stop method not called');
        assert.isTrue(this._inputEvents._SyntheticAutotabInputEventsHandler.stop.called, 'SyntheticAutotabInputEventsHandler stop method not called');

        document.body.removeChild(inputElement);
        document.body.removeChild(inputElementB);
    });

    it('Should add elements upon invoking addOnLoadInputData', async function () {
        const inputElement = document.createElement('input');
        inputElement.setAttribute('id', 'txt1');
        inputElement.type = 'text';
        inputElement.value = 'Some input field text 1';
        inputElement.className = 'input-text-class'; // set the CSS class
        document.body.appendChild(inputElement); // put it into the DOM

        const inputElementB = document.createElement('input');
        inputElementB.setAttribute('id', 'txt2');
        inputElementB.type = 'text';
        inputElementB.value = 'Some input field text 2';
        inputElementB.className = 'input-text-class'; // set the CSS class
        document.body.appendChild(inputElementB); // put it into the DOM

        this._inputEvents.addOnLoadInputData(this._browserContext);
        await TestUtils.wait(10)

        assert.isTrue(this.elementsStub.getElement.called, '_elements.getElement was not called upon invoking addOnLoadInputData');

        document.body.removeChild(inputElement);
        document.body.removeChild(inputElementB);
    });

    it('Should call inputEvents handlers upon publishing related messages', function () {
        const inputElement = document.createElement('input');
        inputElement.setAttribute('id', 'txt1');
        inputElement.type = 'text';
        inputElement.value = 'Some input field text 1';
        inputElement.className = 'input-text-class'; // set the CSS class
        document.body.appendChild(inputElement); // put it into the DOM

        const inputElementB = document.createElement('input');
        inputElementB.setAttribute('id', 'txt2');
        inputElementB.type = 'text';
        inputElementB.value = 'Some input field text 2';
        inputElementB.className = 'input-text-class'; // set the CSS class
        document.body.appendChild(inputElementB); // put it into the DOM

        this._inputEvents.bind(this._browserContext);
        this._messageBus.publish(MessageBusEventType.StandardInputEvent, getInputEvent(document.getElementById('txt1'), 'text1'));
        this._messageBus.publish(MessageBusEventType.StandardInputFocusEvent, getInputEvent(document.getElementById('txt1'), 'text1'));
        this._messageBus.publish(MessageBusEventType.StandardInputBlurEvent, getInputEvent(document.getElementById('txt1'), 'text1'));
        this._messageBus.publish(MessageBusEventType.SyntheticInputMaskEvent, getInputEvent(document.getElementById('txt1'), 'text1'));
        assert.isTrue(this._handleInputEventsSpy.called, 'inputEvents.handleInputEvents was not called upon publishing message');
        assert.isTrue(this._handleFocusBlurEventsSpy.called, 'inputEvents.handleInputEvents was not called upon publishing message');
        assert.equal(this._handleFocusBlurEventsSpy.callCount, 2, 'inputEvents._handleFocusBlurEventsSpy was not called twice');
        assert.isTrue(this._handleSyntheticInputEventsSpy.called, 'inputEvents.handleInputEvents was not called upon publishing message');
        assert.isTrue(this.maskingServiceStub.maskText.called, 'maskingService maskText method not called');

        document.body.removeChild(inputElement);
        document.body.removeChild(inputElementB);
    });

    it('Should call inputEvents._sendToQueue upon publishing related messages', function () {
        const inputElement = document.createElement('input');
        inputElement.setAttribute('id', 'txt1');
        inputElement.type = 'text';
        inputElement.value = 'Some input field text 1';
        inputElement.className = 'input-text-class'; // set the CSS class
        document.body.appendChild(inputElement); // put it into the DOM

        const inputElementB = document.createElement('input');
        inputElementB.setAttribute('id', 'txt2');
        inputElementB.type = 'text';
        inputElementB.value = 'Some input field text 2';
        inputElementB.className = 'input-text-class'; // set the CSS class
        document.body.appendChild(inputElementB); // put it into the DOM

        this._inputEvents.bind(this._browserContext);
        this._messageBus.publish(MessageBusEventType.StandardInputEvent, getInputEvent(document.getElementById('txt1'), 'text1'));
        this._messageBus.publish(MessageBusEventType.StandardInputFocusEvent, getInputEvent(document.getElementById('txt1'), 'text1'));
        this._messageBus.publish(MessageBusEventType.StandardInputBlurEvent, getInputEvent(document.getElementById('txt1'), 'text1'));
        this._messageBus.publish(MessageBusEventType.SyntheticInputMaskEvent, getInputEvent(document.getElementById('txt1'), 'text1'));
        assert.isTrue(this.maskingServiceStub.maskText.called, 'maskingService maskText method not called');

        assert.equal(this._inputEvents._sendToQueue.callCount, 4, '_sentToQueue was callCount is not equal to the publish messages call count');
        document.body.removeChild(inputElement);
        document.body.removeChild(inputElementB);
    });

    describe('Shadow DOM Support Tests:', function () {
        beforeEach(function () {
            // Skip if Shadow DOM is not supported
            if (!('attachShadow' in Element.prototype)) {
                this.skip();
                return;
            }
        });

        afterEach(function () {
            // Clean up any shadow host elements
            const shadowHosts = document.querySelectorAll('.shadow-host-test');
            shadowHosts.forEach(host => {
                if (host.parentNode) {
                    host.parentNode.removeChild(host);
                }
            });
        });

        it('Should collect input elements from single shadow root', async function () {
            // Create a shadow host
            const shadowHost = document.createElement('div');
            shadowHost.className = 'shadow-host-test';
            document.body.appendChild(shadowHost);

            // Attach shadow root
            const shadowRoot = shadowHost.attachShadow({mode: 'open'});

            // Create input element inside shadow root
            const shadowInput = document.createElement('input');
            shadowInput.setAttribute('id', 'shadow-input');
            shadowInput.type = 'text';
            shadowInput.value = 'Shadow DOM input';
            shadowRoot.appendChild(shadowInput);

            // Create a second input (outside shadow root, if needed)
            const normalInput = document.createElement('input');
            normalInput.setAttribute('id', 'password');
            normalInput.setAttribute('name', 'password');
            normalInput.setAttribute('data-bc', 'password');
            document.body.appendChild(normalInput);


            // Bind the input events - this should collect shadow DOM inputs
            this._inputEvents.bind(this._browserContext);
            await TestUtils.wait(10)
            assert.isTrue(this._inputEvents._StandardInputEventsEmitter.start.called, 'StandardInputEventsEmitter start method not called');
            const args = this._inputEvents._StandardInputEventsEmitter.start.getCall(0).args;
            // Assert input elements contain both expected inputs
            const inputElements = args[0];

            assert.includeMembers(
                inputElements,
                [shadowInput, normalInput],
                'start was not called with the expected input elements'
            );
        });

        it('Should collect input elements from nested shadow roots with maxShadowDepth', async function () {
            // Create main shadow host
            const shadowHost = document.createElement('div');
            shadowHost.className = 'shadow-host-test';
            document.body.appendChild(shadowHost);

            // Level 1 shadow root
            const shadowRoot1 = shadowHost.attachShadow({mode: 'open'});
            const shadowInput1 = document.createElement('input');
            shadowInput1.setAttribute('id', 'shadow-input-1');
            shadowInput1.type = 'text';
            shadowRoot1.appendChild(shadowInput1);

            // Level 2 shadow root
            const nestedHost = document.createElement('div');
            shadowRoot1.appendChild(nestedHost);
            const shadowRoot2 = nestedHost.attachShadow({mode: 'open'});
            const shadowInput2 = document.createElement('input');
            shadowInput2.setAttribute('id', 'shadow-input-2');
            shadowInput2.type = 'text';
            shadowRoot2.appendChild(shadowInput2);

            // Level 3 shadow root (should be collected since maxShadowDepth is 5)
            const deeperHost = document.createElement('div');
            shadowRoot2.appendChild(deeperHost);
            const shadowRoot3 = deeperHost.attachShadow({mode: 'open'});
            const shadowInput3 = document.createElement('input');
            shadowInput3.setAttribute('id', 'shadow-input-3');
            shadowInput3.type = 'text';
            shadowRoot3.appendChild(shadowInput3);

            // Bind should collect from all levels within maxShadowDepth
            this._inputEvents.bind(this._browserContext);
            await TestUtils.wait(10)
            assert.isTrue(this._inputEvents._StandardInputEventsEmitter.start.called, 'StandardInputEventsEmitter start method not called');
            const args = this._inputEvents._StandardInputEventsEmitter.start.getCall(0).args;
            // Assert input elements contain both expected inputs
            const inputElements = args[0];

            assert.includeMembers(
                inputElements,
                [shadowInput1, shadowInput2, shadowInput3],
                'start was not called with the expected input elements'
            );
        });

        it('Should respect maxShadowDepth limit', async function () {
            // Create an InputEvents instance with maxShadowDepth of 1
            const limitedInputEvents = new InputEvents(
                this.elementsStub,
                sinon.spy(),
                MockObjects.cdUtils,
                this._messageBus,
                sinon.createStubInstance(StandardInputEventsEmitter),
                sinon.createStubInstance(SyntheticMaskInputEventsHandler),
                sinon.createStubInstance(SyntheticAutotabInputEventsHandler),
                this.maskingServiceStub,
                1 // maxShadowDepth = 1
            );

            // Create nested shadow roots beyond the limit
            const shadowHost = document.createElement('div');
            shadowHost.className = 'shadow-host-test';
            document.body.appendChild(shadowHost);

            const shadowRoot1 = shadowHost.attachShadow({mode: 'open'});
            const shadowInput1 = document.createElement('input');
            shadowInput1.setAttribute('id', 'shadow-input-depth-1');
            shadowRoot1.appendChild(shadowInput1);

            // This should be beyond the depth limit
            const nestedHost = document.createElement('div');
            shadowRoot1.appendChild(nestedHost);
            const shadowRoot2 = nestedHost.attachShadow({mode: 'open'});
            const shadowInput2 = document.createElement('input');
            shadowInput2.setAttribute('id', 'shadow-input-depth-2');
            shadowRoot2.appendChild(shadowInput2);

            limitedInputEvents.bind(this._browserContext);
            await TestUtils.wait(10)
            assert.isTrue(limitedInputEvents._StandardInputEventsEmitter.start.called, 'StandardInputEventsEmitter start method not called');
            const args = limitedInputEvents._StandardInputEventsEmitter.start.getCall(0).args;
            // Assert input elements contain both expected inputs
            const inputElements = args[0];
            assert.includeMembers(
                inputElements,
                [shadowInput1],
                'start was not called with the expected input elements'
            );

            assert.notIncludeMembers(
                inputElements,
                [shadowInput2],
                'start was called with the unexpected input elements'
            );
        });

        it('Should handle shadow roots with various input types', async function () {
            const shadowHost = document.createElement('div');
            shadowHost.className = 'shadow-host-test';
            document.body.appendChild(shadowHost);

            const shadowRoot = shadowHost.attachShadow({mode: 'open'});

            // Create various input types
            const textInput = document.createElement('input');
            textInput.type = 'text';
            textInput.setAttribute('id', 'shadow-text');
            shadowRoot.appendChild(textInput);

            const textarea = document.createElement('textarea');
            textarea.setAttribute('id', 'shadow-textarea');
            shadowRoot.appendChild(textarea);

            const passwordInput = document.createElement('input');
            passwordInput.type = 'password';
            passwordInput.setAttribute('id', 'shadow-password');
            shadowRoot.appendChild(passwordInput);

            // Input types that should be excluded
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.setAttribute('id', 'shadow-hidden');
            shadowRoot.appendChild(hiddenInput);

            this._inputEvents.bind(this._browserContext);
            await TestUtils.wait(10)
            assert.isTrue(this._inputEvents._StandardInputEventsEmitter.start.called, 'StandardInputEventsEmitter start method not called');
            const args = this._inputEvents._StandardInputEventsEmitter.start.getCall(0).args;
            // Assert input elements contain both expected inputs
            const inputElements = args[0];
            assert.includeMembers(
                inputElements,
                [textInput, textarea, passwordInput],
                'start was not called with the expected input elements'
            );

            assert.notIncludeMembers(
                inputElements,
                [hiddenInput],
                'start was called with the unexpected input elements'
            );
        });
    });
});
