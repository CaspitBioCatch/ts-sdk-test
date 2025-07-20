import BrowserContext from '../browsercontexts/BrowserContext';

/**
 * Represents a FRAME/IFRAME based browser context
 */
export default class FrameContext extends BrowserContext {
    /**
     * Return the private DOM of this context
     * @returns {Document}
     */
    getDocument() {
        return this.context.document || this.context.contentDocument;
    }
}
