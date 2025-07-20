/**
 * FontDetectorInterface
 * Defines the required methods for a font detector implementation.
 */
export default class FontDetector {
    /**
     * Checks the availability of a group of fonts.
     * @param {Array<string>} fontName - A font name to check.
     * @returns {Promise<Array<string>>} A promise that resolves with the list of detected fonts.
     * @throws {Error} Throws an error if the number of fonts exceeds the allowed limit.
     */
    // eslint-disable-next-line no-unused-vars
    async detect(fontName, fontFamily) {
        throw new Error('Method "checkFontList" must be implemented.');
    }

    /**
     * Releases resources used by the font detection system, such as cleaning up DOM elements.
     * @returns {void}
     */
    release() {
        throw new Error('Method "release" must be implemented.');
    }

    /**
     * Checks if the font detection mechanism is supported by the environment.
     * This function can be overridden by implementations to provide specific checks
     * (e.g., availability of `document.fonts` or other APIs).
     * @returns {boolean} True if supported, false otherwise.
     */
    isSupported() {
        throw new Error('Method "isSupported" must be implemented.');
    }
}