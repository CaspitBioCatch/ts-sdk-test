import DataCollector from '../../../DataCollector';
import Log from '../../../../technicalServices/log/Logger';
import { FontsDetectionContract, FontDataType } from '../../../../contract/staticContracts/FontsDetectionContract';
import FontVersionType from './v2/types/FontVersionType';
import FontCollection from './FontCollection';
import FontMigrationStage from './v2/types/FontMigrationStage';
import { ConfigurationFields } from '../../../../core/configuration/ConfigurationFields';


const featureSettings = {
    configKey: 'isFonts',
    isDefault: false,
    shouldRunPerContext: false,
    shouldRunPerSession: true,
    shouldRun: true,
    isFrameRelated: false,
    runInUns: true,
    runInSlave: false,
    runInLean: false,
    isRunning: false,
    instance: null,
};

/**
 * FontCollectionFeature
 * 
 * Collects installed fonts using two detection strategies:
 * - **Canvas Detection**: Measures text dimensions via the Canvas API, offering fast and reliable detection across modern browsers.
 * - **DOM Detection**: Compares text dimensions in hidden spans against baseline fonts, serving as a fallback for restricted or older environments.
 *
 * ## Architecture:
 * - **Scanner**: Splits font lists into batches for efficient, non-blocking processing.
 * - **Detector**:
 *    - **Canvas Detector**: Primary method using the Canvas API for performance and broad compatibility.
 *    - **DOM Detector**: Backup method using DOM rendering for environments without Canvas support.
 * 
 * ## Points To Know
 * - The amount of fonts on Safari is going to be higher than Chrome.
 * - The amount of fonts on old code is lower than the new code
 * - Old code had bug - OldOffLoadScanner provide 48 fonts - OldBatchScanner provides 45 fonts - it means different id for user
 * 
 * ## Resources
 * Background: https://biocatch.atlassian.net/wiki/spaces/~712020ea4044df5ae84c1db6c8150a825e5219/pages/edit-v2/5270142999?draftShareId=4672c69e-1654-4b31-800b-091a2b2c9df9
 * Migration Plan : https://biocatch.atlassian.net/wiki/pages/resumedraft.action?draftId=5298978821&draftShareId=e07d6273-5f3b-4dcd-b61f-38941df4f06e
 * Performance Measurements: https://biocatch.atlassian.net/wiki/spaces/~712020ea4044df5ae84c1db6c8150a825e5219/pages/5298815015/Fonts+Performance
 */

export default class FontCollectionFeature extends DataCollector {

    static getDefaultSettings() {
        return featureSettings;
    }

    /**
     * Constructor for FontCollectionFeature
     * @param {CDUtils} utils - Provides general utility methods.
     * @param {DOMUtils} domUtils - Handles DOM-related operations.
     * @param {DataQueue} dataQueue - Manages queuing and processing of font data.
     * @param {ConfigurationRepository} configRepo - Provides configuration settings.
     * @param {FontCollection} v1Collector - Optional existing V1 collector.
     * @param {FontCollection} v2Collector - Optional existing V2 collector.
     * @throws {Error} If the font version is invalid or unsupported.
     */
    constructor(
        utils,
        domUtils,
        dataQueue,
        configRepo,
        v1Collector = null,
        v2Collector = null
    ) {
        super();

        this._logsTag = `[FONTS-COLLECTOR][MAIN]`;

        if (!utils) throw new Error(`CDUtils instance is required.`);
        if (!domUtils) throw new Error(`DOMUtils instance is required.`);
        if (!dataQueue) throw new Error(`DataQueue instance is required.`);
        if (!configRepo) throw new Error(`ConfigurationRepository instance is required.`);

        this._utils = utils;
        this._domUtils = domUtils;
        this._dataQueue = dataQueue;
        this._configRepo = configRepo;
        this._v1Collector = v1Collector;
        this._v2Collector = v2Collector;
    }

