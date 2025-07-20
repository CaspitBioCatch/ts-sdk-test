import Log from "../../../../../technicalServices/log/Logger";

/**
 * BatchFontScanner
 * Efficiently detects fonts in a list by processing them in controlled batches.
 * This approach avoids blocking the browser's main thread and ensures responsiveness
 * for UI interactions.
 */
export default class BatchFontScanner {
    /**
     * @constructor
     * @param {Object} config - Configuration object.
     * @param {Object} config.utils - General utility functions (mandatory).
     * @param {Object} config.domUtils - DOM-specific utility functions (mandatory).
     * @param {Object} [config.detector=null] - Instance of a font detector.
     * @param {number} [config.batchSize=10] - Number of fonts to process per batch.
     */
    constructor({ utils, domUtils, detector = null, batchSize = 10, timeoutGap = 0 }) {
        if (!utils) throw new Error("The 'utils' parameter is required.");
        if (!domUtils) throw new Error("The 'domUtils' parameter is required.");

        this._logsTag = `[FONTS-COLLECTOR][BATCH-FONT-SCANNER]`;

        this._utils = utils;
        this._domUtils = domUtils;
        this.detector = detector;
        this.batchSize = batchSize;
        this.timeoutGap = timeoutGap;
        this._hasReleased = false;
    }

    /**
     * Releases resources associated with the BatchFontScanner.
     * Marks the scanner as released and prevents further operations.
     * 
     * @returns {Promise<void>} Resolves when all resources are released.
     */
    async release() {
        this._hasReleased = true;
        if (this.detector && typeof this.detector.release === "function") {
            await this.detector.release();
        }
    }

    /**
     * Scans the provided list of fonts to detect availability in the browser.
     * The operation is performed in batches to maintain responsiveness.
     * 
     * @param {Array<string>} fonts - List of font names to detect.
     * @returns {Promise<Array<string>>} A promise that resolves with a list of detected fonts.
     * @throws {Error} If the scanner has been released or is released during scanning.
     */
    async scan(fonts) {
        if (this._hasReleased) {
            throw new Error("BatchFontScanner has been released and cannot be used.");
        }

        if (!Array.isArray(fonts)) {
            throw new TypeError("The 'fonts' parameter must be an array.");
        }

        if (fonts.length === 0) {
            return [];
        }

        const detectedFonts = [];
        const batches = this._createBatchIndices(fonts.length, this.batchSize);

        for (const { start, end } of batches) {
            if (this._hasReleased) {
                throw new Error("BatchFontScanner was released during scanning. Operation aborted.");
            }

            const batchStartTime = performance.now();
            await this._processBatch(fonts.slice(start, end), detectedFonts);

            const batchDuration = performance.now() - batchStartTime;
            Log.trace(`${this._logsTag} Batch processed (${start}-${end}) in ${batchDuration.toFixed(2)}ms.`);

            if (end < fonts.length) {
                // Adds a delay between batches to release control back to the event loop
                // This is important to avoid blocking the UI thread with heavy operations
                // that may hinder responsiveness. It gives the browser some time to handle
                // other events like UI updates before starting the next batch.
                // Even delay of 0 release lock
                await this._delay(this.timeoutGap);
            }
        }

        if (this._hasReleased) {
            throw new Error("BatchFontScanner was released after scanning. Operation aborted.");
        }

        return detectedFonts;
    }

    /**
     * Processes a single batch of fonts by detecting their availability.
     * Fonts are processed sequentially to maintain control and ensure efficient use
     * of the browser's single-threaded nature.
     * 
     * @param {Array<string>} batch - Subset of font names to process.
     * @param {Array<string>} detectedFonts - Accumulated list of detected fonts.
     * @returns {Promise<void>} Resolves when the batch is processed.
     * @throws {Error} If the scanner is released during processing.
     */
    async _processBatch(batch, detectedFonts) {
        for (const font of batch) {
            if (this._hasReleased) {
                throw new Error("BatchFontScanner was released during batch processing. Operation aborted.");
            }

            try {
                const isDetected = await this.detector?.detect(font);
                if (isDetected) {
                    detectedFonts.push(font);
                }
            } catch (error) {
                Log.error(`Error detecting font "${font}":`, error);
            }
        }
    }

    /**
     * Creates batch indices to divide the font list into manageable chunks.
     * 
     * @param {number} listLength - Total number of fonts to process.
     * @param {number} batchSize - Number of fonts per batch.
     * @returns {Array<{start: number, end: number}>} List of batch index ranges.
     */
    _createBatchIndices(listLength, batchSize) {
        return Array.from({ length: Math.ceil(listLength / batchSize) }, (_, i) => ({
            start: i * batchSize,
            end: Math.min((i + 1) * batchSize, listLength),
        }));
    }

    /**
     * Introduces a delay between asynchronous operations to avoid blocking the event loop.
     * 
     * @param {number} ms - Delay duration in milliseconds.
     * @returns {Promise<void>} Resolves after the specified delay.
     */
    _delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
