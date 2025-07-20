import { MessageBusEventType } from '../events/MessageBusEventType';

class PasteEventEmitter {
    constructor(messageBus, EventAggregator) {
        this._messageBus = messageBus;
        this._eventAggregator = EventAggregator;
    }

    start(document) {
        if (!document) {
            throw new Error('invalid document parameter');
        }

        this._eventAggregator.addEventListener(document, 'paste', this.handlePasteEvent);
    }

    stop(document) {
        if (!document) {
            throw new Error('invalid document parameter');
        }

        this._eventAggregator.removeEventListener(document, 'paste', this.handlePasteEvent);
    }

    handlePasteEvent = (e) => {
        this._messageBus.publish(MessageBusEventType.PasteEvent, e);
    }
}

export default PasteEventEmitter;
