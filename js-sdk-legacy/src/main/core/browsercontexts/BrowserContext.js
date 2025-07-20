import Log from "../../technicalServices/log/Logger";

/**
 * Represents a browser context with custom access to it's private DOM
 */
export default class BrowserContext {
    /**
     * @param {Window} context A DOM containing a document
     */
    constructor(context) {
        this.context = context || window.self;
    }

    get Context() {
        return this.context;
    }

    /**
     *
     * @returns {Document} an accessible browser context document
     */
    getDocument() {
        return this.context.document;
    }

    async collectAllElementsBySelectorAsync(elementSelectors, maxShadowDepth = 0, iframeLoadingTimeout = 5000) {
        const collected = [];

        async function collectFromRoot(root, currentShadowDepth = 0) {
            if (!root || typeof root.querySelectorAll !== 'function') return;

            // Collect from this root
            const matches = root.querySelectorAll(elementSelectors);
            matches.forEach(el => collected.push(el));

            // Traverse shadow roots and iframes
            const allElements = root.querySelectorAll('*');
            for (const el of allElements) {
                // ✅ Shadow DOM
                if (el.shadowRoot && currentShadowDepth < maxShadowDepth) {
                    await collectFromRoot(el.shadowRoot, currentShadowDepth + 1);
                }

                // ✅ Same-origin iframe
                if (el.tagName === 'IFRAME') {
                    try {
                        await waitForIframe(el);
                        const iframeDoc = el.contentDocument;
                        if (iframeDoc) {
                            await collectFromRoot(iframeDoc, currentShadowDepth);
                        }
                    } catch (err) {
                        Log.warn('Skipped iframe:', err.message, el.title);
                    }
                }
            }
        }
        // Helper: returns a Promise that resolves when iframe is loaded
        function waitForIframe(iframe) {
            return new Promise((resolve, reject) => {
                try {
                    // Already loaded?
                    const doc = iframe.contentDocument;
                    if (doc && doc.readyState === 'complete') return resolve();

                    iframe.addEventListener('load', () => resolve(), { once: true });

                    // Optional fallback timeout
                    setTimeout(() => reject(new Error('Iframe load timeout')), iframeLoadingTimeout);
                } catch (err) {
                    reject(err);
                }
            });
        }

        const rootDoc = this.getDocument?.() || document;
        await collectFromRoot(rootDoc);

        return collected;
    }


}
