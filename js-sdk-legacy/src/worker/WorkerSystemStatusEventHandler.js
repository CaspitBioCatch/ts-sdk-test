import { WorkerEvent } from '../main/events/WorkerEvent';
import { MessageBusEventType } from '../main/events/MessageBusEventType';

/**
 * The class purpose is to publish HeartBeat events to main through WorkerCommunicator
 */
export default class WorkerSystemStatusEventHandler {
    /**
     *
     * @param mainCommunicator - WorkerCommunicator class
     * @param messageBus
     * @param logger
     */
    constructor(mainCommunicator, messageBus, logger) {
        this._mainCommunicator = mainCommunicator;
        this._messageBus = messageBus;
        this._logger = logger;
        this.errors = {};

        this._messageBus.subscribe(MessageBusEventType.WorkerSystemStatusEvent, this._handle.bind(this));
    }

    /**
     * This method creates HeartBeatEvent object and publish it through workerCommunicator
     * @param heartbeatEvent
     */
    _handle(heartbeatEvent) {
        this._logger.debug(`Sending new HeartBeatStatusEvent - ${heartbeatEvent.category}, ${heartbeatEvent.status}`);
        this._mainCommunicator.sendAsync(WorkerEvent.HeartBeatStatusEvent, heartbeatEvent);
    }
}
