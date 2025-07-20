import { MessageBusEventType } from '../events/MessageBusEventType';

class StandardCustomInputEmitter {
    constructor(messageBus, eventAggregator, utils) {
        this._messageBus = messageBus;
        this._eventAggregator = eventAggregator;
        this._utils = utils;
        this._elementsBindingWMap = new WeakMap();
        this.customInputEventListener = [
            { event: 'mouseenter', handler: this.handleMouseEnter },
            { event: 'focus', handler: this.handleFocus },
        ];
        this.defaultOnClickEventListener = [{ event: 'click', handler: this.handleOnClickEvents }];
        this._mainElm = '';
        this._mainTagName = ['SPAN', 'DIV'];
        this._btnTagName = 'BUTTON';
        this._btnInnerText = ['+', '-'];
    }

    start(elements) {
        if (elements) {
            elements.forEach((element) => {
                if (this._elementsBindingWMap.has(element)) {
                    // already binded
                    return;
                }
                if (element?.tagName && this._mainTagName.includes(element.tagName)) {
                    this._mainElm = element;

                    this.customInputEventListener.forEach((defaultEvent) => {
                        this._eventAggregator.addEventListener(element, defaultEvent.event, defaultEvent.handler);
                    });

                    this._elementsBindingWMap.set(element, {
                        isBinded: true,
                        listeners: [this.handleMouseEnter, this.handleFocus],
                        isUsingJQuery: false,
                    });
                }
                if (
                    (element?.tagName && element.tagName === this._btnTagName) ||
                    (element?.innerText && this._btnInnerText.includes(element.innerText))
                ) {
                    this.defaultOnClickEventListener.forEach((defaultEvent) => {
                        this._eventAggregator.addEventListener(element, defaultEvent.event, defaultEvent.handler);
                    });
                    this._elementsBindingWMap.set(element, {
                        isBinded: true,
                        listeners: [this.handleOnClickEvents],
                        isUsingJQuery: false,
                    });
                }
            });
        }
    }

    stop(elements) {
        elements.forEach((element) => {
            const elementBinding = this._elementsBindingWMap.get(element);

            if (!elementBinding?.isBinded) {
                return;
            }

            if (element?.tagName && this._mainTagName.includes(element.tagName)) {
                this.customInputEventListener.forEach((defaultEvent) => {
                    this._eventAggregator.removeEventListener(element, defaultEvent.event, defaultEvent.handler);
                });
            }

            if (
                (element?.tagName && element.tagName === this._btnTagName) ||
                (element?.innerText && this._btnInnerText.includes(element.innerText))
            ) {
                this.defaultOnClickEventListener.forEach((defaultEvent) => {
                    this._eventAggregator.removeEventListener(element, defaultEvent.event, defaultEvent.handler);
                });
            }

            this._elementsBindingWMap.delete(element);
        });
    }

    mousemove = (e) => {
        this._messageBus.publish(MessageBusEventType.CustomInputElement, e);
    };

    keydown = (e) => {
        this._messageBus.publish(MessageBusEventType.CustomInputElement, e);
    };

    mouseleave = (e) => {
        this._eventAggregator.removeEventListener(e.target, 'mousemove', this.mousemove);
        this._messageBus.publish(MessageBusEventType.CustomInputElement, e);
    };

    mouseup = (e) => {
        this._eventAggregator.removeEventListener(e.target, 'mousemove', this.mousemove);
        this._eventAggregator.removeEventListener(e.target, 'mouseleave', this.mouseleave);
    };

    mousedown = (e) => {
        this._eventAggregator.addEventListener(e.target, 'mousemove', this.mousemove);
        this._eventAggregator.addEventListener(e.target, 'mouseleave', this.mouseleave);
        this._eventAggregator.addEventListener(e.target, 'mouseup', this.mouseup);
        this._eventAggregator.addEventListener(e.target, 'keydown', this.keydown);
    };

    handleFocus = (e) => {
        this._messageBus.publish(MessageBusEventType.CustomInputElement, e);
    };

    handleMouseEnter = (e) => {
        this._eventAggregator.addEventListener(e.target, 'mousedown', this.mousedown);
    };

    handleOnClickEvents = () => {
        this._messageBus.publish(MessageBusEventType.CustomInputElement, this._mainElm);
    };
}

export default StandardCustomInputEmitter;
