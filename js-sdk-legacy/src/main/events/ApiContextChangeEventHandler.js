import { MessageBusEventType } from './MessageBusEventType';

export default class ApiContextChangeEventHandler {
    constructor(messageBus, contextMgr) {
        this._messageBus = messageBus;
        this._contextMgr = contextMgr;

        this._messageBus.subscribe(MessageBusEventType.ApiContextChangeEvent, this._handle.bind(this));
    }

    _handle(event) {
        // activityType is for backward compatibility with 1.4 api
        this._contextMgr.changeContext(event.context || event.activityType);
    }
}
