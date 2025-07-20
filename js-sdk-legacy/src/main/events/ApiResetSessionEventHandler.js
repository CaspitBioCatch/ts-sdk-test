import { MessageBusEventType } from './MessageBusEventType';

export default class ApiResetSessionEventHandler {
    constructor(messageBus, sessionService) {
        this._messageBus = messageBus;
        this._sessionService = sessionService;

        this._messageBus.subscribe(MessageBusEventType.ApiResetSessionEvent, this._handle.bind(this));
    }

    _handle(event) {
        this._sessionService.onResetSession(event);
    }
}
