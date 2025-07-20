import DataCollector from "../../../collectors/DataCollector";
import {MessageBusEventType} from "../../../events/MessageBusEventType";
import { EventStructure } from '../../../collectors/events/TouchEventCollector';
import { defaultMaskedCoordinates } from '../../../core/masking/MaskingService';

export const FlutterTouchEventType = {
    onTapDown: 0,
    onTapUp: 2
};

export default class FlutterTouchEventCollector extends DataCollector {

    constructor(msgBus, dataQueue, utils, maskingService) {
        super();
        this._msgBus = msgBus;
        this._dataQueue = dataQueue;
        this._utils = utils;
        this._maskingService = maskingService;
    }

    startFeature() {
        super.startFeature();

        this._msgBus.subscribe(MessageBusEventType.BCTracker.TouchEvent, this._onTouchEvent);
    }

    stopFeature() {
        this._msgBus.unsubscribe(MessageBusEventType.BCTracker.TouchEvent, this._onTouchEvent);

        super.stopFeature();
    }

    _onTouchEvent = (event) => {
        let type = FlutterTouchEventType[event.touchState];

        if (type === FlutterTouchEventType.onTapDown || type === FlutterTouchEventType.onTapUp) {
            this._msgBus.publish(MessageBusEventType.TouchEvent, { action: type });
        }
        const time = this.getEventTimestamp();
        const eventSeq = this._utils.StorageUtils.getAndUpdateEventSequenceNumber();
        const relativeTs = this.getTimestampFromEvent(event);

        if (this._utils.isUndefinedNull(type)) {
            type = -1;
        }

        this._dataQueue.addToQueue('touch_events',
            this._utils.convertToArrayByMap(EventStructure, {
                eventSequence: eventSeq,
                timestamp: time,
                eventType: type,
                isTrusted: -1,
                elementHash: event.hashCode,
                clientX: this._maskingService.shouldMaskCoordinates() ? defaultMaskedCoordinates : (event.x ? Math.round(event.x) : 0),
                clientY: this._maskingService.shouldMaskCoordinates() ? defaultMaskedCoordinates : (event.y ? Math.round(event.y) : 0),
                touchIndex: event.pointer,
                // duplicating the radius since it comes from mobile devices as diameter
                touchSizeMajor: event.radiusMajor ? event.radiusMajor * 2 : 0,
                touchSizeMinor: event.radiusMinor ? event.radiusMinor * 2 : 0,
                pageX: 0,
                pageY: 0,
                screenX: 0,
                screenY: 0,
                relativeTime: relativeTs,
                touchPressure: event.pressure || -1,
            }));
    };
}