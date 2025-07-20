import { MessageBusEventType } from '../events/MessageBusEventType';

class CopyEventEmitter {
    constructor(messageBus, EventAggregator) {
        this._messageBus = messageBus;
        this._eventAggregator = EventAggregator;
    }

    start(document) {
        if (!document) {
            throw new Error('invalid document parameter');
        }

        this._eventAggregator.addEventListener(document, 'copy', this.handleCopyEvent);
    }

    stop(document) {
        if (!document) {
            throw new Error('invalid document parameter');
        }

        this._eventAggregator.removeEventListener(document, 'copy', this.handleCopyEvent);
    }

    handleCopyEvent = (e) => {
        this._messageBus.publish(MessageBusEventType.CopyEvent, e);
    }
}

export default CopyEventEmitter;
