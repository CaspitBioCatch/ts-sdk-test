import { MessageBusEventType } from '../../main/events/MessageBusEventType';
import { WorkerEvent } from '../../main/events/WorkerEvent';

export default class WorkerServerNewAgentId {
    constructor(messageBus, mainCommunicator
    ) {
        this._messageBus = messageBus
        this._mainCommunicator = mainCommunicator;

        this._messageBus.subscribe(MessageBusEventType.ServerNewAgentIdEvent, this._handle.bind(this));
    }

    _handle(agentId) {
        this._mainCommunicator.sendAsync(WorkerEvent.ServerNewAgentIdEvent, agentId);
    }
}