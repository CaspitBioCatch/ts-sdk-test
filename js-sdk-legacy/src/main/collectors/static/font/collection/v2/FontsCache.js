import Log from '../../../../../technicalServices/log/Logger';
import FontVersionType from './types/FontVersionType';

export default class FontsCache {
    /**
     * Constructor for FontsCache
     * @param {Object} storageUtils - Utility for handling storage operations.
     * @param {Object} versionKeys - Mapping of font versions to storage keys.
     */
    constructor(storageUtils) {
        this._storageUtils = storageUtils;
        this._versionKeys = {
            [FontVersionType.VERSION1]: 'detectedFonts_2.1.5',
            [FontVersionType.VERSION2]: 'detectedFonts_3',
        };
    }

    /**
     * Saves detected fonts to local storage based on the font version.
     * @param {string} fonts - Comma-separated string of fonts to save.
     * @param {FontVersionType} fontVersion - The font version to determine the storage key.
     */
    async saveFonts(fonts, fontVersion) {
        const key = this._getKeyByVersion(fontVersion);
        Log.debug(`[FONTS-COLLECTOR][${fontVersion}] Saving fonts to localStorage under key: ${key}`);
        await this._storageUtils.saveToLocalStorage(key, fonts);
    }

    /**
     * Retrieves stored fonts from local storage based on the font version.
     * @param {FontVersionType} fontVersion - The font version to determine the storage key.
     * @returns {string|null} - The stored fonts or null if none exist.
     */
    getStoredFonts(fontVersion) {
        const key = this._getKeyByVersion(fontVersion);
        const storedFonts = this._storageUtils.getFromLocalStorage(key);
        Log.debug(`[FONTS-COLLECTOR][${fontVersion}] Retrieved fonts from localStorage under key ${key}: ${storedFonts}`);
        return storedFonts;
    }

    /**
     * Private method to determine the storage key based on the font version.
     * @param {FontVersionType} fontVersion - The font version to determine the key.
     * @returns {string} - The corresponding storage key.
     * @throws {Error} - If the font version type is unsupported.
     */
    _getKeyByVersion(fontVersion) {
        const key = this._versionKeys[fontVersion];
        if (!key) {
            throw new Error(`Unsupported font version type: ${fontVersion}`);
        }
        return key;
    }
}
