// eslint-disable-next-line max-classes-per-file
import DataCollector from '../DataCollector';
import { IsTrustedValue } from './IsTrustedValue';
import Log from '../../technicalServices/log/Logger';
import { MessageBusEventType } from '../../events/MessageBusEventType';
import { ConfigurationFields } from '../../core/configuration/ConfigurationFields';

const featureSettings = {
    configKey: 'isWindowEvents',
    isDefault: true,
    shouldRunPerContext: false,
    shouldRunPerSession: false,
    shouldRun: true,
    isFrameRelated: false,
    runInUns: false,
    runInSlave: false,
    runInLean: false,
    isRunning: false,
    instance: null,
};

export const WindowEventType = {
    DOMContentLoaded: 0,
    scroll: 1,
    resize: 2,
    focus: 3,
    blur: 4,
    tabFocus: 5,
    tabBlur: 6,
};

export const EventStructure = ['eventSequence', 'timestamp', 'eventType', 'isTrusted', 'screenWidth', 'screenHeight',
    'clientWidth', 'clientHeight', 'documentWidth', 'documentHeight', 'scrollTop', 'scrollLeft', 'windowInnerWidth',
    'windowInnerHeight', 'windowOuterWidth', 'windowOuterHeight'];

export default class WindowEventCollector extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    static get Builder() {
        class Builder {
            constructor(configurationRepository, utils, dataQ) {
                this.configurationRepository = configurationRepository;
                this.utils = utils;
                this.dataQueue = dataQ;
            }

            withMessageBus(messageBus) {
                this.messageBus = messageBus;
                return this;
            }

            withFocusEventEmitter(focusEventEmitter) {
                this.focusEventEmitter = focusEventEmitter;
                return this;
            }

            withBlurEventEmitter(blurEventEmitter) {
                this.blurEventEmitter = blurEventEmitter;
                return this;
            }

            withResizeEventEmitter(resizeEventEmitter) {
                this.resizeEventEmitter = resizeEventEmitter;
                return this;
            }

            withDOMContentLoadedEventEmitter(domContentLoadedEventEmitter) {
                this.domContentLoadedEventEmitter = domContentLoadedEventEmitter;
                return this;
            }

            withVisibilityChangeEventEmitter(visibilityChangeEventEmitter) {
                this.visibilityChangeEventEmitter = visibilityChangeEventEmitter;
                return this;
            }

            withScrollEventEmitter(scrollEventEmitter) {
                this.scrollEventEmitter = scrollEventEmitter;
                return this;
            }

            build() {
                return new WindowEventCollector(this);
            }
        }

