/**
 * Instances of this class can monitor and observe window mutations
 * Directly used by FramesDetector and CustomElementsDetector to respond DOM mutations
 * when detecting browser contexts that expose custom access to their private DOM.
 */
import { MessageBusEventType } from '../../events/MessageBusEventType';
import ElementsMutationObserverFactory from "./ElementsMutationObserverFactory";

export default class BrowserContextMutationObserver {
    /**
     *
     * @param elementsMutationObserverFactory
     * @param windowMutationObservers
     * @param messageBus
     * @param configurationRepository
     */
    constructor(windowMutationObservers, messageBus, configurationRepository) {
        this._windowMutationObservers = windowMutationObservers;
        this._messageBus = messageBus;
        this._configurationRepository = configurationRepository;
        this._messageBus.subscribe(MessageBusEventType.BrowserContextAdded, this._processNewContext.bind(this));
        this._elementsMutationObserverFactory = new ElementsMutationObserverFactory();
    }

    /**
     * A designated observer that handles newly added contexts
     * @private
     * @param browserContext
     */
    _processNewContext(browserContext) {
        this.monitorWindow(browserContext);
    }

    /**
     *
     * @param {BrowserContext} browserContext
     * @public
     */
    monitorWindow(browserContext) {
        if (this._windowMutationObservers.has(browserContext)) {
            return;
        }

        const elementsMutationObserver = this._elementsMutationObserverFactory.create(browserContext, self.MutationObserver, this._configurationRepository);
        elementsMutationObserver.observe(browserContext.getDocument());
        elementsMutationObserver.nodesAdded.subscribe(this._nodesAddedMutationObserved.bind(this));
        elementsMutationObserver.nodesRemoved.subscribe(this._nodesRemovedMutationObserved.bind(this));
        this._windowMutationObservers.set(browserContext, elementsMutationObserver);
    }

    /**
     *
     * @param {ShadowRoot} browserContext
     * @public
     */
    unMonitorWindow(browserContext) {
        const mutationObserver = this._windowMutationObservers.get(browserContext);
        if (mutationObserver) {
            mutationObserver.nodesAdded.unsubscribe(this._nodesAddedMutationObserved.bind(this));
            mutationObserver.nodesRemoved.unsubscribe(this._nodesRemovedMutationObserved.bind(this));
            mutationObserver.disconnect();
        }

        this._windowMutationObservers.delete(browserContext);
    }

    /**
     * Callback once a nodes added mutation\s is observed
     * @param nodesAddedMutationEvent
     * @private
     */
    _nodesAddedMutationObserved(nodesAddedMutationEvent) {
        this._messageBus.publish(MessageBusEventType.MutationAddedNodes, nodesAddedMutationEvent);
    }

    /**
     * Callback once a nodes removed mutation\s is observed
     * @param nodesRemovedMutationEvent
     * @private
     */
    _nodesRemovedMutationObserved(nodesRemovedMutationEvent) {
        this._messageBus.publish(MessageBusEventType.MutationRemovedNodes, nodesRemovedMutationEvent);
    }
}
