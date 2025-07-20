/**
 * This class is for handling an update to the wup dispatch rate in worker
 */
import { MessageBusEventType } from '../../main/events/MessageBusEventType';

export default class WorkerWupDispatchRateUpdatedEventHandler {
    constructor(messageBus,
                dataDispatcher,
                logger) {
        this._messageBus = messageBus;
        this._dataDispatcher = dataDispatcher;
        this._logger = logger;

        this._messageBus.subscribe(MessageBusEventType.WupDispatchRateUpdatedEvent, this._handle.bind(this));
    }

    _handle(newWupDispatchRate) {
        this._logger.info(`Worker received a wup dispatch rate ${newWupDispatchRate} from server.`);

        this._dataDispatcher.scheduleNextDispatching();
    }
}
