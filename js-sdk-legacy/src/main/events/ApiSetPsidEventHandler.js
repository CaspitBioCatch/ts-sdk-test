import { MessageBusEventType } from './MessageBusEventType';
import Log from '../technicalServices/log/Logger';

export default class ApiSetPsidEventHandler {
    constructor(messageBus, psidService) {
        this._messageBus = messageBus;
        this._psidService = psidService;

        this._messageBus.subscribe(MessageBusEventType.ApiSetPsidEvent, this._handle.bind(this));
    }

    _handle(event) {
        if (!event.psid) {
            Log.warn(`Received an invalid psid of ${event.psid}. Ignoring api call`);
            return;
        }

        this._psidService.set(event.psid);
    }
}
