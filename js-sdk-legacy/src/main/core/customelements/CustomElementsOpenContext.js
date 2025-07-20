import BrowserContext from '../browsercontexts/BrowserContext';

/**
 * An instance of this class represents a WebComponent/Shadow DOM context
 * @example
 * const customElement = new CustomElementsContext(someElement);
 * shadowRoot = customElement.getDocument();
 */
export default class CustomElementsOpenContext extends BrowserContext {
    /**
     *
     * @returns {Document} ShadowRoot
     */
    getDocument() {
        return this.context.shadowRoot;
    }
}