    async startFeature() {
        Log.info(`${this._logsTag} Starting font feature.`);

        //On desktops, fonts can be installed system-wide through the automatically by applications, 
        //such as design software, which can install their own fonts. On mobile, font installation is very unlikely to happen, 
        //because apps need specific permission to do that
        if (this._isMobileDevice()) {
            Log.info(`${this._logsTag} Mobile phone has detected. aborting font detection.`);
            return
        }

        // Initialize collectors if they don't exist
        // This is done to avoid creating new instances of the collectors on each startFeature call
        // and to ensure that the collectors are properly initialized with the correct configuration because config takes time to load 
        // and we want to avoid race conditions
        if (!this._v1Collector) {
            this._v1Collector = new FontCollection(this._utils, this._domUtils, this._dataQueue, this._configRepo, FontVersionType.VERSION1);
        }
        if (!this._v2Collector) {
            this._v2Collector = new FontCollection(this._utils, this._domUtils, this._dataQueue, this._configRepo, FontVersionType.VERSION2);
        }

        const rawConfig = this._configRepo.get(ConfigurationFields.fontCollection) || "{}";
        const fontCollectionConfig = JSON.parse(rawConfig);
        
        Log.info(`${this._logsTag} Font collection config: ${JSON.stringify(fontCollectionConfig)}`);

        const migrationMode = fontCollectionConfig.migrationMode ?? FontMigrationStage.DUAL_COLLECTION_V1_PRIORITY;

        if (migrationMode === FontMigrationStage.V1_ONLY) {
            const collectedV1Fonts = await this._v1Collector.collectFonts();
            this._enqueueFontData(FontDataType.V1_ONLY, [collectedV1Fonts, null]);
            return
        }

        // PHASE 1: Dual Collection with V1 Priority
        // ---------------------------------------------------------
        // In this phase, both V1 and V2 collectors are active. Data is collected
        // primarily using V1, and V2 data is collected for comparison purposes.
        //
        // To implement:
        // 1. Collect fonts using the V1 collector.
        // 2. Enqueue the V1 fonts only.
        // 3. Collect fonts using the V2 collector.
        // 4. Enqueue combined V1 and V2 fonts.

        if (migrationMode === FontMigrationStage.DUAL_COLLECTION_V1_PRIORITY) {
            const collectedV1Fonts = await this._v1Collector.collectFonts();
            this._enqueueFontData(FontDataType.V1_ONLY, [collectedV1Fonts, null]);

            const collectedV2Fonts = await this._v2Collector.collectFonts();
            this._enqueueFontData(FontDataType.V1_AND_V2, [collectedV1Fonts, collectedV2Fonts]);
        }
        // PHASE 2: Dual Collection with V2 Priority
        // ---------------------------------------------------------
        // In this phase, both collectors remain active, but data collection 
        // prioritizes V2. V1 data is collected for comparison.
        //
        // To implement:
        // 1. Collect fonts using the V2 collector.
        // 2. Enqueue the V2 fonts only.
        // 3. Collect fonts using the V1 collector.
        // 4. Enqueue combined V1 and V2 fonts.
        //
        // Uncomment the following block to implement Phase 2:

        if (migrationMode === FontMigrationStage.DUAL_COLLECTION_V2_PRIORITY) {
            const collectedV2FontsPhase2 = await this._v2Collector.collectFonts();
            this._enqueueFontData(FontDataType.V2_ONLY, [null, collectedV2FontsPhase2]);

            const collectedV1FontsPhase2 = await this._v1Collector.collectFonts();
            this._enqueueFontData(FontDataType.V1_AND_V2, [collectedV1FontsPhase2, collectedV2FontsPhase2]);
        }

        // PHASE 3: Full Migration to V2
        // ---------------------------------------------------------
        // In this phase, only the V2 collector is active. All logic related
        // to V1 is removed, and only V2 data is collected and enqueued.
        //
        // To implement:
        // 1. Collect fonts using the V2 collector.
        // 2. Enqueue only the V2 fonts.
        // 3. Remove all V1-related logic from the codebase.
        //
        // Uncomment the following block to implement Phase 3:
        if (migrationMode === FontMigrationStage.V2_ONLY) {
            const collectedV2FontsPhase3 = await this._v2Collector.collectFonts();
            this._enqueueFontData(FontDataType.V2_ONLY, [null, collectedV2FontsPhase3]);
        }
    }


    stopFeature() {
        Log.info(`${this._logsTag} Stopping font feature.`);
        this._collectorHasStopped = true;
        this._v1Collector?.release()
        this._v2Collector?.release()
        this._v1Collector = null
        this._v2Collector = null
    }

    _enqueueFontData(dataType, fonts) {
        if (this._collectorHasStopped) return;
        if (!fonts) throw Error("IllegalState fonts undefined");

        const storedFontsMessage = new FontsDetectionContract(dataType, fonts).buildQueueMessage();
        this._dataQueue.addToQueue('static_fields', storedFontsMessage, false);
        Log.debug(`${this._logsTag} Fonts enqueued: ${JSON.stringify(fonts)}`);
    }

    _isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
}
