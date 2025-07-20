import Log from './log/Logger';

/**
 * Used for sending messages from main code to worker code
 * @param serverWorkerCommunicator
 * @param contextManager
 * @param intervalConfigKey
 * @param msgToWorker
 * @param passToWorkerInterval
 * @constructor
 */
export default class DataQ {

     _dataOrigin = 'BC';

    constructor(domUtils, serverWorkerCommunicator, contextManager, intervalConfigKey, msgToWorker, passToWorkerInterval) {
        this._serverWorkerCommunicator = serverWorkerCommunicator;
        this._contextManager = contextManager;
        this._passToWorkerInterval = passToWorkerInterval || 0; // 0 means no interval, pass directly
        this._intervalConfigKey = intervalConfigKey;
        this._msgToWorker = msgToWorker;
        this._Q = [];
        if (this._passToWorkerInterval) {
            this._intervalId = setInterval(this._sendQToServerWorker.bind(this), this._passToWorkerInterval);
        }

        // Make sure no data is left unsent when refreshing/moving window the window,
        // the worker is suppose to still be running
        domUtils.addEventListener(window, 'beforeunload', () => {
            this._onUnload();
        }, true);
    }

    addToQueue(name, data, addCtxId, isImmediateWup) {
        addCtxId = !!(addCtxId === undefined || addCtxId === null || addCtxId === true);
        // the data is not array when sending logs
        addCtxId && data.push && (data[0] = this._contextManager.contextHash);// always in the 0 index

        if (this._passToWorkerInterval !== 0) {
            this._Q.push({
                eventName: name,
                data,
                shouldFlush: isImmediateWup,
                origin:this._dataOrigin,
            });
            // Discovered in #TCI-121 - Bradesco report about performance issues with our system in Firefox
            // Therefore we try and limit the Q size
            if (isImmediateWup) {
                this._sendQToServerWorker();
            }
        } else {
            this._serverWorkerCommunicator.sendAsync(this._msgToWorker,
                {
                    eventName: name,
                    data,
                    shouldFlush: isImmediateWup,
                    origin:this._dataOrigin,
                });
        }
    }

    updateWithConfig(configurationRepository) {
        const newInterval = configurationRepository.get(this._intervalConfigKey);
        if (newInterval !== undefined && newInterval !== this._passToWorkerInterval) {
            this._passToWorkerInterval = newInterval;
            clearInterval(this._intervalId);
            this._intervalId = null;
            if (this._passToWorkerInterval !== 0) {
                this._intervalId = setInterval(this._sendQToServerWorker.bind(this), this._passToWorkerInterval);
            }
        }
    }

    flushAllMessages() {
        // empty the queue and send the data to be first
        this._Q.push({ eventName: 'flushData' });
        this._sendQToServerWorker();
    }

    registerOnPreSendToWorker(onPreSendToWorker) {
        this._onPreSendToWorker = onPreSendToWorker;
    }

    _sendQToServerWorker() {
        try {
            if (this._onPreSendToWorker) {
                this._onPreSendToWorker();
            }

            if (this._Q.length) {
                this._serverWorkerCommunicator.sendAsync(this._msgToWorker, this._Q);
                this._Q = []; // faster then splice...
            }
        } catch (error) {
            Log.error(`Failed sending data to worker. ${error}`);
            this._sendQInSingleMessagesToServerWorker();
        }
    }

    /**
     * Adds the data to the Queue like addToQueue() does, but without triggering any ServerCommunicator.sendAsync invocation.
     * Designed to be used by DevDebugDataQ which adds the aggregated debug-info data during onPreSentToWorker interception.
     */
    appendData(name ,data) {
        this._Q.push({
            eventName: name,
            data,
            shouldFlush: false,
            origin:this._dataOrigin,
        });
    }

    /**
     * Sends the Q in single messages. Used in case of an error in sending one of the messages due to its content.
     * In this case we don't want to loss all the data so we separate the sending to single message at a time
     * @private
     */
    _sendQInSingleMessagesToServerWorker() {
        for (let i = 0; i < this._Q.length; i++) {
            try {
                this._serverWorkerCommunicator.sendAsync(this._msgToWorker, this._Q[i]);
            } catch (error) {
                Log.error(`Failed sending single message data to worker. ${error}`);
            }
        }

        this._Q = [];
    }

    /**
     * Clear queues and notify worker on window closing to verify all data will be sent to server
     */
    _onUnload() {
        this.flushAllMessages();
    }

    filterOut(filter){
        this._Q = this._Q.filter(filter);
    }
}
