import Event from './Event';
import { MessageBusEventType } from '../../events/MessageBusEventType';

/**
 * CustomInputEvents Controlled by ElementsEvent Data Collector using CustomInputElementSettings.
 * support collection of a single Input Element.
 */
class CustomInputEvents extends Event {
    constructor(
        elements,
        sendToQueue,
        CDUtils,
        messageBus,
        StandardCustomInputEmitter,
        maskingService,
        inputElementSettings
    ) {
        super();
        this._elements = elements;
        this._sendToQueue = sendToQueue;
        this._CDUtils = CDUtils;
        this._messageBus = messageBus;
        this._StandardCustomInputEmitter = StandardCustomInputEmitter;
        this._maskingService = maskingService;
        this._inputElementSettings = inputElementSettings;
        this._elementsFromDoc = {
            mainElement: '',
            customButtons: [],
        };
    }

    bind(browserContext) {
        if (
            !this._inputElementSettings?.parentElementSelector &&
            !this._inputElementSettings?.childElementWithCustomAttribute
        ) {
            return;
        }
        const doc = browserContext.getDocument();
        this._messageBus.subscribe(MessageBusEventType.CustomInputElement, this.handleInputEvents);
        const elements = [this._elementsFromDoc?.mainElement, ...this._elementsFromDoc.customButtons];
        if (this._elementsFromDoc?.mainElement === '') {
            this.getSelectElementsFromDoc(doc);
        }
        this.addListenersBySelector(elements);
    }

    unbind(browserContext) {
        if (
            !this._inputElementSettings?.parentElementSelector &&
            !this._inputElementSettings?.childElementWithCustomAttribute
        ) {
            return;
        }
        const doc = browserContext.getDocument();
        this._messageBus.subscribe(MessageBusEventType.CustomInputElement, this.handleInputEvents);
        const elements = [this._elementsFromDoc?.mainElement, ...this._elementsFromDoc.customButtons];
        if (this._elementsFromDoc?.mainElement === '') {
            this.getSelectElementsFromDoc(doc);
        }
        this.removeListenersBySelector(elements);
    }

    getSelectElementsFromDoc(doc) {
        const body = doc.querySelector('body');
        const mainElement = doc.querySelector(this._inputElementSettings?.childElementWithCustomAttribute);
        if (body) {
            if (mainElement) {
                this._elementsFromDoc.mainElement = mainElement;
            }
            if (this._inputElementSettings?.customButtons) {
                this._inputElementSettings?.customButtons.forEach((element) => {
                    const elem = doc.querySelector(element);
                    if (elem) {
                        this._elementsFromDoc.customButtons.push(elem);
                    }
                });
            }
        }
        return this._elementsFromDoc;
    }

    addListenersBySelector(elements) {
        if (this._elementsFromDoc?.mainElement && elements.length >= 1) {
            this._StandardCustomInputEmitter.start(elements);
        }
    }

    removeListenersBySelector(elements) {
        if (this._elementsFromDoc?.mainElement && elements.length >= 1) {
            this._StandardCustomInputEmitter.stop(elements);
        }
        this._elementsFromDoc = {
            mainElement: '',
            customButtons: [],
        };
    }

    /**
     * @param {BrowserContext} browserContext
     * @param isChange
     */
    addOnLoadInputData(browserContext, isChange) {
        if (
            !this._inputElementSettings?.parentElementSelector &&
            !this._inputElementSettings?.childElementWithCustomAttribute
        ) {
            return;
        }

        const doc = browserContext.getDocument();
        const elements = [this._elementsFromDoc?.mainElement, ...this._elementsFromDoc.customButtons];
        if (this._elementsFromDoc?.mainElement === '') {
            this.getSelectElementsFromDoc(doc);
        }
        if (this._elementsFromDoc?.mainElement && elements.length >= 1) {
            elements.forEach((element) => {
                if (this._elements.isListed(element)) {
                    if (!isChange) {
                        // on load and context change we need to report again elements
                        this._elements.resendElementPerContext(element); // this will cause the Elements class to add element event to Q
                    }
                } else {
                    this._elements.getElement(element, false); // this will cause the Elements class to add element event to Q
                }
            });
        }
    }

    handleInputEvents = (e) => {
        let newValue = '';
        let attribute = e?.getAttribute?.(this._inputElementSettings?.elementDataAttribute);

        if (attribute) {
            newValue = attribute;
        } else if (e?.target?.ariaValueNow) {
            newValue = e.target.ariaValueNow;
        } else if (e?.target?.value) {
            newValue = e.target?.value;
        } else if (e?.[this._inputElementSettings?.elementDataAttribute]) {
            newValue = e[this._inputElementSettings?.elementDataAttribute];
        }
        if (newValue !== '') {
            newValue = this._maskingService.maskText(newValue, e.id);
        }
        if (newValue === '') {
            return;
        }
        this._sendToQueue(e, {
            length: newValue?.length || 0,
            elementValues: newValue,
            selected: -1,
        });
    };
}

export default CustomInputEvents;
