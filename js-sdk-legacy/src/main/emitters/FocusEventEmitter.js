import { MessageBusEventType } from '../events/MessageBusEventType';

class FocusEventEmitter {
    constructor(messageBus, EventAggregator) {
        this._messageBus = messageBus;
        this._eventAggregator = EventAggregator;
    }

    start(windowInstance) {
        if (!windowInstance) {
            throw new Error('invalid window parameter');
        }

        this._eventAggregator.addEventListener(windowInstance, 'focus', this.handleFocusEvent, false, true);
    }

    stop(windowInstance) {
        if (!windowInstance) {
            throw new Error('invalid window parameter');
        }

        this._eventAggregator.removeEventListener(windowInstance, 'focus', this.handleFocusEvent);
    }

    handleFocusEvent = (e) => {
        this._messageBus.publish(MessageBusEventType.FocusEvent, e);
    }
}

export default FocusEventEmitter;
