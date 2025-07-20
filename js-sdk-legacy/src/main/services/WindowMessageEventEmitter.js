import { MessageBusEventType } from '../events/MessageBusEventType';

/**
 * Registers and emits window "message" events which are registered
 * on windows/frames
 */
export default class WindowMessageEventEmitter {
    // User arguments() to dynamically extract the params names and have the container inject the dependencies based on
    // their keys
    constructor(messageBus, EventAggregator) {
        this._messageBus = messageBus;
        this._EventAggregator = EventAggregator;
        this._windowListeners = new WeakMap();
        this.defaultPostMessageEventListener = [
            { event: 'message', handler: this.handleWindowMessage },
        ];
    }

    /**
     * @param {BrowserContext} browserContext
     */
    startObserver(browserContext) {
        if (this._windowListeners.has(browserContext.Context)) return;

        this.defaultPostMessageEventListener.forEach((defaultEvent) => {
            this._EventAggregator.addEventListener(browserContext.Context, defaultEvent.event, defaultEvent.handler);
        });
        this._windowListeners.set(browserContext.Context, {
            isBinded: true,
            listeners: [
                this.handleWindowMessage,
            ],
        });
    }

    /**
     * @param {BrowserContext} browserContext
     */
    stopObserver(browserContext) {
        const windowBinding = this._windowListeners.get(browserContext.Context);

        if (!windowBinding || !windowBinding.isBinded) {
            return;
        }

        this.defaultPostMessageEventListener.forEach((defaultEvent) => {
            this._EventAggregator.removeEventListener(browserContext.Context, defaultEvent.event, defaultEvent.handler);
        });
        this._windowListeners.delete(browserContext.Context);
    }

    handleWindowMessage = (message) => {
        message && this._messageBus.publish(MessageBusEventType.WindowMessageEvent, {
            message,
        });
    }
}
