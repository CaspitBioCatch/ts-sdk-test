import DataCollector from '../../../collectors/DataCollector';
import { MessageBusEventType } from '../../../events/MessageBusEventType';
import {ElementEventType, EventStructure} from "../../../collectors/events/ElementEventCollector";

export default class FlutterElementEventsCollector extends DataCollector {

    constructor(msgBus, dataQueue, utils, contextMgr, maskingService) {
        super();
        this._msgBus = msgBus;
        this._dataQueue = dataQueue;
        this._utils = utils;
        this._contextMgr = contextMgr;
        this._maskingService = maskingService;
        this._elementWMap = new Set();
        this._maxElemValLength = 200;
    }

    startFeature() {
        super.startFeature();

        this._msgBus.subscribe(MessageBusEventType.BCTracker.ElementEventsEvent, this._collectEventElement);
        this._msgBus.subscribe(MessageBusEventType.BCTracker.ElementsEvent, this._collectElement);
    }

    stopFeature() {
        this._msgBus.unsubscribe(MessageBusEventType.BCTracker.ElementEventsEvent, this._collectEventElement);
        this._msgBus.unsubscribe(MessageBusEventType.BCTracker.ElementsEvent, this._collectElement);

        super.stopFeature();
    }

    _collectEventElement = (event) => {
        const eventSequence = this._utils.StorageUtils.getAndUpdateEventSequenceNumber();
        const timestamp = this.getEventTimestamp();
        const relativeTs = this.getTimestampFromEvent(event);

        let maskedValue = this._maskingService.maskText(event.elementValue, event.elementId);
        let type = ElementEventType[event.eventType];

        if (maskedValue && maskedValue.length > this._maxElemValLength) {
            maskedValue = '';
        }

        this._dataQueue.addToQueue('element_events',
            this._utils.convertToArrayByMap(EventStructure,
                {
                    eventSequence: eventSequence,
                    timestamp,
                    eventType: type,
                    isTrusted: -1,
                    elementHash: event.hashCode,
                    length: maskedValue.length,
                    elementValues: maskedValue,
                    selected: -1,
                    hashedValue: '',
                    relativeTime: relativeTs
                }));
    };

    _collectElement = (event) => {
        if (!this._utils.isUndefinedNull(event.hashCode) && !this._elementWMap.has(event.hashCode)) {
            this._elementWMap.add(event.hashCode);

            const elemId = this._maskingService.maskAbsoluteIfRequired(event.elementId, event.elementId);
            this._dataQueue.addToQueue('elements',
                [
                    this._contextMgr.contextHash,
                    event.hashCode,
                    '',
                    elemId || '',
                    '',
                    event.widgetType || '',
                    event.dxPosition || 0,
                    event.dyPosition || 0,
                    event.widthElement || 0,
                    event.heightElement || 0,
                    '',
                    '',
                    '',
                    '',
                    '',
                    '',
                    0,
                    event.timeStamp,
                    '',
                    '',
                    '',
                ]
            );
        }
    };
}