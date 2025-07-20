/**
 * Defines the maximum distance in pixels that a touch pad touch can move
 * before being released for it to be considered a tap (click) as opposed
 * to a hover movement gesture.
 */
import DataCollector from '../DataCollector';
import { IsTrustedValue } from './IsTrustedValue';
import Log from '../../technicalServices/log/Logger';
import { defaultMaskedCoordinates } from '../../core/masking/MaskingService';

const featureSettings = {
    configKey: 'isTapEvents',
    isDefault: false,
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

const TAP_MAX_SLOP = 20;
/**
 * Defines the duration in milliseconds we will wait to see if a touch event
 * is a tap or a scroll. If the user does not move within this interval, it is
 * considered to be a tap.
 */
// const TAP_TIMEOUT = 100;
/**
 * Defines the default duration in milliseconds before a press turns into
 * a long press
 */
const LONG_PRESS_TIMEOUT = 500;

export const TapEventStructure = ['eventSequence', 'timestamp', 'screenX', 'screenY', 'pageX', 'pageY', 'clientX', 'clientY',
    'isTrusted', 'elementHash', 'touchIndex', 'touchSizeMajor', 'touchSizeMinor'];

export const LongPressEventStructure = ['eventSequence', 'timestamp', 'screenX', 'screenY', 'pageX', 'pageY', 'clientX', 'clientY',
    'isTrusted', 'elementHash', 'touchIndex', 'touchSizeMajor', 'touchSizeMinor'];

export default class TapEventCollector extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    constructor(configurationRepository, utils, elements, dataQ, maskingService, configuration) {
        super();
        this._configurationRepository = configurationRepository;
        this._utils = utils;
        this._dataQ = dataQ;
        this._elements = elements;
        this._activeTouchActions = {};
        this._maskingService = maskingService;

        this._tapMaxSlop = this._configurationRepository.get('tapEventsTapMaxSlop') || TAP_MAX_SLOP;
        this._longPressTimeout = this._configurationRepository.get('tapEventsLongPressTimeout') || LONG_PRESS_TIMEOUT;

        this._handleStartEventBind = this._handleStartEvent.bind(this);
        this._handleMoveEventBind = this._handleMoveEvent.bind(this);
        this._handleEndEventBind = this._handleEndEvent.bind(this);
        this._handleCancelEventBind = this._handleCancelEvent.bind(this);

        this._eventDefinitions = TapEventCollector.getSupportedTouchEvents();
        this._maxShadowDepth = configuration.getMaxShadowDepth();
        this._iframeLoadingTimeout = configuration.getIframeLoadingTimeout();
    }

    /**
     * @param {BrowserContext} browserContext
     */
    startFeature(browserContext) {
        this._bind(browserContext);
    }

    /*
     * @param {BrowserContext} browserContext
     */
    stopFeature(browserContext) {
        this._unbind(browserContext);
    }

    updateFeatureConfig() {
        this._tapMaxSlop = this._configurationRepository.get('tapEventsTapMaxSlop') !== undefined
            ? this._configurationRepository.get('tapEventsTapMaxSlop') : this._tapMaxSlop;
        this._longPressTimeout = this._configurationRepository.get('tapEventsLongPressTimeout') !== undefined
            ? this._configurationRepository.get('tapEventsLongPressTimeout') : this._longPressTimeout;
    }

    static getSupportedTouchEvents() {
        // FF, Chrome, Opera, iOS Safari
        if (window.TouchEvent) {
            return {
                startEvent: 'touchstart',
                moveEvent: 'touchmove',
                endEvent: 'touchend',
                cancelEvent: 'touchcancel',
            };
        }

        // IE11, Edge, Safari (desktop)
        // Pointer events are also supported by others, but the touch is more
        // accurate in touch related while the pointer is meant to aggregate all
        // the pointer devices
        if (window.PointerEvent) {
            return {
                startEvent: 'pointerdown',
                moveEvent: 'pointermove',
                endEvent: 'pointerup',
                cancelEvent: 'pointercancel',
            };
        }

        Log.debug('TapEvents:_createEventsToListenList - No touch support for browser.');
    }

    /**
     * @param {BrowserContext} browserContext
     * @private
     */
    _bind(browserContext) {
        if (!this._eventDefinitions) {
            Log.debug('TapEvents:_bind - No event definitions. Might be a legacy browser. Aborting bind operation.');
            return;
        }

        const currDocument = browserContext.getDocument();
        this._addEventListeners(currDocument)
        browserContext.collectAllElementsBySelectorAsync('iframe', this._maxShadowDepth, this._iframeLoadingTimeout)
            .then((iframes) => {
                iframes.forEach((iframe) => {
                    if (iframe && iframe.contentDocument) {
                        this._addEventListeners(iframe.contentDocument)
                    }
                });
            })


    }

    _addEventListeners(currDocument) {
        this._utils.addEventListener(currDocument, this._eventDefinitions.startEvent, this._handleStartEventBind);
        this._utils.addEventListener(currDocument, this._eventDefinitions.moveEvent, this._handleMoveEventBind);
        this._utils.addEventListener(currDocument, this._eventDefinitions.endEvent, this._handleEndEventBind);
        this._utils.addEventListener(currDocument, this._eventDefinitions.cancelEvent, this._handleCancelEventBind);
    }

    /**
     * @param {BrowserContext} browserContext
     * @private
     */
    _unbind(browserContext) {
        if (!this._eventDefinitions) {
            return;
        }

        const currDocument = browserContext.getDocument();
        this._removeEventListeners(currDocument)
        browserContext.collectAllElementsBySelectorAsync('iframe', this._maxShadowDepth, this._iframeLoadingTimeout)
            .then((iframes) => {
                iframes.forEach((iframe) => {
                    if (iframe && iframe.contentDocument) {
                        this._removeEventListeners(iframe.contentDocument)
                    }
                });
            })

    }

    _removeEventListeners(currDocument) {
        this._utils.removeEventListener(currDocument, this._eventDefinitions.startEvent, this._handleStartEventBind);
        this._utils.removeEventListener(currDocument, this._eventDefinitions.moveEvent, this._handleMoveEventBind);
        this._utils.removeEventListener(currDocument, this._eventDefinitions.endEvent, this._handleEndEventBind);
        this._utils.removeEventListener(currDocument, this._eventDefinitions.cancelEvent, this._handleCancelEventBind);
    }

    _handleStartEvent(e) {
        const eventData = this._getEventData(e);

        for (let i = 0; i < eventData.length; i++) {
            // Save the state of the active touch operations so we can make decisions when tap is ending
            this._activeTouchActions[eventData[i].identifier] = {
                startTime: this.getEventTimestamp(),
                startX: eventData[i].touchData.pageX,
                startY: eventData[i].touchData.pageY,
                offsetX: 0,
                offsetY: 0,
            };
        }
    }

    _handleMoveEvent(e) {
        const eventData = this._getEventData(e);

        for (let i = 0; i < eventData.length; i++) {
            const activeTouchAction = this._activeTouchActions[eventData[i].identifier];

            // If we don't have previous knowledge of this touch we skip it...
            if (!activeTouchAction) {
                continue;
            }

            // Calculate the move offset from the start point. In the End event we will see if we
            // need to discard this because the offset is too big
            activeTouchAction.offsetX = Math.abs(eventData[i].touchData.pageX - activeTouchAction.startX);
            activeTouchAction.offsetY = Math.abs(eventData[i].touchData.pageY - activeTouchAction.startY);
        }
    }

    _handleEndEvent(e) {
        const eventData = this._getEventData(e);

        for (let i = 0; i < eventData.length; i++) {
            const activeTouchAction = this._activeTouchActions[eventData[i].identifier];

            // If we don't have previous knowledge of this touch we skip it...
            if (!activeTouchAction) {
                continue;
            }

            // If the offset from where we started the tap is smaller then the max SLOP offset
            if (activeTouchAction.offsetX < this._tapMaxSlop && activeTouchAction.offsetY < this._tapMaxSlop) {
                // If the time passed since the tap down is not exceeding the timeout which makes the tap a long press operation...
                if ((this.getEventTimestamp() - activeTouchAction.startTime) < this._longPressTimeout) {
                    this._sendEvent('tap_events', TapEventStructure,
                        eventData[i].identifier, eventData[i].touchData, eventData[i].eventArgs);
                } else {
                    this._sendEvent('longpress_events', LongPressEventStructure,
                        eventData[i].identifier, eventData[i].touchData, eventData[i].eventArgs);
                }
            }

            delete this._activeTouchActions[eventData[i].identifier];
        }
    }

    _handleCancelEvent(e) {
        const eventData = this._getEventData(e);

        // Remove the canceled touch operations from the active actions dictionary
        for (let i = 0; i < eventData.length; i++) {
            delete this._activeTouchActions[eventData[i].identifier];
        }
    }

    // Get the event data. We build a unified event data structure so same code can handle the difference event formats
    _getEventData(e) {
        // Case the event is of touch event type
        if (e.changedTouches !== undefined) {
            const eventData = [];
            for (let i = 0; i < e.changedTouches.length; i++) {
                const changedTouch = e.changedTouches[i];
                const identifier = changedTouch.identifier;
                eventData.push({ identifier, touchData: changedTouch, eventArgs: e }); // we want to shrink it to short
            }

            return eventData;
        }
        // Case the event is of Pointer event type
        if (e.pointerType != null) {
            if (e.pointerType === 'touch' || e.pointerType === 'pen'
                || e.pointerType === e.MSPOINTER_TYPE_TOUCH
                || e.pointerType === e.MSPOINTER_TYPE_PEN) {
                const identifier = e.pointerId ? e.pointerId : 0;

                return [{ identifier, touchData: e, eventArgs: e }];
            }
        }

        // If data is unsupported we return an empty array so consumption of the data will not be invalid
        return [];
    }

    _sendEvent(eventName, dataMappingDefs, identifier, touch, e) {
        const time = this.getEventTimestamp();
        const isTrusted = IsTrustedValue[e.isTrusted];
        const element = this._elements.getElementHashFromEvent(e);

        const eventSeq = this._utils.StorageUtils.getAndUpdateEventSequenceNumber();

        if (this._utils.isUndefinedNull(identifier)) {
            identifier = 0;
        }

        // client - relative to edge of browser not including scrolling
        // page - relative to edge with scroll offset
        // screen - relative to the edge of the screen
        this._dataQ.addToQueue(eventName,
            this._utils.convertToArrayByMap(dataMappingDefs, {
                eventSequence: eventSeq,
                timestamp: time,
                screenX: this._maskingService.shouldMaskCoordinates() ? defaultMaskedCoordinates : (touch.screenX ? Math.round(touch.screenX) : 0),
                screenY: this._maskingService.shouldMaskCoordinates() ? defaultMaskedCoordinates : (touch.screenY ? Math.round(touch.screenY) : 0),
                pageX: this._maskingService.shouldMaskCoordinates() ? defaultMaskedCoordinates : (touch.pageX || 0),
                pageY: this._maskingService.shouldMaskCoordinates() ? defaultMaskedCoordinates : (touch.pageY || 0),
                clientX: this._maskingService.shouldMaskCoordinates() ? defaultMaskedCoordinates : (touch.clientX || 0),
                clientY: this._maskingService.shouldMaskCoordinates() ? defaultMaskedCoordinates : (touch.clientY || 0),
                isTrusted,
                elementHash: element,
                touchIndex: identifier % 10000, // we want to shrink it to short
                // duplicating the radius since it comes from mobile devices as diameter
                touchSizeMajor: touch.radiusX ? touch.radiusX * 2 : 0,
                touchSizeMinor: touch.radiusY ? touch.radiusY * 2 : 0,
            }));
    }
}
