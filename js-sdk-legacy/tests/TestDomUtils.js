// eslint-disable-next-line max-classes-per-file
export default class TestDomUtils {
    /**
     * Clear all child elements of the element
     * @param element - the element for which all child elements will be cleared
     */
    static clearChildElements(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    /**
     * Create a new custom element
     * @param {string} tagname must contain at least one dash
     * @param {string} shadowMode can be 'open' or 'closed
     * @param {boolean} returnShadowRoot whether the shadowRoot should be returned or not
     */
    static createCustomElement(tagname, shadowMode, returnShadowRoot = false) {
        let elementShadowRoot = null;
        customElements.define(tagname, class extends HTMLElement {
            constructor() {
                super();

                const root = this.attachShadow({ mode: shadowMode, delegatesFocus: true });
                root.innerHTML = `
                    <div id="sd_div">
                        <form>
                            <input type="text" name="sd_input_text" id="sd_input_text" />
                        </form>
                    </div>
                `;

                elementShadowRoot = root;
            }
        });

        const customElement = document.createElement(tagname);

        if (returnShadowRoot) {
            return { customElement, elementShadowRoot };
        }

        return customElement;
    }

    static createCustomElementSelect(tagname, shadowMode, returnShadowRoot = false) {
        let elementShadowRoot = null;
        customElements.define(tagname, class extends HTMLElement {
            constructor() {
                super();

                const root = this.attachShadow({ mode: shadowMode, delegatesFocus: true });
                root.innerHTML = `
                    <div id="sd_div">
                        <form>
                            <select class="browser-default" id="select1">
                        <option value="" disabled selected>Choose your option</option>
                        <option value="1">Option 1</option>
                        <option value="2">Option 2</option>
                        <option value="3">Option 3</option>
                            </select>
                        </form>
                    </div>
                `;

                elementShadowRoot = root;
            }
        });

        const customElement = document.createElement(tagname);

        if (returnShadowRoot) {
            return { customElement, elementShadowRoot };
        }

        return customElement;
    }

    static createCustomElementCheckBox(tagname, shadowMode, returnShadowRoot = false) {
        let elementShadowRoot = null;
        customElements.define(tagname, class extends HTMLElement {
            constructor() {
                super();

                const root = this.attachShadow({ mode: shadowMode, delegatesFocus: true });
                root.innerHTML = `
                    <div id="sd_div">
                        <form>
                            <input type="checkbox" name="checkbox" id="cb1" />
                        </form>
                    </div>
                `;

                elementShadowRoot = root;
            }
        });

        const customElement = document.createElement(tagname);

        if (returnShadowRoot) {
            return { customElement, elementShadowRoot };
        }

        return customElement;
    }
}
