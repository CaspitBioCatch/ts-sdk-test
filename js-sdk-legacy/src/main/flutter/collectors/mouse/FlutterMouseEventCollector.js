import DataCollector from "../../../collectors/DataCollector";
import {MessageBusEventType} from "../../../events/MessageBusEventType";
import {EventStructure} from "../../../collectors/events/MouseEventCollector";
import Log from "../../../technicalServices/log/Logger";
import {IsTrustedValue} from "../../../collectors/events/IsTrustedValue";
import { defaultMaskedCoordinates } from '../../../core/masking/MaskingService';

export const FlutterMouseEventType = {
    mousemove: 0,
    onTapDown: 1,
    onTapUp: 2
};

export default class FlutterMouseEventCollector extends DataCollector {

    constructor(msgBus, dataQueue, utils, maskingService, domUtils, configuration) {
        super();
        this._msgBus = msgBus;
        this._dataQueue = dataQueue;
        this._utils = utils;
        this._maskingService = maskingService;
        this._domUtils = domUtils;
        this._maxShadowDepth = configuration.getMaxShadowDepth();
        this._iframeLoadingTimeout = configuration.getIframeLoadingTimeout();
    }

    // BcTracker listens to mouse events (up, down) only at the widget level.
    // For 'mousemove' events, it listens at the browser's document context level.
    startFeature(browserContext) {
        super.startFeature();

        try {
            const currDocument = browserContext.getDocument();
            this._domUtils.addEventListener(currDocument, 'mousemove', this._onMouseEvent, true);
            browserContext.collectAllElementsBySelectorAsync('iframe', this._maxShadowDepth, this._iframeLoadingTimeout)
                .then((iframes) => {
                    iframes.forEach((iframe) => {
                        this._domUtils.addEventListener(iframe.contentDocument, 'mousemove', this._onMouseEvent, true);
                    });
                })


            this._msgBus.subscribe(MessageBusEventType.BCTracker.MouseEvent, this._onMouseEvent);
        } catch (err) {
            Log.error(`MouseEvents:startFeature failed. msg: ${err.message}`, err);
        }
    }

    stopFeature(browserContext) {
        try {
            const currDocument = browserContext.getDocument();
            this._domUtils.removeEventListener(currDocument, 'mousemove', this._onMouseEvent, true);
            browserContext.collectAllElementsBySelectorAsync('iframe', this._maxShadowDepth, this._iframeLoadingTimeout)
                .then((iframes) => {
                    iframes.forEach((iframe) => {
                        this._domUtils.removeEventListener(iframe.contentDocument, 'mousemove', this._onMouseEvent, true);
                    });
                })

            this._msgBus.unsubscribe(MessageBusEventType.BCTracker.MouseEvent, this._onMouseEvent);
        } catch (err) {
            Log.error(`MouseEvents:stopFeature failed. msg: ${err.message}`, err);
        }

        super.stopFeature();
    }

    _onMouseEvent = (event) => {
        const eventType = FlutterMouseEventType[event.type];
        const relativeTs = this.getTimestampFromEvent(event);

        this._dataQueue.addToQueue('mouse_events',
            this._utils.convertToArrayByMap(EventStructure,
                {
                    eventSequence: this._utils.StorageUtils.getAndUpdateEventSequenceNumber(),
                    timestamp: this.getEventTimestamp(),
                    eventType: eventType,
                    isTrusted: event.type === 'mousemove' ? IsTrustedValue[event.isTrusted] : -1,
                    elementHash: event.type === 'mousemove' ? 0 : event.hashCode,
                    pageX: this._resolveCoordinate(event.type, event.pageX),
                    pageY: this._resolveCoordinate(event.type, event.pageY),
                    // we get only screen coordinates (and not page and client) for non-'mousemove' events.
                    screenX: this._maskingService.shouldMaskCoordinates() ? defaultMaskedCoordinates : this._roundCoordinate(event.screenX),
                    screenY: this._maskingService.shouldMaskCoordinates() ? defaultMaskedCoordinates : this._roundCoordinate(event.screenY),
                    button: 0,
                    wheelDelta: 0,
                    clientX: this._resolveCoordinate(event.type, event.clientX),
                    clientY: this._resolveCoordinate(event.type, event.clientY),
                    eventDetail: event.type === 'mousemove' ? (event.detail || 0) : 0,
                    buttonNew: 0,
                    relativeTime: relativeTs,
                }));
    };

   _resolveCoordinate(eventType, coordinate) {
     if (eventType === 'mousemove') {
       if (this._maskingService.shouldMaskCoordinates()) {
         return defaultMaskedCoordinates;
       }

       // we get only screen coordinates (and not page and client) for non-'mousemove' events.
       return this._roundCoordinate(coordinate);
     }

     return 0;
   }

  _roundCoordinate(coordinate) {
    if (coordinate) {
      return Math.round(coordinate);
    }

    return -1;
  }
}