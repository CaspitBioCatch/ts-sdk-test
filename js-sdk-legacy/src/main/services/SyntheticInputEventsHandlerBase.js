import { MessageBusEventType } from '../events/MessageBusEventType';

/**
 * Produce synthetic input events from keypress events
 */
export default class SyntheticInputEventsHandlerBase {
    constructor(messageBus, EventAggregator, CDUtils) {
        this._messageBus = messageBus;
        this._eventAggregator = EventAggregator;
        this._elementBindingWMap = new WeakMap();
        this._utils = CDUtils;

        this.defaultEventListener = [
            { event: 'keypress', handler: this.handleKeypressEvents.bind(this) },
        ];
    }

    handleKeypressEvents(event, frame) {
    }

    isJQueryDataSupported = (frame) => {
        return !(!frame.jQuery || !frame.jQuery._data);
    };

    registerElement(element, frame) {
        if (this._elementBindingWMap.has(element)) { // already binded
            return;
        }
        const _listeners = {};
        this.defaultEventListener.forEach((defaultEvent) => {
            const _listener = (e) => {
                defaultEvent.handler(e, frame);
            };
            _listeners[defaultEvent.event] = _listener;
            this._eventAggregator.addEventListener(element, defaultEvent.event, _listener);
        });
        this._elementBindingWMap.set(element, {
            isBinded: true,
            listeners: _listeners,
        });
    }

    unregisterElements(elements) {
        elements.forEach((elem) => {
            const elementBinding = this._elementBindingWMap.get(elem);

            if (!elementBinding || !elementBinding.isBinded) {
                return;
            }
            this.defaultEventListener.forEach((defaultEvent) => {
                this._eventAggregator.removeEventListener(elem, defaultEvent.event, elementBinding.listeners[defaultEvent.event]);
            });
            this._elementBindingWMap.delete(elem);
        });
    }

    publishEvent(event, jqueryMask, inputType, data) {
        const inputEvent = {
            bubbles: true,
            cancelBubble: false,
            cancelable: false,
            composed: true,
            currentTarget: null,
            data,
            dataTransfer: null,
            defaultPrevented: false,
            detail: 0,
            eventPhase: 0,
            inputType,
            isComposing: false,
            isTrusted: true,
            jqueryMask,
            returnValue: true,
            sourceCapabilities: null,
            srcElement: Object.assign(event.target || event.srcElement, {}),
            target: Object.assign(event.target, {}),
            timeStamp: event.timeStamp,
            type: 'input',
            view: null,
            which: 0,
        };

        this._messageBus.publish(MessageBusEventType.SyntheticInputMaskEvent, inputEvent);
    }
}
