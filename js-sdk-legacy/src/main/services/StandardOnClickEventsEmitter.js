import Log from '../technicalServices/log/Logger';
import { MessageBusEventType } from '../events/MessageBusEventType';

class StandardOnClickEventsEmitter {
    /**
     * Constructs a new OnClick Events Emitter that supports emitting
     * click events
     */
    constructor(messageBus, EventAggregator, utils) {
        this._messageBus = messageBus;
        this._eventAggregator = EventAggregator;
        // Stores already binded elements
        this._elementBindingWMap = new WeakMap();
        this._utils = utils;
        this.defaultOnClickEventListener = [
            { event: 'click', handler: this.handleOnClickEvents },
        ];
    }

    start(elements) {
        elements.forEach((elem) => {
            if (this._elementBindingWMap.has(elem)) { // already binded
                return;
            }

            this.defaultOnClickEventListener.forEach((defaultEvent) => {
                this._eventAggregator.addEventListener(elem, defaultEvent.event, defaultEvent.handler);
            });
            this._elementBindingWMap.set(elem, {
                isBinded: true,
                listeners: [
                    this.handleOnClickEvents,
                ],
                isUsingJQuery: false,
            });
        });
    }

    stop(elements) {
        elements.forEach((elem) => {
            const elementBinding = this._elementBindingWMap.get(elem);

            if (!elementBinding || !elementBinding.isBinded) {
                return;
            }
            this.defaultOnClickEventListener.forEach((defaultEvent) => {
                this._eventAggregator.removeEventListener(elem, defaultEvent.event, defaultEvent.handler);
            });
            this._elementBindingWMap.delete(elem);
        });
    }

    addElementEvents(element, isUseJQuery = false) {
        if (this._elementBindingWMap.has(element)) { // already binded
            return;
        }

        if (isUseJQuery) {
            if (!this._utils.JQueryUtils.isJQueryAvailable()) {
                Log.error('Unable to add event listeners for element using jQuery because jQuery is not available');
                return;
            }

            this.defaultOnClickEventListener.forEach((defaultEvent) => {
                this._utils.JQueryUtils.addEventListener(element, defaultEvent.event, defaultEvent.handler);
            });
        } else {
            this.defaultOnClickEventListener.forEach((defaultEvent) => {
                this._eventAggregator.addEventListener(element, defaultEvent.event, defaultEvent.handler);
            });
        }

        this._elementBindingWMap.set(element, {
            isBinded: true,
            listeners: [
                this.handleOnClickEvents,
            ],
            isUsingJQuery: isUseJQuery,
        });
    }

    removeElementEvents(element) {
        const elementBinding = this._elementBindingWMap.get(element);

        if (!elementBinding || !elementBinding.isBinded) {
            return;
        }

        if (elementBinding.isUsingJQuery) {
            if (!this._utils.JQueryUtils.isJQueryAvailable()) {
                Log.error('Unable to remove event listeners for element using jQuery because jQuery is not available');
                return;
            }

            this.defaultOnClickEventListener.forEach((defaultEvent) => {
                this._utils.JQueryUtils.removeEventListener(element, defaultEvent.event, defaultEvent.handler);
            });
        } else {
            this.defaultOnClickEventListener.forEach((defaultEvent) => {
                this._eventAggregator.removeEventListener(elements, defaultEvent.event, defaultEvent.handler);
            });
        }

        this._elementBindingWMap.delete(element);
    }

    handleOnClickEvents = (e) => {
        this._messageBus.publish(MessageBusEventType.StandardOnClickEvent, e);
    }
}

export default StandardOnClickEventsEmitter;
