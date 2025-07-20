/**
 * This class is for handling a new session in worker
 */
import { MessageBusEventType } from '../../main/events/MessageBusEventType';
import { WorkerEvent } from '../../main/events/WorkerEvent';

export default class WorkerNewSessionStartedEventHandler {
    constructor(messageBus,
                logger,
                mainCommunicator) {
        this._messageBus = messageBus;
        this._logger = logger;
        this._mainCommunicator = mainCommunicator;

        this._messageBus.subscribe(MessageBusEventType.NewSessionStartedEvent, this._handle.bind(this));
    }

    _handle(newSid) {
        this._logger.info(`Worker received a new session id ${newSid} from server.`);

        this._mainCommunicator.sendAsync(WorkerEvent.NewSessionStartedEvent, newSid);
    }
}
