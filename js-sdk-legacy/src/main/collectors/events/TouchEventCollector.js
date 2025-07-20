import DataCollector from '../DataCollector';
import { MessageBusEventType } from '../../events/MessageBusEventType';
import { IsTrustedValue } from './IsTrustedValue';
import { defaultMaskedCoordinates } from '../../core/masking/MaskingService';

const featureSettings = {
    configKey: 'isTouchEvents',
    isDefault: true,
    shouldRunPerContext: false,
    shouldRunPerSession: false,
    shouldRun: true,
    isFrameRelated: true,
    runInSlave: true,
    runInLean: true,
    runInUns: false,
    isRunning: false,
    instance: null,
};

const TouchEventIEType = {
    pointerdown: 'touchstart',
    pointerup: 'touchend',
    pointermove: 'touchmove',
    MSPointerDown: 'touchstart',
    MSPointerUp: 'touchend',
    MSPointerMove: 'touchmove',
};

export const TouchEventType = {
    touchstart: 0,
    touchmove: 1,
    touchend: 2,
    touchcancel: 3,
};

export const EventStructure = ['eventSequence', 'timestamp', 'eventType', 'isTrusted', 'elementHash', 'clientX', 'clientY',
    'touchIndex', 'touchSizeMajor', 'touchSizeMinor', 'pageX', 'pageY', 'screenX', 'screenY', 'relativeTime', 'touchPressure'];

