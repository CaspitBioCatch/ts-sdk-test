import { ConfigurationFields } from '../core/configuration/ConfigurationFields';
import { WorkerEvent } from '../events/WorkerEvent';
import { ApiEventType } from '../api/ApiEventType';

/**
 * This class is for posting heartBeat messages to the customer
 */
export default class HeartBeatService {

    _dataOrigin = 'BC';

    constructor(workerCommunicator, heartBeatErrorsState, heartBeatPostMessageInterval) {
        this._heartBeatErrorsState = heartBeatErrorsState;
        this._heartBeatPostMessageInterval = heartBeatPostMessageInterval;
        workerCommunicator.addMessageListener(WorkerEvent.HeartBeatStatusEvent, this._handle.bind(this));
    }

    start() {
        this._clear();
        this._periodicPostMessageIntervalId = setInterval(this._postHeartBeatMessage.bind(this), this._heartBeatPostMessageInterval);
    }

    stop() {
        this._clear();
    }

    updateConfig(configurationRepository) {
        this._heartBeatPostMessageInterval = configurationRepository.get(ConfigurationFields.heartBeatMessageInterval);
        this.start();
    }

    _clear() {
        if (this._periodicPostMessageIntervalId) {
            clearInterval(this._periodicPostMessageIntervalId);
        }
    }

    _handle(heartBeatStatusEvent) {
        this._heartBeatErrorsState.updateState(heartBeatStatusEvent);
    }

    _postHeartBeatMessage() {
        if (this._heartBeatErrorsState.hasErrors()) {
            window.postMessage({ type: ApiEventType.HeartBeatEvent, data: this._heartBeatErrorsState.getErrors(), origin:this._dataOrigin }, window.location.href);
            return;
        }
        window.postMessage({ type: ApiEventType.HeartBeatEvent, data: 'Ok', origin:this._dataOrigin }, window.location.href);
    }
}
