import * as CDMap from '../../infrastructure/CDMap';
import { MessageBusEventType } from '../../events/MessageBusEventType';
import CustomElementsOpenContext from './CustomElementsOpenContext';
import CustomElementsClosedContext from './CustomElementsClosedContext';
import BrowserContextMutationObserver from '../browsercontexts/BrowserContextMutationObserver';
import CustomElementEventMessage, { CustomElementEventMessageActions } from './CustomElementEventMessage';

/**
 * Detection of custom elements (e.g. <my-custom-element> created using the
 * WebComponent and Shadow DOM API)
 * Detector should start before related event handlers (custom element) are started
 */
export default class CustomElementsDetector {
    /**
     * @param {MutationObserver} elementsMutationObserverFactory
     * @param {CDUtils} domUtils
     * @param {MessageBus} messageBus
     * @param {ConfigurationRepository} configurationRepository
     */
    constructor(domUtils, messageBus, configurationRepository) {
        this._domUtils = domUtils;
        this._messageBus = messageBus;

        // The detector use this Map to store previously detected elements so custom elements detected upon
        // the root context loading can be handled
        this._loadedCustomElements = CDMap.create();
        this._windowMutationObservers = CDMap.create();
        this._messageBus.subscribe(MessageBusEventType.MutationAddedNodes, this._processAddedNodes.bind(this));
        this._messageBus.subscribe(MessageBusEventType.MutationRemovedNodes, this._processRemovedNodes.bind(this));
        this._messageBus.subscribe(MessageBusEventType.CustomElementSubmitted, this._processSubmittedCustomElement.bind(this));
        this._browserContextMutationObserver = new BrowserContextMutationObserver(
            this._windowMutationObservers,
            this._messageBus,
            configurationRepository
        );
        // Cache results for elements we've already checked
        this.customElementCache = new WeakMap();
    }

    /**
     *
     * @returns {Array}
     */
    get customElements() {
        const customElements = [];
        this._loadedCustomElements.forEach((value, key) => {
            customElements.push(key);
        });

        return customElements;
    }

    /**
     * @param customElement
     * @returns {boolean} true if the custom element exists in cache
     */
    hasCustomElement(customElement) {
        if (this._loadedCustomElements.has(customElement)) {
            return true;
        }
        return false;
    }

    /**
     * @param customElement
     * @param {BrowserContext} browserContext
     */
    addCustomElementToLoadedList(customElement, browserContext) {
        this._loadedCustomElements.set(customElement, browserContext);
    }

    /**
     * Start custom elements detection - this should be applied on the current (self/window) only!
     * @param {BrowserContext} rootWindow
     */
    start(rootWindow) {
        this._browserContextMutationObserver.monitorWindow(rootWindow);
        this._findCustomElementsInBrowserContext(rootWindow.getDocument()).then(rootWindowCustomElements => {
            rootWindowCustomElements.forEach((element) => {
                this._processNewElement(element);
            });
        });
    }

    stop() {
        this.customElementCache = new WeakMap();
        this._windowMutationObservers.forEach((value) => {
            value.disconnect();
        });
    }

    /**
     * Support the processing of a custom element that it's
     * shadowRoot is closed/inaccessible when obtained using the SDKs customer's API.
     * The element itself is the actual shadowRoot property of the
     * requested custom element.
     * @param element
     * @private
     */
    _processSubmittedCustomElement(element) {
        if (this._loadedCustomElements.has(element)) {
            return;
        }

        this._addCustomElement(element, new CustomElementsClosedContext(element), 'closed');
    }

    /**
     * Process a newly added custom element context
     * @override
     * @param context
     * @private
     */
    _processNewElement(element) {
        // Ignore previously added custom elements
        if (this._loadedCustomElements.has(element)) {
            return;
        }

        // Nothing to do when shadowRoot is inaccessible
        if (element.shadowRoot == null) {
            // We should still report an inaccessible custom element
            // as we might respond to an external message to process the requested element
            this._messageBus.publish(MessageBusEventType.CustomElementInaccessible, element);
            return;
        }

        this._addCustomElement(element, new CustomElementsOpenContext(element));
    }

    /**
     * Append a custom element collected from the current window document
     * @param {Element} element
     * @param {BrowserContext} browserContext
     * @param {string} mode
     * @private
     */
    _addCustomElement(element, browserContext, mode = 'open') {
        // Continue to monitor the shadowRoot of the custom element
        if (mode === 'open') {
            this._browserContextMutationObserver.monitorWindow(browserContext);
        }
        // add the Custom Element to the map of loaded custom elements
        this._loadedCustomElements.set(element, browserContext);
        this._messageBus.publish(MessageBusEventType.CustomElementDetectedEvent, new CustomElementEventMessage(browserContext, CustomElementEventMessageActions.added));
    }

