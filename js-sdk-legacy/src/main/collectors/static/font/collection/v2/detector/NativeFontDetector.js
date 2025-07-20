import FontDetector from "./FontDetector";

// Comments:
// Safari has more local font access than Chrome.
// Chrome intentionally blocks most system fonts from web pages.
// Your FontDetector will not see fonts like Charter, PingFang, STIX, Phosphate in Chrome.

export default class NativeFontDetector extends FontDetector {
    constructor(document = window.document) {
        super();
        this._document = document;
        this._testSize = '16px'; // Font size for consistent testing
    }

    /**
     * Detect if a font family is available.
     * @param {string} fontName - The name of the font family to check.
     * @returns {Promise<boolean>} - Resolves to true if the font is available, false otherwise.
     */
    async detect(fontName) {
        try {
            // Create and load the font face
            const fontFace = new FontFace(fontName, `local("${fontName}")`);
            await fontFace.load();
            this._document.fonts.add(fontFace);

            // Check if the font is available
            const isAvailable = this._document.fonts.check(`${this._testSize} "${fontName}"`);

            // Cleanup: Remove the font from document.fonts
            this._document.fonts.delete(fontFace);

            return isAvailable;
        } catch (error) {
            // console.warn(`Font detection failed for "${fontName}":`, error);
            return false;
        }
    }

    /**
     * Check if the document.fonts API is supported.
     * @returns {boolean} - True if the API is supported, false otherwise.
     */
    isSupported() {
        return Boolean(this._document.fonts && typeof this._document.fonts.check === 'function');
    }

    /**
     * Release resources used by the font detection system.
     * @returns {void}
     */
    release() {
        // No resources to release
    }
}