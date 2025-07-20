
import { ConfigurationFields } from '../../../../core/configuration/ConfigurationFields';

//V1
import OldBatchFontsScanner from './v1/OldBatchFontsScanner';
import OldOffloadFontsScanner from './v1/OldOffloadFontsScanner';

//V2
import FontVersionType from './v2/types/FontVersionType';
import BatchFontScanner from './v2/BatchFontScanner';
import FontDetectorProvider from './v2/detector/FontDetectorProvider';

/**
 * Resolves the correct instance of the font scanner.
 *
 * @param {Object} params - Configuration and dependencies for resolving the scanner.
 * @param {Object} params.configurationRepository - Configuration repository instance.
 * @param {string} params.fontVersion - The font version type (use FontVersionType enum).
 * @param {Object} params.domUtils - DOM utility instance.
 * @param {Object} params.utils - General utility instance.
 * @param {Object} [params.fontScanner=null] - Optional pre-existing font scanner instance.
 * @param {Object} [params.fontDetector=null] - Optional font detector instance.
 * @returns {Object} - The resolved font scanner instance.
 */
function resolveFontScanner({
    utils,
    domUtils,
    configurationRepository,
    fontVersion,
    fontDetector = null,
}) {

    //Do not delete OldBatchFontsScanner, it is used for the old version of the font collection and changing it will cause to diff font list
    if (fontVersion === FontVersionType.VERSION1) {
        const offloadFontsCollectionEnabled = configurationRepository.get(ConfigurationFields.offloadFontsCollectionEnabled);
        if (offloadFontsCollectionEnabled) {
            return new OldOffloadFontsScanner(domUtils);
        }
        return new OldBatchFontsScanner(domUtils);
    }

    const fontDetectorProvider = new FontDetectorProvider(domUtils);
    const fontCollectionConfig = JSON.parse(configurationRepository.get(ConfigurationFields.fontCollection) || "{}");

    const batchSize = fontCollectionConfig?.v2?.batchSize ?? 10;
    const timeoutGap = fontCollectionConfig?.v2?.timeoutGap ?? 0;

    return new BatchFontScanner({
        utils,
        domUtils,
        detector: fontDetector ?? fontDetectorProvider.getBestDetector(),
        batchSize: batchSize,
        timeoutGap: timeoutGap,
    });
}

export default resolveFontScanner;
