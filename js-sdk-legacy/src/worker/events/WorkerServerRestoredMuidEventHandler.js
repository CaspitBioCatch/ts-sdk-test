import {MessageBusEventType} from "../../main/events/MessageBusEventType";
import {WorkerEvent} from "../../main/events/WorkerEvent";

/**
 * This class is for handling server response with a restored muid
 */
export default class WorkerServerRestoredMuidEventHandler {
    constructor(messageBus, mainCommunicator) {
        this._messageBus = messageBus;
        this._mainCommunicator = mainCommunicator;

        //getting the restored muid should be a one time event, once we get it, we remove the subscription for this event
        this._messageBus.subscribe(MessageBusEventType.ServerRestoredMuidEvent, this._handler.bind(this), true);
    }

    /**
     * when the server sends the restored muid, it will publish a messageBus event. In the main js side
     * on initialization it registers this event to react upon and update what is needed on the client side
     * @param restoredMuid - The restored muid
     */
    _handler(restoredMuid) {
        this._mainCommunicator.sendAsync(WorkerEvent.ServerRestoredMuidEvent, restoredMuid);
    }

}