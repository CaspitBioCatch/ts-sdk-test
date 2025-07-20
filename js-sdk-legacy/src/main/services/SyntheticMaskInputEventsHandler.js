import SyntheticInputEventsHandlerBase from './SyntheticInputEventsHandlerBase';

/**
 * Produce synthetic input events from keypress events
 */
export default class SyntheticMaskInputEventsHandler extends SyntheticInputEventsHandlerBase {
    start(elements, frame) {
        frame = frame || window.self;

        elements.forEach((elem) => {
            if (!this.isJQueryDataSupported(frame) || !this.hasMaskEventSupported(elem, frame)) return;

            this.registerElement(elem, frame);
        });
    }

    stop(elements) {
        this.unregisterElements(elements);
    }

    /**
     * Detect whether the requested element has the "events" property
     * defined by the jQuery _data method
     * @param element
     * @param frame
     * @returns {boolean}
     */
    hasMaskEventSupported(element, frame) {
        const jQueryEvents = frame.jQuery._data(element, 'events');
        if (typeof jQueryEvents === 'undefined') return false;
        const targetEvents = Object.keys(jQueryEvents);
        for (let i = 0; i < targetEvents.length; i++) {
            if (targetEvents[i] === 'unmask') {
                return true;
            }
        }
        return false;
    }

    /**
     *
     * @param event
     * @param frame
     */
    handleKeypressEvents(event, frame) {
        if (!this.isJQueryDataSupported(frame) || !this.hasMaskEventSupported(event.target, frame)) return;

        const jQueryMask = 'maskedInput';
        const inputType = 'insertText';
        const data = event.key;

        this.publishEvent(event, jQueryMask, inputType, data);
    }
}
