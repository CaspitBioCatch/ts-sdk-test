import DataCollector from '../DataCollector';

const eventsPointerXYProps = ['clientX', 'clientY'];
const eventsTouchXYProps = ['screenX', 'screenY'];

/**
 * should be called on pointerup event
 * Then clear the stack of pointers
 */
const pinchRecognizer = (pointers, prevPointers, eventProps) => {
    function getDistance(p1, p2) {
        const x = p2[eventProps[0]] - p1[eventProps[0]];
        const y = p2[eventProps[1]] - p1[eventProps[1]];

        return Math.sqrt((x * x) + (y * y));
    }

    function getScale() {
        return getDistance(pointers[0], pointers[1]) / getDistance(prevPointers[0], prevPointers[1]);
    }

    function getFocusPoint(p1, p2) {
        return {
            x: (p1[eventProps[0]] + p2[eventProps[0]]) / 2,
            y: (p1[eventProps[1]] + p2[eventProps[1]]) / 2,
        };
    }

    return {
        getScale: () => {
            return getScale();
        },
        getFocusPoint: () => {
            return getFocusPoint(pointers[1], pointers[0]);
        },
    };
};

const pinchZoomEventType = {
    pointerdown: 0,
    pointermove: 1,
    pointerup: 2,
};

const featureSettings = {
    configKey: 'isPinchZoomEvents',
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

const EventStructure = ['eventSequence', 'timestamp', 'focusX', 'focusY', 'scaleFactor'];

export default class PinchZoomEventCollector extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    constructor(utils, elements, dataQ, msgBus, configuration) {
        super();
        this._utils = utils;
        this._dataQ = dataQ;
        this._elements = elements;
        this._msgBus = msgBus;
        this._evGesturesCache = [];
        this._prevEventDiff = -1;
        this._prevEvGestureSet = [];
        this._prevTouchEvents = [];
        this._onAllBrowsersPinchZoomEventBinded = this._onAllBrowsersPinchZoomEvent.bind(this);
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

    _addToCommunicationQueue(type, scale, focusPoint, e) {
        if (type === pinchZoomEventType.pointerdown || type === pinchZoomEventType.pointerup) {
            this._msgBus.publish('pinchEvent', { action: type });
        }

        const time = this.getEventTimestamp(e);

        const eventSeq = this._utils.StorageUtils.getAndUpdateEventSequenceNumber();

        // client - relative to edge of browser not including scrolling
        // page - relative to edge with scroll offset
        // screen - relative to the edge of the screen
        this._dataQ.addToQueue('pinch_events',
            this._utils.convertToArrayByMap(EventStructure, {
                eventSequence: eventSeq,
                timestamp: time,
                focusX: focusPoint.x,
                focusY: focusPoint.y,
                scaleFactor: scale,
            }));
    }

    /**
     * @param {BrowserContext} browserContext
     * @private
     */
    _bind(browserContext) {
        const currDocument = browserContext.getDocument();
        let eventsToListen;

        // By default, bind the Pointer Events and if not supported
        // attempt to use the Touch Events
        if (window.PointerEvent) {
            eventsToListen = ['pointerdown', 'pointermove', 'pointerup'];
        } else if (window.TouchEvent) {
            eventsToListen = ['touchstart', 'touchend', 'touchcancel', 'touchmove'];
        }

        this._listeningToEvents = eventsToListen;
        if (this._listeningToEvents) {
            for (let i = 0; i < this._listeningToEvents.length; i++) {
                this._utils.addEventListener(currDocument, this._listeningToEvents[i],
                    this._onAllBrowsersPinchZoomEventBinded, false, false);

                browserContext.collectAllElementsBySelectorAsync('iframe', this._maxShadowDepth, this._iframeLoadingTimeout)
                    .then((iframes) => {
                        iframes.forEach((iframe) => {
                            if (iframe && iframe.contentDocument) {
                                this._utils.addEventListener(iframe.contentDocument, this._listeningToEvents[i],
                                    this._onAllBrowsersPinchZoomEventBinded, false, false);
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
                this._utils.removeEventListener(currDocument, this._listeningToEvents[i], this._onAllBrowsersPinchZoomEventBinded);
                browserContext.collectAllElementsBySelectorAsync('iframe', this._maxShadowDepth, this._iframeLoadingTimeout)
                    .then((iframes) => {
                        iframes.forEach((iframe) => {
                            if (iframe && iframe.contentDocument) {
                                this._utils.removeEventListener(iframe.contentDocument, this._listeningToEvents[i], this._onAllBrowsersPinchZoomEventBinded);
                            }
                        });
                    })
            }
        }
        this._evGesturesCache = [];
        this._prevEventDiff = -1;
    }

    _onAllBrowsersPinchZoomEvent(e) {
        switch (e.type) {
            case 'pointerdown':
                this._onPointerDownEvent(e);
                break;
            case 'pointermove':
                this._onPointerMoveEvent(e);
                break;
            case 'pointerup':
                this._onPointerUpEvent(e);
                break;
            case 'touchstart':
                this._onTouchStartEvent(e);
                break;
            case 'touchend':
                this._onTouchEndEvent();
                break;
            case 'touchmove':
                this._onTouchMoveEvent(e);
                break;
            default:
        }

        return true;
    }

    _onPointerDownEvent(e) {
        this._evGesturesCache.push(e);
    }

    _onPointerMoveEvent(e) {
        // We update the events with the same pointerId value that were push as pointerdown.
        // We're only interested in 2 gestures to imply if two points
        // with different pointer Ids create a pinch when their x,y are increased,decreased accordingly
        for (let i = 0; i < this._evGesturesCache.length; i++) {
            if (e.pointerId === this._evGesturesCache[i].pointerId) {
                this._evGesturesCache[i] = e;
                break;
            }
        }

        if (this._evGesturesCache.length === 2 && (this._evGesturesCache[0].pointerId !== this._evGesturesCache[1].pointerId)) {
            // Calculate the distance between the two pointers
            const curDiff = Math.abs(this._evGesturesCache[0].clientX - this._evGesturesCache[1].clientX);
            if (this._prevEventDiff > 0) {
                if (curDiff > this._prevEventDiff) {
                    // The distance between the two pointers has increased
                    // this._addToCommunicationQueue(pinchZoomEventType[e.type], "zoom_in", e);
                }
                if (curDiff < this._prevEventDiff) {
                    // The distance between the two pointers has decreased
                    // this._addToCommunicationQueue(pinchZoomEventType[e.type], "zoom_out", e);
                }
                if (this._prevEvGestureSet.length === 2) {
                    const pr = pinchRecognizer(this._evGesturesCache, this._prevEvGestureSet, eventsPointerXYProps);
                    const _s = pr.getScale();

                    this._addToCommunicationQueue(pinchZoomEventType[e.type], _s, pr.getFocusPoint(), e);
                }
            }

            // Cache the distance for the next move event
            this._prevEventDiff = curDiff;
            this._prevEvGestureSet = this._evGesturesCache.slice(0);
        } else if (this._evGesturesCache.length > 2) {
            // There are for some reason points that are not cleared immediately.
            this._evGesturesCache = [];
            this._prevEvGestureSet = [];
        }
    }

    /**
     * We clear the events that were collected before the pointerup event was thrown
     * @param e
     * @private
     */
    _onPointerUpEvent(e) {
        for (let i = 0; i < this._evGesturesCache.length; i++) {
            if (this._evGesturesCache[i].pointerId === e.pointerId) {
                this._evGesturesCache.splice(i, 1);
                break;
            }
        }

        if (this._evGesturesCache.length < 2) {
            this._prevEventDiff = -1;
            this._prevEvGestureSet = [];
        }
    }

    _onTouchStartEvent(e) {
        this._prevTouchEvents[0] = e.touches.item(0);
        this._prevTouchEvents[1] = e.touches.item(1);
    }

    _onTouchEndEvent() {
        this._prevTouchEvents = [];
    }

    /**
     * Since this feature deals only with pinching/zooming, the maximum number of
     * fingers on the surface at the same time is for pinching/zooming detection
     * is two.
     * @param e
     * @private
     */
    _onTouchMoveEvent(e) {
        if (e.touches.length === 2) {
            if (this._prevTouchEvents.length === 2) {
                const current = [e.touches.item(0), e.touches.item(1)];
                const pr = pinchRecognizer(current, this._prevTouchEvents.splice(0), eventsTouchXYProps);
                const _s = pr.getScale();
                this._addToCommunicationQueue(pinchZoomEventType[e.type], _s, pr.getFocusPoint(), e);
            }
            // finally - update the previous touch pairs
            this._prevTouchEvents[0] = e.touches.item(0);
            this._prevTouchEvents[1] = e.touches.item(1);
        }
    }
}
