import {MessageBusEventType} from "../events/MessageBusEventType";

class ElementBlurEventEmitter {

    constructor(messageBus, EventAggregator) {
        this._messageBus = messageBus;
        this._eventAggregator = EventAggregator;
    }

    start(elements) {
        elements.forEach((elem) => {
            this._eventAggregator.addEventListener(elem, 'blur', this.handleElementBlurEvents);
        });
    }

    stop(elements) {
        elements.forEach((elem) => {
            this._eventAggregator.removeEventListener(elem, 'blur', this.handleElementBlurEvents);
        });
    }

    handleElementBlurEvents = (e) => {
        this._messageBus.publish(MessageBusEventType.ElementBlurEvent, e);
    }
}

export default ElementBlurEventEmitter;