    /**
     * Remove and report a custom element
     * @param {Element} element
     * @private
     */
    _removeCustomElement(element) {
        const browserContextToRemove = this._loadedCustomElements.get(element);
        this._browserContextMutationObserver.unMonitorWindow(element.shadowRoot);
        if (this._loadedCustomElements.delete(element)) {
            this._messageBus.publish(MessageBusEventType.CustomElementDetectedEvent, new CustomElementEventMessage(browserContextToRemove, CustomElementEventMessageActions.removed));
        }
    }

    /**
     * Process the added nodes of a single mutation record
     * @param {NodeAddedMutationEvent} nodeAddedMutationEvent
     * @private
     */
    _processAddedNodes(nodeAddedMutationEvent) {
        nodeAddedMutationEvent.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const documentOrRoot = node.shadowRoot ? node.shadowRoot : node.ownerDocument;
                this._processNewElement(node);

                // Go over nodes which were added and check if there are custom elements in it
                this._findCustomElementsInBrowserContext(documentOrRoot).then(detectedCustomElements => {
                    detectedCustomElements.forEach((element) => {
                        this._processNewElement(element);
                    });
                });
            }
        })
    }

    /**
     * Process the removed nodes of a single mutation record
     * @param nodeRemovedMutationEvent
     * @private
     */
    _processRemovedNodes(nodeRemovedMutationEvent) {
        const removedNodes = nodeRemovedMutationEvent.removedNodes;
        let customElementsToRemove = [];
        // Go over nodes which were removed and check if there are custom elements in it
        for (let i = 0; i < removedNodes.length; i++) {
            const removedNode = removedNodes[i];
            if (!removedNode.hasChildNodes()) {
                if (this._isCustomElement(removedNode)) {
                    if (removedNode.shadowRoot) {
                        customElementsToRemove.push(removedNode);
                    }
                }
            } else {
                this._findCustomElementsInBrowserContext(removedNode).then(detectedCustomElementsToRemove => {
                    if (detectedCustomElementsToRemove.length > 0) {
                        customElementsToRemove = customElementsToRemove.concat(detectedCustomElementsToRemove);
                    }
                });
            }
        }

        if (customElementsToRemove.length === 0) return;
        customElementsToRemove.forEach((element) => {
            this._removeCustomElement(element);
        });
    }

    /**
     * Returns true if an element is a custom element
     * e.g. - it's name contains dashes ('-')
     * e.g. <my-custom-element>
     * The private DOM of the custom element may or may no be accessible - depends
     * on the mode of the WebComponent (mode: "open" VS mode: "closed")
     * @private
     *
     * Optimized _isCustomElement()
     *  Uses a Set for quick lookups (O(1) instead of O(n)).
     *  Caches previously checked elements to prevent duplicate work.
     *  Avoids unnecessary function calls.
     */
    _isCustomElement(element) {
        if (!element || typeof element.localName !== 'string') return false;

        // Use cache for repeated elements
        if (this.customElementCache.has(element)) {
            return this.customElementCache.get(element);
        }

        // Check if it's a custom element (contains '-')
        const isCustom = element.localName.includes('-');

        // Store result in cache
        this.customElementCache.set(element, isCustom);

        return isCustom;
    }

    /**
     * Query the dom for elements that has public shadowRoot attribute
     * In case the a Web Component is created in mode: closed, the shadowRoot is null
     * and there is no way to query.
     * @todo Report a private shadowRoot
     * Custom elements will be detected by querying the window context for elements with
     * occurrences of at least one dash in their names.
     * e.g. <my-custom-element>
     */
    async _findCustomElementsInBrowserContext(document) {
        let customElementsList = new Set();
        const queryElements = document.querySelectorAll('*');

        if (queryElements.length === 0) return [...customElementsList];

        // Collect Promises for processing shadow DOM elements
        let shadowPromises = [];

        queryElements.forEach(nextElement => {
            if (!this._isCustomElement(nextElement)) return;

            customElementsList.add(nextElement);

            if (nextElement.shadowRoot) {
                // Store the async result of processing the shadow DOM
                const shadowProcessing = this._findCustomElementsInBrowserContext(nextElement.shadowRoot)
                    .then(subElements => {
                        subElements.forEach(el => customElementsList.add(el));
                    });
                shadowPromises.push(shadowProcessing);
            } else {
                this._messageBus.publish(MessageBusEventType.CustomElementInaccessible, nextElement);
            }
        });

        // Wait for all shadow-root processing to complete
        await Promise.all(shadowPromises);

        return [...customElementsList];
    }
}
