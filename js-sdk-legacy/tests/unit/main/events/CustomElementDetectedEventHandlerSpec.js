import { assert } from 'chai';
import TestFeatureSupport from '../../../TestFeatureSupport';
import TestDomUtils from '../../../TestDomUtils';
import { TestUtils } from '../../../TestUtils';
import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import BrowserContext from '../../../../src/main/core/browsercontexts/BrowserContext';
import FeatureService from '../../../../src/main/collectors/FeatureService';
import BrowserContextsCache from '../../../../src/main/core/browsercontexts/BrowserContextsCache';
import { CustomElementDetectedEventHandler } from '../../../../src/main/events/CustomElementDetectedEventHandler';
import { MessageBusEventType } from '../../../../src/main/events/MessageBusEventType';
import CustomElementEventMessage, { CustomElementEventMessageActions } from '../../../../src/main/core/customelements/CustomElementEventMessage';
import CustomElementsOpenContext from '../../../../src/main/core/customelements/CustomElementsOpenContext';

describe('CustomElementDetectedEventHandler Tests', function () {
   before(function () {
       if (!TestFeatureSupport.isCustomElementsSupported()) {
           this.skip();
           return;
       }

       // A custom element cannot be defined more than once against a single window.customElements registry.
       // Therefore this particular open mode custom elements definitions must remain here.
       this.openModeCustomElement = TestDomUtils.createCustomElement('cedeh-custom-element', 'open');
       this.openModeCustomElement1 = TestDomUtils.createCustomElement('cedeh-custom-element-one', 'open');
       this.openModeCustomElement2 = TestDomUtils.createCustomElement('cedeh-custom-element-two', 'open');
   });

   beforeEach(function () {
       this.sandbox = sinon.createSandbox();
       this.messageBus = new MessageBus();
       this.messageBusPublishSpy = this.sandbox.spy(this.messageBus, 'publish');
       this.windowBrowserContext = new BrowserContext(self);

       this.featureService = sinon.createStubInstance(FeatureService);
       this.browserContextsCache = new BrowserContextsCache();
       this.browserContextsCacheSpy = sinon.spy(this.browserContextsCache);
       this.customElementDetectorEventHandler = new CustomElementDetectedEventHandler(this.browserContextsCache, this.featureService, this.messageBus);
   });

   afterEach(function () {
       this.sandbox = null;
       this.messageBusPublishSpy = null;
       this.featureService = null;
       this.browserContextsCache = null;
       this.customElementDetectorEventHandler = null;
   });

   it('Correctly handle the MessageBusEventType.CustomElementDetectedEvent event in response to elements being added', async function () {
       const someCustomElementContext = new CustomElementsOpenContext(this.openModeCustomElement);
       const expectedMessage = new CustomElementEventMessage(someCustomElementContext, CustomElementEventMessageActions.added);
       this.messageBus.publish(MessageBusEventType.CustomElementDetectedEvent, expectedMessage);
       assert.isTrue(this.featureService.runFeaturesOnBrowserContext.calledWith(someCustomElementContext));
       assert.equal(this.browserContextsCache.browserContexts.length, 1);
   });

   it('Correctly handle the MessageBusEventType.CustomElementDetectedEvent event in response to elements being removed', async function () {
       const someCustomElementContext = new CustomElementsOpenContext(this.openModeCustomElement);
       const expectedMessageAdded = new CustomElementEventMessage(someCustomElementContext, CustomElementEventMessageActions.added);
       this.messageBus.publish(MessageBusEventType.CustomElementDetectedEvent, expectedMessageAdded);

       await TestUtils.wait(1000);

       const expectedMessageRemoved = new CustomElementEventMessage(someCustomElementContext, CustomElementEventMessageActions.removed);
       this.messageBus.publish(MessageBusEventType.CustomElementDetectedEvent, expectedMessageRemoved);

       await TestUtils.waitForNoAssertion(() => {
           assert.isTrue(this.featureService.stopFeaturesOnBrowserContextRemove.calledWith(someCustomElementContext));
           assert.equal(this.browserContextsCache.browserContexts.length, 0);
       });
   });

   it('And now for something completely different - publishing multiple custom elements', async function () {
       const someCustomElementContext = new CustomElementsOpenContext(this.openModeCustomElement);
       const someCustomElementContext1 = new CustomElementsOpenContext(this.openModeCustomElement1);
       const someCustomElementContext2 = new CustomElementsOpenContext(this.openModeCustomElement2);

       const expectedMessage = new CustomElementEventMessage(someCustomElementContext, CustomElementEventMessageActions.added);
       const expectedMessage1 = new CustomElementEventMessage(someCustomElementContext1, CustomElementEventMessageActions.added);
       const expectedMessage2 = new CustomElementEventMessage(someCustomElementContext2, CustomElementEventMessageActions.added);
       this.messageBus.publish(MessageBusEventType.CustomElementDetectedEvent, expectedMessage);
       this.messageBus.publish(MessageBusEventType.CustomElementDetectedEvent, expectedMessage1);
       this.messageBus.publish(MessageBusEventType.CustomElementDetectedEvent, expectedMessage2);

       await TestUtils.waitForNoAssertion(() => {
           assert.isTrue(this.featureService.runFeaturesOnBrowserContext.calledWith(someCustomElementContext));
           assert.isTrue(this.featureService.runFeaturesOnBrowserContext.calledWith(someCustomElementContext1));
           assert.isTrue(this.featureService.runFeaturesOnBrowserContext.calledWith(someCustomElementContext2));
           assert.equal(this.browserContextsCache.browserContexts.length, 3);
       });
   });
});
