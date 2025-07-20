/**
 * This class is for handling a session state update (modified sts or std received from server or a requestId which was modified)
 */
import { MessageBusEventType } from '../../main/events/MessageBusEventType';
import { WorkerEvent } from '../../main/events/WorkerEvent';

export default class WorkerServerStateUpdatedEventHandler {
    constructor(messageBus,
                logger,
                mainCommunicator) {
        this._messageBus = messageBus;
        this._logger = logger;
        this._mainCommunicator = mainCommunicator;

        this._messageBus.subscribe(MessageBusEventType.ServerStateUpdatedEvent, this._handle.bind(this));
    }

    _handle(newServerState) {
        this._logger.debug('Worker received an updated server state.');

        this._mainCommunicator.sendAsync(WorkerEvent.ServerStateUpdatedEvent, newServerState);
    }
}
