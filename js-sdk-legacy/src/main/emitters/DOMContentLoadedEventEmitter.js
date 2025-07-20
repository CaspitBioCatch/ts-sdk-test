import { MessageBusEventType } from '../events/MessageBusEventType';

class DOMContentLoadedEventEmitter {
    constructor(messageBus, EventAggregator) {
        this._messageBus = messageBus;
        this._eventAggregator = EventAggregator;
    }

    start(documentInstance) {
        if (!documentInstance) {
            throw new Error('invalid document parameter');
        }

        this._eventAggregator.addEventListener(documentInstance, 'DOMContentLoaded', this.handleDOMContentLoadedEvent);
    }

    stop(documentInstance) {
        if (!documentInstance) {
            throw new Error('invalid document parameter');
        }

        this._eventAggregator.removeEventListener(documentInstance, 'DOMContentLoaded', this.handleDOMContentLoadedEvent);
    }

    handleDOMContentLoadedEvent = (e) => {
        this._messageBus.publish(MessageBusEventType.DOMContentLoadedEvent, e);
    }
}

export default DOMContentLoadedEventEmitter;
