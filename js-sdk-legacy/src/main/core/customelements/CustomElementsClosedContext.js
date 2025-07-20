import BrowserContext from '../browsercontexts/BrowserContext';

/**
 * An instance of this class represents a Custom Element's direct access to the it's shadowRoot
 * Allows the representation of Custom Elements that their mode is set to closed
 * @example
 * const customElement = new CustomElementsClosedContext(someElement);
 * shadowRoot = customElement.getDocument();
 */
export default class CustomElementsClosedContext extends BrowserContext {
    /**
     *
     * @returns {Document}
     */
    getDocument() {
        return this.context;
    }
}
