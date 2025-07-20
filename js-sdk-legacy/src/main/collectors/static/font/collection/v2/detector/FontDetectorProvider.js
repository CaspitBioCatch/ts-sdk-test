import Log from "../../../../../../technicalServices/log/Logger";
import NativeFontDetector from "./NativeFontDetector";
import CanvasFontDetector from "./CanvasFontDetector";


/**
 * FontDetectorProvider
 * A class to select the best font detection implementation based on the current environment.
 * 
 * Preference Order:
 * 1. **NativeFontDetector**: Preferred for its native browser API usage and efficiency.
 * 2. **CanvasFontDetector**: Fallback for its simplicity, efficiency, and wide browser support. [20-30ms for 600 fonts - M3 PRO]
 * 
 */
export default class FontDetectorProvider {
    /**
     * @constructor
     * @param {Object} domUtils - Utility object for DOM-related operations.
     */
    constructor(domUtils) {
        if (!domUtils) throw new Error('domUtils is required for FontDetectorProvider.');

        this._domUtils = domUtils;
        this._logsTag = `[FONTS-COLLECTOR]`;
    }

    /**
     * Provides the best font detector based on the current environment.
     * 
     * @returns {FontDetector} An instance of the best available font detector.
     */
    getBestDetector() {
        // Detector preferences with explanations for their order
        const detectors = [
            {
                detector: () => { return new NativeFontDetector() },
                name: 'NativeFontDetector',
            },
            {
                detector: () => { return new CanvasFontDetector(this._domUtils) },
                name: 'CanvasFontDetector',
            },
        ];

        for (const { detector, name } of detectors) {
            try {
                const instance = detector();
                if (instance.isSupported()) {
                    Log.info(`${this._logsTag} Using ${name}`);
                    return instance;
                }
            } catch (error) {
                Log.error(`${this._logsTag} ${name} failed:`, error);
            }
        }

        throw new Error('[FontDetectorProvider] No suitable font detection implementation is supported in this environment.');
    }
}