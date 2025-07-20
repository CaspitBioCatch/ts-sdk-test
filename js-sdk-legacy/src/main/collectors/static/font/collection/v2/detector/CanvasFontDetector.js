import FontDetector from "./FontDetector";

/**
 * CanvasFontDetector
 * Detects font availability using the canvas text measurement technique.
 */
export default class CanvasFontDetector extends FontDetector {
    constructor(domUtils) {
        super();

        this._domUtils = domUtils;
        this._testText = "AaBb123!@# אבגד אبت 你好世 あア अआऋИΔ สวั อา რუც კзءλ ⵍ 𐌄 фغ😀✔"; // Sample text for measurement
        this._fontSize = "48px"; // Font size for measurements
        this._canvas = null; // Reusable canvas element
        this._context = null; // Cached 2D context
    }

    /**
     * Detects the availability of a specified font.
     * Compares the width of the font's rendering against a fallback font.
     * 
     * @param {string} fontName - The name of the font to check.
     * @returns {Promise<boolean>} Resolves to `true` if the font is available, `false` otherwise.
     */
    async detect(fontName) {
        if (this._hasReleased) {
            throw new Error('CanvasFontDetector has been released and is no longer usable. Please create a new instance to use the detector.');
        }
        // Ensure initialization
        if (!this._initialized) {
            await this._initialize();
        }

        // Measure the width with fallback font only
        this._context.font = `${this._fontSize} "non-existed-font", non-existed-fallback`;
        const fallbackWidth = this._context.measureText(this._testText).width;

        // Measure the width of the test font with the given fontFamily as fallback
        this._context.font = `${this._fontSize} "${fontName}", non-existed-fallback`;
        const testWidth = this._context.measureText(this._testText).width;

        // Compare the test width against the fallback width
        return testWidth !== fallbackWidth; // Font is available if widths differ
    }

    /**
     * Releases resources by cleaning up cached data and canvas elements.
     */
    async release() {
        this._hasReleased = true;
        this._canvas = null;
        this._context = null;
    }

    /**
     * Checks if the canvas-based font detection system is supported by the browser.
     * 
     * @returns {boolean} True if canvas is supported, false otherwise.
     */
    isSupported() {
        try {
            const canvas = document.createElement('canvas');
            return Boolean(canvas.getContext && canvas.getContext('2d'));
        } catch {
            return false;
        }
    }

    /**
     * Ensures the canvas-based font detection system is initialized.
     * Sets up the canvas for text measurements.
     * 
     * @returns {Promise<void>} Resolves when initialization is complete.
     */
    async _initialize() {
        // Wait for the document to be ready
        await this._domUtils.awaitWindowDocumentReady(window)

        // Set up canvas and context
        this._canvas = document.createElement('canvas');
        this._context = this._canvas.getContext('2d');
        this._context.textBaseline = 'alphabetic';
        this._context.direction = 'ltr';

        this._initialized = true; // Mark as initialized
    }
}