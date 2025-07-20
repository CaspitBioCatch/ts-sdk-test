/*
Aggregates log messages
 */
import {LogLevel} from "../main/technicalServices/log/LogLevel";

export default class LogAggregator {
    constructor() {
        this.reset();
    }

    setLogLevel(logLevel){
        this._logLevel = logLevel;
    }

    add(message) {
        const messageData = message.data;

        if (!messageData) {
            throw new Error('Unable to add log message. Missing data field');
        }

        //We add message to log if:
        // 1. messsage has no level (performance ("perf") events that are posted to worker for logging)
        // 2. logLevel of the message >= the level of the log
        if (!messageData.level || messageData.level >= this._logLevel) {
            this._Q.push(messageData);
        }
    }

    /**
     * Takes current data from the aggregator and removes it from the aggregator.
     * Aggregator is reset to initial empty state
     * @returns {Array}
     */
    take() {
        const currentQ = this._Q;
        this.reset();

        return currentQ;
    }

    reset() {
        this._Q = [];
        this.setLogLevel(typeof this._logLevel === "undefined" ? LogLevel.INFO : this._logLevel);
    }

    isEmpty() {
        return this._Q.length === 0;
    }

    filterOutByLogLevel(logLevel) {
        this._Q = this._Q.filter(
            // eslint-disable-next-line no-unused-vars
            function(value, index, arr) {
                return value.level >= logLevel;
            });
    }
}
