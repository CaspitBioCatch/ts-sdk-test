import * as CDMap from '../infrastructure/CDMap';
import * as CDSet from '../infrastructure/CDSet';

// The WorkerCommunicator can communicate between the main and the worker and also can
// exist in the worker and communicate with the main. All depends on the implementation
// of messagePort. messagePort is an object that must implement onmessage and potMessage functions
export default class WorkerCommunicator {
    constructor() {
        this._msgListeners = CDMap.create();
    }

    setMessagingPort(messagePort) {
        this._messagePort = messagePort;
        messagePort.setonmessage((e) => {
            const msg = e.data;
            const oneTimeListeners = [];
            // call the relevant msg listeners by the msgType
            const listenersSet = this._msgListeners.get(msg.msgType);
            listenersSet && listenersSet.forEach(function (listener) {
                listener.callback(msg.data);
                if (listener.isOneTime) {
                    oneTimeListeners.push(listener);
                }
            });

            // Remove one time listeners out side of the main foreach since otherwise you get unexpected results (think about it)
            oneTimeListeners.forEach((item) => {
                listenersSet.delete(item);
            });
        });
    }
    
    // All the parameters after data are optional. Using them is just a shortcut for calling addMessageListener separately
    sendAsync(msgType, data, responseMsgType, onResponse, isOneTime) {
        if (onResponse && responseMsgType) {
            this.addMessageListener(responseMsgType, onResponse, isOneTime);
        }
        this._messagePort.postMessage({ msgType, data });
    }

    addMessageListener(msgType, callback, isOneTime) {
        let listenersSet = null;
        if (this._msgListeners.has(msgType)) {
            listenersSet = this._msgListeners.get(msgType);
        } else {
            listenersSet = CDSet.create();
            this._msgListeners.set(msgType, listenersSet);
        }

        listenersSet.add({
            callback,
            isOneTime,
        });
    }
}
