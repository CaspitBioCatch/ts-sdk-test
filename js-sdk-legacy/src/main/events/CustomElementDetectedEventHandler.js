import { MessageBusEventType } from './MessageBusEventType';
import { CustomElementEventMessageActions } from '../core/customelements/CustomElementEventMessage';

/**
 * Instances of this class handle custom element detection related events that are emitted upon detecting
 * custom elements on the root window or in response to mutation events
 */
export class CustomElementDetectedEventHandler {
    /**
     * @param {BrowserContextsCache} browserContextsCache
     * @param {FeatureService} featureService
     * @param {MessageBus} messageBus
     */
    constructor(browserContextsCache, featureService, messageBus) {
        this._browserContextsCache = browserContextsCache;
        this._messageBus = messageBus;
        this._featureService = featureService;

        this._messageBus.subscribe(MessageBusEventType.CustomElementDetectedEvent, this._handle.bind(this));
    }

    /**
     * Responds to MessageBusEventType.CustomElementDetectedEvent events
     * @param {CustomElementEventMessage} message
     * @private
     */
    _handle(message) {
        const browserContext = message.browserContext;
        const action = message.message;

        if (action === CustomElementEventMessageActions.added) {
            this._handleCustomElementAdded(browserContext);
        } else if (action === CustomElementEventMessageActions.removed) {
            this._handleCustomElementRemoved(browserContext);
        }
    }

    /**
     * @param {BrowserContext} browserContext
     * @private
     */
    _handleCustomElementAdded(browserContext) {
        if (!this._browserContextsCache.exists(browserContext.Context)) {
            this._browserContextsCache.addBrowserContext(browserContext);
        }
        this._featureService.runFeaturesOnBrowserContext(browserContext);
    }

    /**
     * @param {BrowserContext} browserContext
     * @private
     */
    _handleCustomElementRemoved(browserContext) {
        this._featureService.stopFeaturesOnBrowserContextRemove(browserContext);
        this._browserContextsCache.remove(browserContext.Context);
    }
}
