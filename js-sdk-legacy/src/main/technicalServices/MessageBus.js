import * as CDMap from '../infrastructure/CDMap';
import * as CDSet from '../infrastructure/CDSet';

/**
 *
 */
class MessageBus {
    constructor() {
        this.subscribers = CDMap.create();
    }

    /**
     *
     * @param messageType
     * @param handler
     * @param isOneTime
     */
    subscribe(messageType, handler, isOneTime = false) {
        let listenersSet;
        let foundHandler = false;
        if (this.subscribers.has(messageType)) {
            listenersSet = this.subscribers.get(messageType);
            listenersSet && listenersSet.forEach(function (listener) {
                if (handler === listener.handler) {
                    foundHandler = true;
                }
            });
        } else {
            listenersSet = CDSet.create();
            this.subscribers.set(messageType, listenersSet);
        }
        if (!foundHandler) {
            listenersSet.add({ handler, isOneTime });
        }
    }

    /**
     *
     * @param messageType
     * @param handler
     */
    unsubscribe(messageType, handler) {
        if (messageType && this.subscribers.has(messageType)) {
            const listenersSet = this.subscribers.get(messageType);
            listenersSet && listenersSet.forEach(function (listener) {
                if (handler === listener.handler) {
                    listenersSet.delete(listener);
                }
            });
            if (listenersSet.size === 0) {
                this.subscribers.delete(messageType);
            }
        }
    }

    /**
     *
     * @param messageType
     * @param message
     */
    publish(messageType, message) {
        if (!messageType) {
            throw new Error('invalid argument messageType must be defined');
        }

        this._notifySubscribers(messageType, message);
    }

    /**
     *
     * @param messageType
     * @param message
     */
    _notifySubscribers(messageType, message) {
        const listenersSet = this.subscribers.get(messageType);
        listenersSet && listenersSet.forEach(function (listener) {
            listener.handler(message);
            if (listener.isOneTime) {
                listenersSet.delete(listener);
            }
        });
    }
}

export default MessageBus;
