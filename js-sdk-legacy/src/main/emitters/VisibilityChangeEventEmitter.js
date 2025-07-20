import { MessageBusEventType } from '../events/MessageBusEventType';

class VisibilityChangeEventEmitter {
    constructor(messageBus, EventAggregator) {
        this._messageBus = messageBus;
        this._eventAggregator = EventAggregator;
    }

    start(windowInstance) {
        if (!windowInstance) {
            throw new Error('invalid document parameter');
        }

        this._eventAggregator.addEventListener(windowInstance, 'visibilitychange', this.handleVisibilityChangeEvent, false, true);
    }

    stop(windowInstance) {
        if (!windowInstance) {
            throw new Error('invalid document parameter');
        }

        this._eventAggregator.removeEventListener(windowInstance, 'visibilitychange', this.handleVisibilityChangeEvent);
    }

    handleVisibilityChangeEvent = (e) => {
        this._messageBus.publish(MessageBusEventType.VisibilityChangeEvent, e);
    }
}

export default VisibilityChangeEventEmitter;
