import { MessageBusEventType } from './MessageBusEventType';
import Log from '../technicalServices/log/Logger';

export default class ApiSetCsidEventHandler {
    constructor(messageBus, csidService) {
        this._messageBus = messageBus;
        this._csidService = csidService;

        this._messageBus.subscribe(MessageBusEventType.ApiSetCsidEvent, this._handle.bind(this));
    }

    _handle(event) {
        if (!event.csid) {
            Log.warn(`Received an invalid csid of ${event.csid}. Ignoring api call`);
            return;
        }
        this._csidService.set(event.csid);
    }
}
