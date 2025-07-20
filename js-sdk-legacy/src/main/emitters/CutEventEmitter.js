import { MessageBusEventType } from '../events/MessageBusEventType';

class CutEventEmitter {
    constructor(messageBus, EventAggregator) {
        this._messageBus = messageBus;
        this._eventAggregator = EventAggregator;
    }

    start(document) {
        if (!document) {
            throw new Error('invalid document parameter');
        }

        this._eventAggregator.addEventListener(document, 'cut', this.handleCutEvent);
    }

    stop(document) {
        if (!document) {
            throw new Error('invalid document parameter');
        }

        this._eventAggregator.removeEventListener(document, 'cut', this.handleCutEvent);
    }

    handleCutEvent = (e) => {
        this._messageBus.publish(MessageBusEventType.CutEvent, e);
    }
}

export default CutEventEmitter;
