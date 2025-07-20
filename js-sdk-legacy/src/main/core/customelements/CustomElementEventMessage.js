export const CustomElementEventMessageActions = {
    added: 'added',
    removed: 'removed',
};

/**
 * Represents a Custom Element message emitted by CustomElementsDetector
 */
export default class CustomElementEventMessage {
    /**
     * @param {BrowserContext} browserContext
     * @param {string} message
     */
    constructor(browserContext, message) {
        this.browserContext = browserContext;
        this.message = message;
    }
}
