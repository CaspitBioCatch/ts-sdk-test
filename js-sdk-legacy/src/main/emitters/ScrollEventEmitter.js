import { MessageBusEventType } from '../events/MessageBusEventType';

class ScrollEventEmitter {
    constructor(messageBus, EventAggregator) {
        this._messageBus = messageBus;
        this._eventAggregator = EventAggregator;
    }

    start(windowInstance) {
        if (!windowInstance) {
            throw new Error('invalid window parameter');
        }

        this._eventAggregator.addEventListener(windowInstance, 'scroll', this.handleScrollEvent, false, true);
    }

    stop(windowInstance) {
        if (!windowInstance) {
            throw new Error('invalid window parameter');
        }

        this._eventAggregator.removeEventListener(windowInstance, 'scroll', this.handleScrollEvent);
    }

    handleScrollEvent = (e) => {
        this._messageBus.publish(MessageBusEventType.ScrollEvent, e);
    }
}

export default ScrollEventEmitter;
