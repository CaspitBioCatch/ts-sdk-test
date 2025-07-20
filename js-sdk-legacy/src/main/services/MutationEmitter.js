import Log from '../technicalServices/log/Logger';
import { MessageBusEventType } from '../events/MessageBusEventType';
/**
 * Emit mutation observer events/mutations.
 * Started by Element related data collectors
 */
export default class MutationEmitter {
    constructor(messageBus) {
        this._messageBus = messageBus;
        if (typeof this._messageBus !== 'object') {
            throw new Error('Bootstrap aborted! MessageBus missing for MutationEmitter');
        }
        this._documentObservers = new WeakMap();
    }

    /**
     * @param {BrowserContext} browserContext
     */
    startObserver(browserContext) {
        const document = browserContext.getDocument();

        if (this._documentObservers.has(document)) return;

        const nextObserver = new window.MutationObserver((mutations) => {
            try {
                for (let i = 0; i < mutations.length; i++) {
                    const mutation = mutations[i];
                    if (mutation.addedNodes.length > 0) {
                        this.handleMutationEvent(mutation, browserContext);
                        break;
                    }
                }
            } catch (e) {
                Log.error(`An error has occurred: ${e.message}`);
            }
        });

        nextObserver.observe(document, { childList: true, subtree: true });

        this._documentObservers.set(document, { instance: nextObserver });
    }

    /**
     * @param {BrowserContext} browserContext
     */
    stopObserver(browserContext) {
        const document = browserContext.getDocument();

        let observerInstance;
        // eslint-disable-next-line
        if (this._documentObservers.has(document) && (observerInstance = this._documentObservers.get(document))) {
            observerInstance.instance && observerInstance.instance.disconnect();
            this._documentObservers.delete(document);
        }
    }

    /**
     *
     * @param mutation
     * @param {BrowserContext} browserContext
     */
    handleMutationEvent = (mutation, browserContext) => {
        mutation && browserContext
        && this._messageBus.publish(MessageBusEventType.MutationSingleEvent, {
            mutation,
            browserContext,
        });
    }
}