export default class TouchEventCollector extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    constructor(utils, elements, dataQ, msgBus, maskingService, configuration) {
        super();
        this._utils = utils;
        this._dataQ = dataQ;
        this._elements = elements;
        this._msgBus = msgBus;
        this._onAllBrowsersTouchEventBinded = this._onAllBrowsersTouchEvent.bind(this);
        this._maskingService = maskingService;
        this._maxShadowDepth = configuration.getMaxShadowDepth();
        this._iframeLoadingTimeout = configuration.getIframeLoadingTimeout();
    }

    /**
     * @param {BrowserContext} browserContext
     */
    startFeature(browserContext) {
        this._bind(browserContext);
    }

    /**
     * @param {BrowserContext} browserContext
     */
    stopFeature(browserContext) {
        this._unbind(browserContext);
    }

    _addToCommunicationQueue(type, identifier, touch, e) {
        if (type === TouchEventType.touchstart || type === TouchEventType.touchend) {
            this._msgBus.publish(MessageBusEventType.TouchEvent, { action: type });
        }
        const time = this.getEventTimestamp(e);
        const isTrusted = IsTrustedValue[e.isTrusted];
        const element = this._elements.getElementHashFromEvent(e);

        const eventSeq = this._utils.StorageUtils.getAndUpdateEventSequenceNumber();

        if (this._utils.isUndefinedNull(type)) {
            type = -1;
        }

        if (this._utils.isUndefinedNull(identifier)) {
            identifier = -1;
        }
        const relativeTs = this.getTimestampFromEvent(e);
        // client - relative to edge of browser not including scrolling
        // page - relative to edge with scroll offset
        // screen - relative to the edge of the screen
        this._dataQ.addToQueue('touch_events',
            this._utils.convertToArrayByMap(EventStructure, {
                eventSequence: eventSeq,
                timestamp: time,
                eventType: type,
                isTrusted,
                elementHash: element,
                clientX: this._maskingService.shouldMaskCoordinates() ? defaultMaskedCoordinates : (touch.clientX ? Math.round(touch.clientX) : 0),
                clientY: this._maskingService.shouldMaskCoordinates() ? defaultMaskedCoordinates : (touch.clientY ? Math.round(touch.clientY) : 0),
                touchIndex: identifier,
                // duplicating the radius since it comes from mobile devices as diameter
                touchSizeMajor: touch.radiusX ? touch.radiusX * 2 : 0,
                touchSizeMinor: touch.radiusY ? touch.radiusY * 2 : 0,
                pageX: this._maskingService.shouldMaskCoordinates() ? defaultMaskedCoordinates : (touch.pageX || 0),
                pageY: this._maskingService.shouldMaskCoordinates() ? defaultMaskedCoordinates : (touch.pageY || 0),
                screenX: this._maskingService.shouldMaskCoordinates() ? defaultMaskedCoordinates : (touch.screenX || 0),
                screenY: this._maskingService.shouldMaskCoordinates() ? defaultMaskedCoordinates : (touch.screenY || 0),
                relativeTime: relativeTs,
                touchPressure: touch.force || -1,
            }));
    }

    /**
     * @param {BrowserContext} browserContext
     * @private
     */
    _bind(browserContext) {
        const currDocument = browserContext.getDocument();
        let eventsToListen;

        // FF, Chrome, Opera, iOS Safari
        if (window.TouchEvent) {
            eventsToListen = ['touchstart', 'touchmove', 'touchend', 'touchcancel'];
        } else if (window.PointerEvent) {
            // IE11, Edge, Safari (desktop)
            // Pointer events are also supported by others, but the touch is more
            // accurate in touch related while the pointer is meant to aggregate all
            // the pointer devices

            eventsToListen = ['pointerdown', 'pointermove', 'pointerup'];
        }

        this._listeningToEvents = eventsToListen;
        if (this._listeningToEvents) {
            for (let i = 0; i < this._listeningToEvents.length; i++) {
                this._utils.addEventListener(currDocument, this._listeningToEvents[i],
                    this._onAllBrowsersTouchEventBinded);
                browserContext.collectAllElementsBySelectorAsync('iframe', this._maxShadowDepth, this._iframeLoadingTimeout)
                    .then((iframes) => {
                        iframes.forEach((iframe) => {
                            if (iframe && iframe.contentDocument) {
                                this._utils.addEventListener(iframe.contentDocument, this._listeningToEvents[i],
                                    this._onAllBrowsersTouchEventBinded);
                            }
                        });
                    })

            }
        }
    }

    /**
     * @param {BrowserContext} browserContext
     * @private
     */
    _unbind(browserContext) {
        const currDocument = browserContext.getDocument();
        if (this._listeningToEvents) {
            for (let i = 0; i < this._listeningToEvents.length; i++) {
                this._utils.removeEventListener(currDocument, this._listeningToEvents[i], this._onAllBrowsersTouchEventBinded);
                browserContext.collectAllElementsBySelectorAsync('iframe', this._maxShadowDepth, this._iframeLoadingTimeout)
                    .then((iframes) => {
                        iframes.forEach((iframe) => {
                            if (iframe && iframe.contentDocument) {
                                this._utils.removeEventListener(iframe.contentDocument, this._listeningToEvents[i], this._onAllBrowsersTouchEventBinded);
                            }
                        });
                    })

            }
        }
    }

    _onAllBrowsersTouchEvent(e) {
        this._onIeTouchEvent(e);
        this._onTouchEvent(e);

        return true;
    }

    _onTouchEvent(e) {
        // prevents ie from working
        if (e.pointerType === null || e.pointerType === undefined) {
            if (e.changedTouches !== undefined) {
                const type = TouchEventType[e.type];
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const touch = e.changedTouches[i];
                    const identifier = touch.identifier % 10000; // we want to shrink it to short
                    this._addToCommunicationQueue(type, identifier, touch, e);
                }
            }
        }
    }

    _onIeTouchEvent(e) {
        // don't take the event if it's a mouse event. different syntax between ie 10 and 11
        if (e.pointerType != null) {
            if (e.pointerType === 'touch' || e.pointerType === 'pen'
                || e.pointerType === e.MSPOINTER_TYPE_TOUCH
                || e.pointerType === e.MSPOINTER_TYPE_PEN) {
                const touchLikeType = TouchEventIEType[e.type] || 'touchcancel';

                const identifier = e.pointerId ? e.pointerId % 10000 : 0; // we want to shrink it to short
                const type = TouchEventType[touchLikeType];
                this._addToCommunicationQueue(type, identifier, e, e);
            }
        }
    }
}
