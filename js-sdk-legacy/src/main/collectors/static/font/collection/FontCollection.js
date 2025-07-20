import Log from '../../../../technicalServices/log/Logger';
import FontVersionType from './v2/types/FontVersionType';
import FontsCache from './v2/FontsCache';
import FontsProvider from './FontsProvider'
import resolveFontScanner from "./FontScannerResolver";


export default class FontCollection {

    /**
     * Constructor for FontCollectionFeature
     * @param {CDUtils} utils - Provides general utility methods.
     * @param {DOMUtils} domUtils - Handles DOM-related operations.
     * @param {DataQueue} dataQueue - Manages queuing and processing of font data.
     * @param {ConfigurationRepository} configRepo - Provides configuration settings.
     * @param {FontScanner} [fontScanner] - Optional font scanner instance. Defaults to a new FontScanner.
     * @param {FontsProvider} [fontsProvider] - Optional fonts provider instance. Defaults to a new FontsProvider.
     * @param {FontVersionType} fontVersion - Specifies the version of fonts to detect (use FontVersionType enum).
     * @throws {Error} If the font version is invalid or unsupported.
     */

    constructor(
        utils,
        domUtils,
        dataQueue,
        configRepo,
        fontVersion,
        fontScanner = null,
        fontsProvider = null,
        fontsCache = null,
        fontDetector = null,) {

        if (!utils) throw new Error(`CDUtils instance is required.`);
        if (!domUtils) throw new Error(`DOMUtils instance is required.`);
        if (!dataQueue) throw new Error(`DataQueue instance is required.`);
        if (!configRepo) throw new Error(`ConfigurationRepository instance is required.`);
        if (!Object.values(FontVersionType).includes(fontVersion)) {
            throw new Error(`Invalid font version type. Use one of: ${Object.keys(FontVersionType).join(", ")}`);
        }

        this._logsTag = `[FONTS-COLLECTOR][${fontVersion}]`;

        this._utils = utils;
        this._domUtils = domUtils;
        this._dataQueue = dataQueue;
        this._configRepo = configRepo;

        this._fontVersion = fontVersion;

        this._fontScanner = fontScanner ?? resolveFontScanner({
            utils: utils,
            domUtils: domUtils,
            configurationRepository: configRepo,
            fontVersion: fontVersion,
            fontDetector
        });

        this._fontsProvider = fontsProvider || new FontsProvider();

        this._fontCache = fontsCache || new FontsCache(utils.StorageUtils);
        this._fontCacheExpiration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    }

    async collectFonts() {
        // Log the initiation of the font collection process.
        Log.info(`${this._logsTag} Starting font collection.` + ` | Font version: ${this._fontVersion}`);

        // Retrieve cached font data based on the current font version.
        const cachedFontData = this._fontCache.getStoredFonts(this._fontVersion);
        const cachedFonts = cachedFontData?.installedFonts ?? cachedFontData; // Extract installed fonts from cache, or use the entire cache object.
        const lastCacheTimestamp = cachedFontData?.scannedAt ?? -1; // Extract the last scanned timestamp, defaulting to -1 if not available.

        // Log the retrieved cached fonts for debugging purposes.
        Log.debug(`${this._logsTag} Cached fonts retrieved: ${JSON.stringify(cachedFonts)}`);

        try {

            // Determine if the cached data is expired based on the last scanned timestamp.
            const lastScanExpired = (Date.now() - lastCacheTimestamp) > this._fontCacheExpiration;

            // Validate the cache: it must exist, and not be expired.
            const isCacheValid = cachedFonts && !lastScanExpired;
            if (isCacheValid) {
                Log.info(`${this._logsTag} Font collection complete using valid cache.`);
                return cachedFonts; // Exit the function since valid cached fonts were used.
            }

            // If the cache is invalid or expired, perform a fresh scan for installed fonts.
            const { installedFonts, scannedAt, scanTime, totalFontsScanned, totalFontsFound } = await this._scanForInstalledFonts()

            if (this._collectorHasStopped) return;

            // Log the detected fonts for debugging purposes.
            const fontsHash = this._utils.getHash(JSON.stringify(installedFonts));
            Log.debug(`${this._logsTag} Detected fonts: ${JSON.stringify(installedFonts)} | Hash: ${fontsHash} | Count: ${totalFontsFound}`);

            // Save the newly scanned fonts to the cache for future use.
            await this._fontCache.saveFonts({ installedFonts, scannedAt }, this._fontVersion);
            Log.debug(`${this._logsTag} Font cache updated with new fonts.`);

            // Enqueue the newly scanned font data for further processing.
            Log.info(`${this._logsTag} Font collection complete. Scan time: ${scanTime}ms. Total Fonts Scanned: ${totalFontsScanned} Total Installed Fonts: ${installedFonts.length}`);
            return installedFonts;
        } catch (error) {
            // Log any errors that occur during the font collection process.
            Log.error(`${this._logsTag} Error during font collection:`, error);
            // Return cached fonts if available, even if there was an error
            return cachedFonts || [];
        }
    }

    release() {
        this._collectorHasStopped = true;
        this._fontScanner.release();
    }

    async _scanForInstalledFonts() {
        Log.info(`${this._logsTag} Starting font scanning process.`);

        const startTime = Date.now();

        const fontsToScan = this._fontsProvider.getFontsByVersion(this._fontVersion);
        const installedFonts = new Set();
        
        // Use a single scanner instance for all font families to avoid concurrent processing
        for (const [fontFamily, fonts] of Object.entries(fontsToScan)) {
            const result = await this._fontScanner.scan(fonts, fontFamily)
            result.forEach(font => installedFonts.add(font));
        }

        const scanTime = Date.now() - startTime;

        // Calculate total fonts to scan
        const totalFontsScanned = Object.values(fontsToScan).reduce((sum, fonts) => { return sum + fonts.length }, 0);
        return {
            installedFonts: Array.from(installedFonts),
            scanTime,
            scannedAt: Date.now(),
            totalFontsScanned: totalFontsScanned,
            totalFontsFound: installedFonts.size,
        };
    }
}
