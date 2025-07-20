/**
 * This class is for handling state changes
 */
import { MessageBusEventType } from './MessageBusEventType';
import Log from '../technicalServices/log/Logger';

export default class StateChangedEventHandler {
    constructor(messageBus,
                clientEventService) {
        this._messageBus = messageBus;
        this._clientEventService = clientEventService;

        this._messageBus.subscribe(MessageBusEventType.StateChangedEvent, this._handle.bind(this));
    }

    _handle(stateChangedEvent) {
        Log.info(`SDK state changed to ${stateChangedEvent.state}`);

        this._clientEventService.publishStateChangedEvent(stateChangedEvent.state);
    }
}
