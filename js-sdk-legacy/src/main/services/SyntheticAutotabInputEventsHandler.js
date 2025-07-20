import SyntheticInputEventsHandlerBase from './SyntheticInputEventsHandlerBase';

/**
 * Produce synthetic input events from keypress events
 */
export default class SyntheticAutotabInputEventsHandler extends SyntheticInputEventsHandlerBase {
    start(elements, context) {
        elements.forEach((elem) => {
            if (!this.isJQueryDataSupported(context) || !this.hasjQueryAutoTab(elem, context)) return;

            this.registerElement(elem, context);
        });
    }

    stop(elements) {
        this.unregisterElements(elements);
    }

    /**
     * The purpose of this method is to try and fetch jQuery registered
     * events and report if autotab is detected.
     * @returns {boolean}
     */
    hasjQueryAutoTab(element, frame) {
        const jQueryEvents = frame.jQuery._data(element, 'events');
        if (typeof jQueryEvents === 'undefined') return false;
        const targetEvents = Object.keys(frame.jQuery._data(element, 'events'));
        for (let i = 0; i < targetEvents.length; i++) {
            if (targetEvents[i].indexOf('autotab') !== -1) {
                return true;
            }
        }
        return false;
    }

    handleKeypressEvents(event, frame) {
        if (!this.isJQueryDataSupported(frame) || !this.hasjQueryAutoTab(event.target, frame)) return;

        const jQueryMask = 'autotab';
        const inputType = 'insertText';
        const data = event.key;
        if (event.keyCode === 8) {
            // Prevent double input events report in case of autotab that reports both input event
            // and key event in case of pressing the backspace (keyCode 8)
            return;
        }

        this.publishEvent(event, jQueryMask, inputType, data);
    }
}
