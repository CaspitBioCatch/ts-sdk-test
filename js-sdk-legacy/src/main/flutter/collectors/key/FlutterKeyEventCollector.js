import DataCollector from '../../../collectors/DataCollector';
import { MessageBusEventType } from '../../../events/MessageBusEventType';
import {EventStructure} from "../../../collectors/events/KeyEventCollector";

export default class FlutterKeyEventCollector extends DataCollector {

  constructor(msgBus, dataQueue, utils, maskingService) {
    super();
    this._msgBus = msgBus;
    this._dataQueue = dataQueue;
    this._utils = utils;
    this._maskingService = maskingService;
  }

  startFeature() {
    super.startFeature();

    this._msgBus.subscribe(MessageBusEventType.BCTracker.KeyEvent, this._onKeyEvent);
  }

  stopFeature() {
    this._msgBus.unsubscribe(MessageBusEventType.BCTracker.KeyEvent, this._onKeyEvent);

    super.stopFeature();
  }

  _onKeyEvent = (event) => {
    const eventSequence = this._utils.StorageUtils.getAndUpdateEventSequenceNumber();
    const timestamp = this.getEventTimestamp();
    const eventKey = event.char;
    const KeyMaskedParameters = this._maskingService.maskKey(eventKey, '', event.elementId);
    const character = (KeyMaskedParameters.key.length > 1) ? '' : KeyMaskedParameters.key;
    const relativeTs = this.getTimestampFromEvent(event);

    this._dataQueue.addToQueue('key_events',
        this._utils.convertToArrayByMap(EventStructure,
            {
              eventSequence: eventSequence,
              timestamp,
              eventType: 2, /*KeyEventType.KEY_PRESS?*/
              isTrusted: -1,
              elementHash: event.hashCode,
              charCode: KeyMaskedParameters.charCode,
              character,
              keyComboType: -1,
              isCtrl:  false,
              isShift: false,
              isAlt: false,
              isMetaKey: false,
              keyLocation: 0,
              code: KeyMaskedParameters.code || '',
              key: KeyMaskedParameters.key || '',
              isRepeat: false,
              keyRegion: "-1",
              relativeTime: relativeTs,
              isSameKey: -1,
            }));
  };
}