        return Builder;
    }

    constructor(builder) {
        super();
        this._configurationRepository = builder.configurationRepository;
        this._utils = builder.utils;
        this._dataQueue = builder.dataQueue;
        this._messageBus = builder.messageBus;
        this._focusEventEmitter = builder.focusEventEmitter;
        this._blurEventEmitter = builder.blurEventEmitter;
        this._resizeEventEmitter = builder.resizeEventEmitter;
        this._domContentLoadedEventEmitter = builder.domContentLoadedEventEmitter;
        this._visibilityChangeEventEmitter = builder.visibilityChangeEventEmitter;
        this._scrollEventEmitter = builder.scrollEventEmitter;
    }

    /**
     * @param {BrowserContext} browserContext
     */
    startFeature = (browserContext) => {
        try {
            this._resizeEventEmitter.start(browserContext.Context);
            this._messageBus.subscribe(MessageBusEventType.ResizeEvent, this._onWindowEvent);

            this._focusEventEmitter.start(browserContext.Context);
            this._messageBus.subscribe(MessageBusEventType.FocusEvent, this._onWindowEvent);

            this._blurEventEmitter.start(browserContext.Context);
            this._messageBus.subscribe(MessageBusEventType.BlurEvent, this._onWindowEvent);

            this._domContentLoadedEventEmitter.start(browserContext.getDocument());
            this._messageBus.subscribe(MessageBusEventType.DOMContentLoadedEvent, this._onWindowEvent);

            this._visibilityChangeEventEmitter.start(browserContext.getDocument());
            this._messageBus.subscribe(MessageBusEventType.VisibilityChangeEvent, this._onWindowEvent);

            if (this._configurationRepository.get(ConfigurationFields.isScrollCollect)) {
                this._scrollEventEmitter.start(browserContext.Context);
                this._messageBus.subscribe(MessageBusEventType.ScrollEvent, this._onWindowEvent);
            }
        } catch (err) {
            Log.error(`Failed starting the WindowEventCollector. msg: ${err.message}`, err);
        }
    };

    /**
     * @param {BrowserContext} browserContext
     */
    stopFeature = (browserContext) => {
        try {
            this._resizeEventEmitter.stop(browserContext.Context);
            this._messageBus.unsubscribe(MessageBusEventType.ResizeEvent, this._onWindowEvent);

            this._focusEventEmitter.stop(browserContext.Context);
            this._messageBus.unsubscribe(MessageBusEventType.FocusEvent, this._onWindowEvent);

            this._blurEventEmitter.stop(browserContext.Context);
            this._messageBus.unsubscribe(MessageBusEventType.BlurEvent, this._onWindowEvent);

            this._domContentLoadedEventEmitter.stop(browserContext.getDocument());
            this._messageBus.unsubscribe(MessageBusEventType.DOMContentLoadedEvent, this._onWindowEvent);

            this._visibilityChangeEventEmitter.stop(browserContext.getDocument());
            this._messageBus.unsubscribe(MessageBusEventType.VisibilityChangeEvent, this._onWindowEvent);

            if (this._configurationRepository.get(ConfigurationFields.isScrollCollect)) {
                this._scrollEventEmitter.stop(browserContext.Context);
                this._messageBus.unsubscribe(MessageBusEventType.ScrollEvent, this._onWindowEvent);
            }
        } catch (err) {
            Log.error(`Failed stopping the ClipboardEvents feature. msg: ${err.message}`, err);
        }
    }

    /**
     * @param {BrowserContext} browserContext
     */
    updateFeatureConfig = (browserContext) => {
        if (!this._configurationRepository.get(ConfigurationFields.isScrollCollect)) {
            this._scrollEventEmitter.stop(browserContext.Context);
            this._messageBus.unsubscribe(MessageBusEventType.ScrollEvent, this._onWindowEvent);
        } else if (this._configurationRepository.get(ConfigurationFields.isScrollCollect)) {
            this._scrollEventEmitter.start(browserContext.Context);
            this._messageBus.subscribe(MessageBusEventType.ScrollEvent, this._onWindowEvent);
        }
    };

    _onWindowEvent = (event) => {
        try {
            this._sendToQueue(event);
        } catch (e) {
            Log.error(`An error has occurred while sending window event. ${e.message}`, e);
        }
    };

    _sendToQueue = (e) => {
        if (!e) {
            throw new Error('Invalid window event received.');
        }

        let time;
        let isTrusted = IsTrustedValue[undefined];
        if (e.type === 'DOMContentLoaded') {
            time = new Date().getTime();
        } else {
            time = this.getEventTimestamp(e);
            isTrusted = IsTrustedValue[e.isTrusted];
        }
        // if for performance optimization
        if (Log.isDebug()) {
            Log.trace('got event ' + e.type + ' at time ' + time);
            Log.trace('adding to queue - screen(width,height): ' + screen.width + ',' + screen.height
                + ' window(width,height): ' + window.innerWidth + ',' + window.innerHeight);
        }

        const eventSeq = this._utils.StorageUtils.getAndUpdateEventSequenceNumber();
        const type = e.type !== 'visibilitychange' ? e.type
            : document.visibilityState === 'hidden' ? 'tabBlur' : 'tabFocus';
        let eventType = WindowEventType[type];
        if (eventType == null || eventType === undefined) {
            eventType = -1;
        }

        this._dataQueue.addToQueue('window_events',
            this._utils.convertToArrayByMap(EventStructure,
                {
                    eventType,
                    eventSequence: eventSeq,
                    timestamp: time,
                    screenWidth: screen.width ? Math.round(screen.width) : -1,
                    screenHeight: screen.height ? Math.round(screen.height) : -1,
                    clientWidth: window.innerWidth ? Math.round(window.innerWidth) : -1,
                    clientHeight: window.innerHeight ? Math.round(window.innerHeight) : -1,
                    documentWidth: document.body && document.body.clientWidth ? Math.round(document.body.clientWidth) : -1,
                    documentHeight: document.body && document.body.clientHeight ? Math.round(document.body.clientHeight) : -1,
                    scrollTop: document.body && document.body.scrollTop ? Math.round(document.body.scrollTop) : 0,
                    scrollLeft: document.body && document.body.scrollLeft ? Math.round(document.body.scrollLeft) : 0,
                    windowInnerWidth: window.innerWidth ? Math.round(window.innerWidth) : -1,
                    windowInnerHeight: window.innerHeight ? Math.round(window.innerHeight) : -1,
                    windowOuterWidth: window.outerWidth ? Math.round(window.outerWidth) : -1,
                    windowOuterHeight: window.outerHeight ? Math.round(window.outerHeight) : -1,
                    isTrusted,
                }));
    }
}
