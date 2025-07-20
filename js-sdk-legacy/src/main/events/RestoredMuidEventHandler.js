import {MessageBusEventType} from "./MessageBusEventType";
import {WorkerEvent} from "./WorkerEvent";

export default class RestoredMuidEventHandler{
    constructor(messageBus, muidService,clientEventService,workerCommunicator) {
        this._messageBus = messageBus;
        this._muidService = muidService;
        this._clientEventService = clientEventService;
        this._workerCommunicator = workerCommunicator;

        this._messageBus.subscribe(MessageBusEventType.ServerRestoredMuidEvent,this._handler.bind(this),true);
        this._workerCommunicator.addMessageListener(WorkerEvent.ServerRestoredMuidEvent,this._publish.bind(this),true);
    }

    /**
     * When getting a restored muid event from the Worker
     * the function gets the restored muid and update the client side with the restored one
     * also, event is dispatching notifying the event
     * @param restoredMuid - The restored muid
     */
    _handler(restoredMuid){
        //updating session muid in cookie and storage
        this._muidService?.updateMuid(restoredMuid);
        this._clientEventService.publishRestoredMuidEvent(restoredMuid);
    }

    _publish(muid){
        this._messageBus.publish(MessageBusEventType.ServerRestoredMuidEvent,muid);
    }
}