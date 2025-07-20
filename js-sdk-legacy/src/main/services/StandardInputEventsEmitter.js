import Log from '../technicalServices/log/Logger';
import { MessageBusEventType } from '../events/MessageBusEventType';

export default class StandardInputEventsEmitter {
    /**
     * Constructs a new Input Events Emitter that supports emitting
     * input, focus and blur events
     */
    constructor(messageBus, EventAggregator, utils) {
        this._messageBus = messageBus;
        this._eventAggregator = EventAggregator;
        // Stores already binded elements
        this._elementBindingWMap = new WeakMap();
        this._utils = utils;
        this.defaultInputEventListener = [
            { event: 'input', handler: this.handleInputEvents },
            { event: 'focus', handler: this.handleFocusEvents },
            { event: 'blur', handler: this.handleBlurEvents },
        ];
    }

    start(elements, context, shouldSkipElement) {
        elements.forEach((elem) => {
            if (this._elementBindingWMap.has(elem)) { // already binded
                return;
            }

            let finalEvents = [];

            // Custom behavior of input event binding for special elements that should not report input event
            // This logic is currently related to input events only and supports the SyntheticParsely (parselyjs) assertion
            if (typeof shouldSkipElement !== 'undefined') {
                if (typeof shouldSkipElement.func === 'function'
                    && Array.isArray(shouldSkipElement.allowedEvents) && shouldSkipElement.allowedEvents.length > 0) {
                    // If provided func asserts this element should be skipped, move forward with allowed events only
                    if (shouldSkipElement.func(context, elem)) {
                        this.defaultInputEventListener.forEach((event) => {
                            if (shouldSkipElement.allowedEvents.includes(event.event)) {
                                finalEvents.push(event);
                            }
                        });
                    } else {
                        finalEvents = Array.from(this.defaultInputEventListener);
                    }
                }
            } else {
                finalEvents = Array.from(this.defaultInputEventListener);
            }

            finalEvents.forEach((defaultEvent) => {
                this._eventAggregator.addEventListener(elem, defaultEvent.event, defaultEvent.handler);
            });
            this._elementBindingWMap.set(elem, {
                isBinded: true,
                listeners: [
                    this.handleInputEvents,
                    this.handleFocusEvents,
                    this.handleBlurEvents,
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
            this.defaultInputEventListener.forEach((defaultEvent) => {
                this._eventAggregator.removeEventListener(elem, defaultEvent.event, defaultEvent.handler);
            });
            this._elementBindingWMap.delete(elem);
        });
    }

    /**
     * Includes support for standard EventAggregator and jQuery utils legacy event listener
     * @param element
     * @param isUseJQuery
     */
    addElementEvents(element, isUseJQuery = false) {
        if (this._elementBindingWMap.has(element)) { // already binded
            return;
        }

        if (isUseJQuery) {
            if (!this._utils.JQueryUtils.isJQueryAvailable()) {
                Log.error('Unable to add event listeners for element using jQuery because jQuery is not available');
                return;
            }

            this.defaultInputEventListener.forEach((defaultEvent) => {
                this._utils.JQueryUtils.addEventListener(element, defaultEvent.event, defaultEvent.handler);
            });
        } else {
            this.defaultInputEventListener.forEach((defaultEvent) => {
                this._eventAggregator.addEventListener(element, defaultEvent.event, defaultEvent.handler);
            });
        }

        this._elementBindingWMap.set(element, {
            isBinded: true,
            listeners: [
                this.handleInputEvents,
                this.handleFocusEvents,
                this.handleBlurEvents,
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

            this.defaultInputEventListener.forEach((defaultEvent) => {
                this._utils.JQueryUtils.removeEventListener(element, defaultEvent.event, defaultEvent.handler);
            });
        } else {
            this.defaultInputEventListener.forEach((defaultEvent) => {
                this._eventAggregator.removeEventListener(elements, defaultEvent.event, defaultEvent.handler);
            });
        }

        this._elementBindingWMap.delete(element);
    }

    /**
     *
     * @param e
     */
    handleInputEvents = (e) => {
        this._messageBus.publish(MessageBusEventType.StandardInputEvent, e);
    }

    /**
     *
     * @param e
     */
    handleFocusEvents = (e) => {
        this._messageBus.publish(MessageBusEventType.StandardInputFocusEvent, e);
    }

    /**
     *
     * @param e
     */
    handleBlurEvents = (e) => {
        this._messageBus.publish(MessageBusEventType.StandardInputBlurEvent, e);
    }
}
