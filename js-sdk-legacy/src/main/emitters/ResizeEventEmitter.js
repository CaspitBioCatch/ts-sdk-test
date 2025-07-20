import { MessageBusEventType } from '../events/MessageBusEventType';

class ResizeEventEmitter {
    constructor(messageBus, EventAggregator) {
        this._messageBus = messageBus;
        this._eventAggregator = EventAggregator;
    }

    start(windowInstance) {
        if (!windowInstance) {
            throw new Error('invalid window parameter');
        }

        this._eventAggregator.addEventListener(windowInstance, 'resize', this.handleResizeEvent, false, true);
    }

    stop(windowInstance) {
        if (!windowInstance) {
            throw new Error('invalid window parameter');
        }

        this._eventAggregator.removeEventListener(windowInstance, 'resize', this.handleResizeEvent);
    }

    handleResizeEvent = (e) => {
        this._messageBus.publish(MessageBusEventType.ResizeEvent, e);
    }
}

export default ResizeEventEmitter;
