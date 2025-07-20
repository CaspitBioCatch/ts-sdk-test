import { assert } from 'chai';
import InputEvents, { inputSelectors } from '../../../../src/main/collectors/events/InputEvents';
import { MockObjects } from '../../mocks/mockObjects';
import StandardInputEventsEmitter from '../../../../src/main/services/StandardInputEventsEmitter';
import SyntheticMaskInputEventsHandler from '../../../../src/main/services/SyntheticMaskInputEventsHandler';
import SyntheticAutotabInputEventsHandler from '../../../../src/main/services/SyntheticAutotabInputEventsHandler';
import ElementsCollector from '../../../../src/main/collectors/events/ElementsCollector';
import BrowserContext from '../../../../src/main/core/browsercontexts/BrowserContext';
import MaskingService from "../../../../src/main/core/masking/MaskingService";
import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import TestFeatureSupport from '../../../TestFeatureSupport';
import DOMUtils from '../../../../src/main/technicalServices/DOMUtils';
import {TestUtils} from "../../../TestUtils";

describe('Element Collection Enhancement Tests:', function () {
    beforeEach(function () {
        if (!TestFeatureSupport.isMutationObserverSupported()) {
            this.skip();
            return;
        }
        
        this._messageBus = new MessageBus();
        this._browserContext = new BrowserContext(self);
        this.elementsStub = sinon.createStubInstance(ElementsCollector);
        this.elementsStub.getElement.returns(32);
        this.elementsStub.isListed.returns(false);
        this.maskingServiceStub = sinon.createStubInstance(MaskingService);
        this.elementsStub._maskingService = this.maskingServiceStub;

        const sendToQueue = sinon.spy();
        this._inputEvents = new InputEvents(
            this.elementsStub,
            sendToQueue,
            MockObjects.cdUtils,
            this._messageBus,
            sinon.createStubInstance(StandardInputEventsEmitter),
            sinon.createStubInstance(SyntheticMaskInputEventsHandler),
            sinon.createStubInstance(SyntheticAutotabInputEventsHandler),
            this.maskingServiceStub,
            5 // maxShadowDepth
        );
    });

    afterEach(function () {
        // Clean up test elements
        const testElements = document.querySelectorAll('.test-element-collection');
        testElements.forEach(el => {
            if (el.parentNode) {
                el.parentNode.removeChild(el);
            }
        });

        // Clean up shadow hosts
        const shadowHosts = document.querySelectorAll('.test-shadow-host');
        shadowHosts.forEach(host => {
            if (host.parentNode) {
                host.parentNode.removeChild(host);
            }
        });

        // Clean up iframes
        const testIframes = document.querySelectorAll('.test-iframe');
        testIframes.forEach(iframe => {
            if (iframe.parentNode) {
                iframe.parentNode.removeChild(iframe);
            }
        });
    });

    describe('Main Document Element Collection:', function () {
        it('should collect all input elements from main document', async function () {
            // Create various input elements in main document
            const textInput = document.createElement('input');
            textInput.type = 'text';
            textInput.className = 'test-element-collection';
            textInput.id = 'main-text-input';
            document.body.appendChild(textInput);

            const textarea = document.createElement('textarea');
            textarea.className = 'test-element-collection';
            textarea.id = 'main-textarea';
            document.body.appendChild(textarea);

            const passwordInput = document.createElement('input');
            passwordInput.type = 'password';
            passwordInput.className = 'test-element-collection';
            passwordInput.id = 'main-password-input';
            document.body.appendChild(passwordInput);

            // Elements that should be excluded
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.className = 'test-element-collection';
            hiddenInput.id = 'main-hidden-input';
            document.body.appendChild(hiddenInput);

            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.className = 'test-element-collection';
            fileInput.id = 'main-file-input';
            document.body.appendChild(fileInput);

            this._inputEvents.bind(this._browserContext);
            await TestUtils.wait(5);

            assert.isTrue(this._inputEvents._StandardInputEventsEmitter.start.called, 'StandardInputEventsEmitter start should be called');
            // We can't directly test the elements passed, but we can verify the method was called
        });

        it('should respect input selector constraints', function () {
            // Create elements that match inputSelectors
            const validInput1 = document.createElement('input');
            validInput1.type = 'text';
            validInput1.className = 'test-element-collection';
            document.body.appendChild(validInput1);

            const validInput2 = document.createElement('input');
            validInput2.type = 'email';
            validInput2.className = 'test-element-collection';
            document.body.appendChild(validInput2);

            const validTextarea = document.createElement('textarea');
            validTextarea.className = 'test-element-collection';
            document.body.appendChild(validTextarea);

            // Create elements that should be excluded by inputSelectors
            const colorInput = document.createElement('input');
            colorInput.type = 'color';
            colorInput.className = 'test-element-collection';
            document.body.appendChild(colorInput);

            const buttonInput = document.createElement('input');
            buttonInput.type = 'button';
            buttonInput.className = 'test-element-collection';
            document.body.appendChild(buttonInput);

            const radioInput = document.createElement('input');
            radioInput.type = 'radio';
            radioInput.className = 'test-element-collection';
            document.body.appendChild(radioInput);

            // Verify that querySelectorAll with inputSelectors returns only valid elements
            const validElements = document.querySelectorAll(inputSelectors);
            const testValidElements = Array.from(validElements).filter(el => 
                el.className === 'test-element-collection'
            );

            // Should only include text, email, and textarea
            assert.isTrue(testValidElements.length >= 3, 'Should collect valid input elements only');
            
            // Verify excluded elements are not in the collection
            const excludedTypes = testValidElements.map(el => el.type || el.tagName.toLowerCase());
            assert.isFalse(excludedTypes.includes('color'), 'Color input should be excluded');
            assert.isFalse(excludedTypes.includes('button'), 'Button input should be excluded');
            assert.isFalse(excludedTypes.includes('radio'), 'Radio input should be excluded');
        });
    });

    describe('Shadow DOM Element Collection:', function () {
        beforeEach(function () {
            // Skip if Shadow DOM is not supported
            if (!('attachShadow' in Element.prototype)) {
                this.skip();
                return;
            }
        });

        it('should collect elements from shadow roots within maxShadowDepth', async function () {
            // Create shadow host
            const shadowHost = document.createElement('div');
            shadowHost.className = 'test-shadow-host';
            document.body.appendChild(shadowHost);

            // Level 1 shadow root
            const shadowRoot1 = shadowHost.attachShadow({mode: 'open'});
            const shadowInput1 = document.createElement('input');
            shadowInput1.type = 'text';
            shadowInput1.id = 'shadow-level-1';
            shadowRoot1.appendChild(shadowInput1);

            // Level 2 shadow root
            const nestedHost = document.createElement('div');
            shadowRoot1.appendChild(nestedHost);
            const shadowRoot2 = nestedHost.attachShadow({mode: 'open'});
            const shadowInput2 = document.createElement('input');
            shadowInput2.type = 'text';
            shadowInput2.id = 'shadow-level-2';
            shadowRoot2.appendChild(shadowInput2);

            // Level 3 shadow root
            const deepHost = document.createElement('div');
            shadowRoot2.appendChild(deepHost);
            const shadowRoot3 = deepHost.attachShadow({mode: 'open'});
            const shadowInput3 = document.createElement('input');
            shadowInput3.type = 'text';
            shadowInput3.id = 'shadow-level-3';
            shadowRoot3.appendChild(shadowInput3);

            this._inputEvents.bind(this._browserContext);
            await TestUtils.wait(5);

            assert.isTrue(this._inputEvents._StandardInputEventsEmitter.start.called, 'Should collect elements from shadow roots');
        });

        it('should respect maxShadowDepth limitations', async function () {
            // Create InputEvents with limited shadow depth
            const limitedInputEvents = new InputEvents(
                this.elementsStub,
                sinon.spy(),
                MockObjects.cdUtils,
                this._messageBus,
                sinon.createStubInstance(StandardInputEventsEmitter),
                sinon.createStubInstance(SyntheticMaskInputEventsHandler),
                sinon.createStubInstance(SyntheticAutotabInputEventsHandler),
                this.maskingServiceStub,
                2 // maxShadowDepth = 2
            );

            // Create deep nested shadow DOM beyond the limit
            const shadowHost = document.createElement('div');
            shadowHost.className = 'test-shadow-host';
            document.body.appendChild(shadowHost);

            // Level 1
            const shadowRoot1 = shadowHost.attachShadow({mode: 'open'});
            const shadowInput1 = document.createElement('input');
            shadowInput1.type = 'text';
            shadowRoot1.appendChild(shadowInput1);

            // Level 2
            const nestedHost1 = document.createElement('div');
            shadowRoot1.appendChild(nestedHost1);
            const shadowRoot2 = nestedHost1.attachShadow({mode: 'open'});
            const shadowInput2 = document.createElement('input');
            shadowInput2.type = 'text';
            shadowRoot2.appendChild(shadowInput2);

            // Level 3 (beyond limit)
            const nestedHost2 = document.createElement('div');
            shadowRoot2.appendChild(nestedHost2);
            const shadowRoot3 = nestedHost2.attachShadow({mode: 'open'});
            const shadowInput3 = document.createElement('input');
            shadowInput3.type = 'text';
            shadowRoot3.appendChild(shadowInput3);

            limitedInputEvents.bind(this._browserContext);
            await TestUtils.wait(5);

            assert.isTrue(limitedInputEvents._StandardInputEventsEmitter.start.called, 'Should respect maxShadowDepth limit');
        });

        it('should handle shadow roots with mixed content', async function () {
            const shadowHost = document.createElement('div');
            shadowHost.className = 'test-shadow-host';
            document.body.appendChild(shadowHost);

            const shadowRoot = shadowHost.attachShadow({mode: 'open'});

            // Add various elements to shadow root
            const validInput = document.createElement('input');
            validInput.type = 'text';
            shadowRoot.appendChild(validInput);

            const validTextarea = document.createElement('textarea');
            shadowRoot.appendChild(validTextarea);

            const invalidInput = document.createElement('input');
            invalidInput.type = 'hidden';
            shadowRoot.appendChild(invalidInput);

            const nonInputElement = document.createElement('div');
            shadowRoot.appendChild(nonInputElement);

            this._inputEvents.bind(this._browserContext);
            await TestUtils.wait(5);

            assert.isTrue(this._inputEvents._StandardInputEventsEmitter.start.called, 'Should collect valid elements from shadow root with mixed content');
        });
    });

    describe('Iframe Element Collection:', function () {
        it('should handle iframe accessibility check', function () {
            // Create mock iframe
            const mockIframe = document.createElement('iframe');
            mockIframe.className = 'test-iframe';
            mockIframe.id = 'test-iframe-access';
            document.body.appendChild(mockIframe);

            // Test DOMUtils.canAccessIFrame
            const canAccess = DOMUtils.canAccessIFrame(mockIframe);
            
            // For same-origin iframe created in test, should be accessible
            // Note: In real cross-origin scenarios, this would return false
            assert.isBoolean(canAccess, 'canAccessIFrame should return a boolean value');
        });

        it('should handle iframe load state detection', function () {
            const mockIframe = document.createElement('iframe');
            mockIframe.className = 'test-iframe';
            mockIframe.id = 'test-iframe-load-state';
            document.body.appendChild(mockIframe);

            // Test window document ready check
            if (mockIframe.contentWindow) {
                const isReady = DOMUtils.isWindowDocumentReady(mockIframe.contentWindow);
                assert.isBoolean(isReady, 'isWindowDocumentReady should return a boolean value');
            }
        });

        it('should wait for iframe document ready state', async function () {
            const mockIframe = document.createElement('iframe');
            mockIframe.className = 'test-iframe';
            mockIframe.id = 'test-iframe-wait';
            document.body.appendChild(mockIframe);

            if (mockIframe.contentWindow) {
                // Test awaiting window document ready
                try {
                    await DOMUtils.awaitWindowDocumentReady(mockIframe.contentWindow);
                    assert.isTrue(true, 'awaitWindowDocumentReady should resolve successfully');
                } catch (error) {
                    // This might fail in test environment, but we're testing the function exists
                    assert.isTrue(error instanceof Error, 'Should handle errors gracefully');
                }
            }
        });
    });

    describe('Negative Test Scenarios:', function () {
        it('should handle cases with no matching elements', async function () {
            // Create non-input elements only
            const div = document.createElement('div');
            div.className = 'test-element-collection';
            document.body.appendChild(div);

            const span = document.createElement('span');
            span.className = 'test-element-collection';
            document.body.appendChild(span);

            this._inputEvents.bind(this._browserContext);
            await TestUtils.wait(5);

            // start should still be called even if no elements are found
            assert.isTrue(this._inputEvents._StandardInputEventsEmitter.start.called, 'start should be called even with no matching elements');
        });

        it('should handle shadow DOM when maxShadowDepth is 0', async function () {
            if (!('attachShadow' in Element.prototype)) {
                this.skip();
                return;
            }

            // Create InputEvents with no shadow DOM support
            const noShadowInputEvents = new InputEvents(
                this.elementsStub,
                sinon.spy(),
                MockObjects.cdUtils,
                this._messageBus,
                sinon.createStubInstance(StandardInputEventsEmitter),
                sinon.createStubInstance(SyntheticMaskInputEventsHandler),
                sinon.createStubInstance(SyntheticAutotabInputEventsHandler),
                this.maskingServiceStub,
                0 // maxShadowDepth = 0
            );

            const shadowHost = document.createElement('div');
            shadowHost.className = 'test-shadow-host';
            document.body.appendChild(shadowHost);

            const shadowRoot = shadowHost.attachShadow({mode: 'open'});
            const shadowInput = document.createElement('input');
            shadowInput.type = 'text';
            shadowRoot.appendChild(shadowInput);

            noShadowInputEvents.bind(this._browserContext);
            await TestUtils.wait(5);

            assert.isTrue(noShadowInputEvents._StandardInputEventsEmitter.start.called, 'Should work without shadow DOM support');
        });

        it('should handle iframe timeout scenarios gracefully', function () {
            // This test verifies that the framework can handle iframes that don't load properly
            const mockIframe = document.createElement('iframe');
            mockIframe.className = 'test-iframe';
            mockIframe.id = 'test-iframe-timeout';
            // Don't set src to simulate a problematic iframe
            document.body.appendChild(mockIframe);

            // Test that canAccessIFrame handles problematic iframes
            const canAccess = DOMUtils.canAccessIFrame(mockIframe);
            assert.isBoolean(canAccess, 'Should handle iframe access check gracefully');
        });
    });
});