import sinon from 'sinon';
import CustomElementsDetector from '../../../../../src/main/core/customelements/CustomElementsDetector';
import MessageBus from '../../../../../src/main/technicalServices/MessageBus';
import ConfigurationRepository from '../../../../../src/main/core/configuration/ConfigurationRepository';
import BrowserContextMutationObserver from '../../../../../src/main/core/browsercontexts/BrowserContextMutationObserver';
import { MessageBusEventType } from '../../../../../src/main/events/MessageBusEventType';

describe('CustomElementsDetector Tests', function () {
    let sandbox, messageBus, configurationRepository, customElementsDetector, windowMutationObservers;

    beforeEach(function () {
        sandbox = sinon.createSandbox();

        // ✅ Stub MessageBus
        messageBus = new MessageBus();
        sandbox.stub(messageBus, 'subscribe');
        sandbox.stub(messageBus, 'publish');

        // ✅ Stub ConfigurationRepository
        configurationRepository = new ConfigurationRepository();
        sandbox.stub(configurationRepository, 'get')
            .withArgs('mutationMaxChunkSize').returns(100)
            .withArgs('mutationChunkDelayMs').returns(10);

        // ✅ Initialize windowMutationObservers as a Map
        windowMutationObservers = new Map();

        // ✅ Create Instance of `CustomElementsDetector` with Stubs
        customElementsDetector = new CustomElementsDetector(
            {},
            messageBus,
            configurationRepository
        );
    });

    afterEach(function () {
        sandbox.restore();
    });

    it('Constructor initializes with correct dependencies', function () {
        expect(customElementsDetector._messageBus).to.equal(messageBus);
        expect(customElementsDetector._domUtils).to.deep.equal({});
        expect(customElementsDetector._loadedCustomElements).to.be.an.instanceof(Map);
    });

    it('Calls messageBus.subscribe during initialization', function () {
        expect(messageBus.subscribe.calledWith(MessageBusEventType.MutationAddedNodes)).to.be.true;
        expect(messageBus.subscribe.calledWith(MessageBusEventType.MutationRemovedNodes)).to.be.true;
        expect(messageBus.subscribe.calledWith(MessageBusEventType.CustomElementSubmitted)).to.be.true;
    });

    it('`hasCustomElement()` correctly detects custom elements', function () {
        const fakeElement = {};
        customElementsDetector._loadedCustomElements.set(fakeElement, {});

        expect(customElementsDetector.hasCustomElement(fakeElement)).to.be.true;
        expect(customElementsDetector.hasCustomElement({})).to.be.false;
    });

    it('`addCustomElementToLoadedList()` stores elements correctly', function () {
        const fakeElement = {};
        const fakeContext = {};

        customElementsDetector.addCustomElementToLoadedList(fakeElement, fakeContext);
        expect(customElementsDetector._loadedCustomElements.has(fakeElement)).to.be.true;
    });

    it('`start()` initializes mutation observer and processes elements', function () {
        // Create a fake DOM document
        const fakeDocument = {
            querySelectorAll: () => [],  // Returns empty NodeList
            body: document.createElement('body')  // A valid Node
        };

        // Stub `getDocument()` to return a real document
        const rootWindowMock = {
            getDocument: sandbox.stub().returns(fakeDocument.body),
            window: window
        };
        // Stub methods inside `BrowserContextMutationObserver`
        sandbox.spy(BrowserContextMutationObserver.prototype, 'monitorWindow');

        sandbox.spy(customElementsDetector, '_processNewElement');
        customElementsDetector.start(rootWindowMock);

        expect(BrowserContextMutationObserver.prototype.monitorWindow.calledWith(rootWindowMock)).to.be.true;
        expect(customElementsDetector._processNewElement.called).to.be.false;
    });

    it('`stop()` clears cache and disconnects observers', function () {
        const fakeObserver = { disconnect: sandbox.stub() };
        customElementsDetector._windowMutationObservers.set('key', fakeObserver);

        customElementsDetector.stop();

        expect(customElementsDetector.customElementCache).to.be.an.instanceof(WeakMap);
        expect(fakeObserver.disconnect.called).to.be.true;
    });

    it('`_processNewElement()` processes elements with shadowRoots', function () {
        const fakeElement = { shadowRoot: {} };
        sandbox.spy(customElementsDetector, '_addCustomElement');
        sandbox.stub(BrowserContextMutationObserver.prototype, 'monitorWindow').callsFake((windowContext) => {
            // console.log("[FAKE MONITOR WINDOW] Called with:", windowContext);
        });


        customElementsDetector._processNewElement(fakeElement);
        expect(customElementsDetector._addCustomElement.called).to.be.true;
    });

    it('`_processNewElement()` publishes event if element is inaccessible', function () {
        const fakeElement = { shadowRoot: null };

        customElementsDetector._processNewElement(fakeElement);
        expect(messageBus.publish.calledWith(MessageBusEventType.CustomElementInaccessible, fakeElement)).to.be.true;
    });

    it('`_removeCustomElement()` removes elements and publishes event', function () {
        const fakeElement = { shadowRoot: {} };
        customElementsDetector._loadedCustomElements.set(fakeElement, {});

        customElementsDetector._removeCustomElement(fakeElement);

        expect(customElementsDetector._loadedCustomElements.has(fakeElement)).to.be.false;
        expect(messageBus.publish.calledWith(MessageBusEventType.CustomElementDetectedEvent)).to.be.true;
    });

    it('`_isCustomElement()` correctly detects elements', function () {
        expect(customElementsDetector._isCustomElement({ localName: 'custom-element' })).to.be.true;
        expect(customElementsDetector._isCustomElement({ localName: 'div' })).to.be.false;
    });

    it('`_findCustomElementsInBrowserContext()` detects elements in document', function () {
        const fakeDocument = {
            querySelectorAll: () => [{ localName: 'custom-element' }, { localName: 'div' }]
        };

        customElementsDetector._findCustomElementsInBrowserContext(fakeDocument).then(result => {
            expect(result.length).to.equal(1);
        });
    });
});