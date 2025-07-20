import DataCollector from '../DataCollector';
import { IsTrustedValue } from './IsTrustedValue';
import Log from '../../technicalServices/log/Logger';
import { defaultMaskedCoordinates } from '../../core/masking/MaskingService';

const featureSettings = {
    configKey: 'isMouseEvents',
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

export const MouseEventType = {
    mousemove: 0,
    mousedown: 1,
    mouseup: 2,
    click: 3,
    dblclick: 4,
    mouseleave: 5,
    mouseenter: 6,
    wheel: 7,
    mouseout: 8,
    mouseover: 9,
};

export const EventStructure = ['eventSequence', 'timestamp', 'eventType', 'isTrusted', 'elementHash', 'pageX',
    'pageY', 'screenX', 'screenY', 'button', 'wheelDelta', 'clientX', 'clientY', 'eventDetail', 'buttonNew', 'relativeTime'];

export default class MouseEventCollector extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    // remembers the last button so that ie will know which click was clicked.
    _lastButton;

    constructor(utils, domUtils, elements, dataQueue, maskingService, configuration) {
        super();
        this._utils = utils;
        this._domUtils = domUtils;
        this._elements = elements;
        this._dataQueue = dataQueue;
        this._maskingService = maskingService;
        this._maxShadowDepth = configuration.getMaxShadowDepth();
        this._iframeLoadingTimeout = configuration.getIframeLoadingTimeout();
        this._listenedDocuments = new WeakSet();

    }

    startFeature(browserContext) {
        try {
            const currDocument = browserContext.getDocument();
            this._addEventListeners(browserContext, currDocument)


            browserContext.collectAllElementsBySelectorAsync('iframe', this._maxShadowDepth, this._iframeLoadingTimeout)
                .then((iframes) => {
                    iframes.forEach((iframe) => {
                        if (iframe && iframe.contentDocument) {
                            this._addEventListeners(browserContext, iframe.contentDocument)
                        }
                    });
                })
        } catch (err) {
            Log.error(`MouseEvents:startFeature failed. msg: ${err.message}`, err);
        }
    }

    stopFeature(browserContext) {
        try {
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
        } catch (err) {
            Log.error(`MouseEvents:stopFeature failed. msg: ${err.message}`, err);
        }
    }

    _addEventListeners(browserContext, currentDocument) {
        if (this._listenedDocuments.has(currentDocument)) {
            return; // Already added
        }
        this._listenedDocuments.add(currentDocument);

        this._domUtils.addEventListener(currentDocument, 'mousemove', this._getMouseEvent, true);
        this._domUtils.addEventListener(currentDocument, 'mousedown', this._getMouseEvent, true);
        this._domUtils.addEventListener(currentDocument, 'mouseup', this._getMouseEvent, true);
        this._domUtils.addEventListener(currentDocument, 'click', this._getMouseEvent, true);
        this._domUtils.addEventListener(currentDocument, 'dblclick', this._getMouseEvent, true);
        this._isIE = !!currentDocument.documentMode || /edge/.test(window.navigator.userAgent.toLowerCase());
        if (this._isIE) {
            // mouseleave and mouseenter events in IE and edge only work on the body and not
            // on the entire document
            this._domUtils.onDocumentBody(browserContext.Context, () => {
                this._domUtils.addEventListener(currentDocument.body, 'mouseleave', this._getMouseEvent);
                this._domUtils.addEventListener(currentDocument.body, 'mouseenter', this._getMouseEvent);
            });
        } else {
            this._domUtils.addEventListener(currentDocument, 'mouseleave', this._getMouseEvent);
            this._domUtils.addEventListener(currentDocument, 'mouseenter', this._getMouseEvent);
        }
        this._domUtils.addEventListener(currentDocument, 'wheel', this._getMouseEvent, true);
    }

    _removeEventListeners(currentDocument) {
        this._listenedDocuments.delete(currentDocument);

        this._domUtils.removeEventListener(currentDocument, 'mousemove', this._getMouseEvent, true);
        this._domUtils.removeEventListener(currentDocument, 'mousedown', this._getMouseEvent, true);
        this._domUtils.removeEventListener(currentDocument, 'mouseup', this._getMouseEvent, true);
        this._domUtils.removeEventListener(currentDocument, 'click', this._getMouseEvent, true);
        this._domUtils.removeEventListener(currentDocument, 'dblclick', this._getMouseEvent, true);
        if (this._isIE) {
            this._domUtils.removeEventListener(currentDocument.body, 'mouseleave', this._getMouseEvent);
            this._domUtils.removeEventListener(currentDocument.body, 'mouseenter', this._getMouseEvent);
        } else {
            this._domUtils.removeEventListener(currentDocument, 'mouseleave', this._getMouseEvent);
            this._domUtils.removeEventListener(currentDocument, 'mouseenter', this._getMouseEvent);
        }
        this._domUtils.removeEventListener(currentDocument, 'wheel', this._getMouseEvent, true);
    }

    _getMouseEvent = (e) => { // wheel delta is only in the case of mousewheel
        let button = e.which;
        if (e.type === 'mouseup') {
            // remembers the last button so that IE will know which click was clicked.
            this._lastButton = button;
        } else if (e.type === 'click' && button === 0) {
            // So IE will know which click was clicked.
            button = this._lastButton;
        }

        let eventType = MouseEventType[e.type];
        if (this._utils.isUndefinedNull(eventType)) {
            eventType = -1;
        }

        const wheelDelta = e.deltaY || e.deltaX || e.deltaZ || e.wheelDelta || 0;
        const relativeTs = this.getTimestampFromEvent(e);
        // we are not using CDUtils.convertToArrayByMap here for optimization reasons

        this._dataQueue.addToQueue('mouse_events', [
            null,
            this._utils.StorageUtils.getAndUpdateEventSequenceNumber(),
            this.getEventTimestamp(e),
            eventType,
            IsTrustedValue[e.isTrusted],
            e.type === 'mousemove' ? 0 : this._elements.getElementHashFromEvent(e),
            this._maskingService.shouldMaskCoordinates() ? defaultMaskedCoordinates : this._roundCoordinate(e.pageX),
            this._maskingService.shouldMaskCoordinates() ? defaultMaskedCoordinates : this._roundCoordinate(e.pageY),
            this._maskingService.shouldMaskCoordinates() ? defaultMaskedCoordinates : this._roundCoordinate(e.screenX),
            this._maskingService.shouldMaskCoordinates() ? defaultMaskedCoordinates : this._roundCoordinate(e.screenY),
            (button === null || button === undefined) ? -1 : button,
            // In 2.0 the data team is not ready to handle vector yet. In 2.1 we should change it to be a vector
            Math.round(wheelDelta),
            this._maskingService.shouldMaskCoordinates() ? defaultMaskedCoordinates : this._roundCoordinate(e.clientX),
            this._maskingService.shouldMaskCoordinates() ? defaultMaskedCoordinates : this._roundCoordinate(e.clientY),
            e.detail || 0, // For click or dblclick events, UIEvent.detail is the current click count.
            // For mousedown or mouseup events, UIEvent.detail is 1 plus the current click count.
            // For all other UIEvent objects, UIEvent.detail is always zero.
            // We are using it since in Angular sites (AMEX) we are getting a click both on the
            // upper wrapper div which is transferred to the input. The way to distinguish between them
            // (besides the different element hash) is to look also on the event.detail
            (e.button === null || e.button === undefined) ? -1 : e.button,
            relativeTs,
        ]);
    }

    _roundCoordinate(coordinate) {
        if (coordinate) {
            return Math.round(coordinate);
        }

        return -1;
    }
}
