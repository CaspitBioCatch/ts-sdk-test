import Log from '../../technicalServices/log/Logger';
import { statusTypes } from '../../events/HeartBeatEvent';

export default class HeartBeatErrorsState {
    constructor() {
        this.errors = {};
    }

    updateState(heartBeatStatusEvent) {
        const category = heartBeatStatusEvent.category;
        const status = heartBeatStatusEvent.status;
        if (this._isErrorRecovery(category, status)) {
            Log.info('Received heart beat recovery event', heartBeatStatusEvent);
            delete this.errors[category];
        } else if (this._isNewError(category, status)) {
            Log.info('Received heart beat error event', heartBeatStatusEvent);
            this.errors[category] = category;
        }
    }

    _isErrorRecovery(category, status) {
        return typeof (this.errors[category]) !== 'undefined' && status === statusTypes.Ok;
    }

    _isNewError(category, status) {
        return typeof (this.errors[category]) === 'undefined' && status === statusTypes.Error;
    }

    getErrors() {
        return Object.keys(this.errors).map((error) => { return `ERROR(${this.errors[error]})`; });
    }

    hasErrors() {
        return Object.keys(this.errors).length > 0;
    }
}
