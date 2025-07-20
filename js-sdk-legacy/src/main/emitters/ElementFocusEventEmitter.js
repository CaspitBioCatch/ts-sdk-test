import {MessageBusEventType} from "../events/MessageBusEventType";

class ElementFocusEventEmitter {

    constructor(messageBus, EventAggregator) {
        this._messageBus = messageBus;
        this._eventAggregator = EventAggregator;
    }

    start(elements) {
        elements.forEach((elem) => {
                this._eventAggregator.addEventListener(elem, 'focus', this.handleElementFocusEvents);
        });
    }

    stop(elements) {
        elements.forEach((elem) => {
            this._eventAggregator.removeEventListener(elem, 'focus', this.handleElementFocusEvents);
        });
    }

    handleElementFocusEvents = (e) => {
        this._messageBus.publish(MessageBusEventType.ElementFocusEvent, e);
    }
}

export default ElementFocusEventEmitter;
