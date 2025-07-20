import { MessageBusEventType } from './MessageBusEventType';

export default class ApiChangeStateEventHandler {
    constructor(messageBus, pauseResumeManager, slaveListener) {
        this._messageBus = messageBus;
        this._pauseResumeManager = pauseResumeManager;
        this._slaveListener = slaveListener;

        this._messageBus.subscribe(MessageBusEventType.ApiChangeStateEvent, this._handle.bind(this));
    }

    _handle(event) {
        // Forward api message to both pause resume manager so state will be changed locally + the slave listener so slaves will receive the state change
        this._pauseResumeManager.onStateChange(event);
        this._slaveListener.notifyStateChange(event);
    }
}
