import DataCollector from '../DataCollector';
import Log from '../../technicalServices/log/Logger';
import ScreenHighResContract from '../../contract/staticContracts/ScreenHighResContract';

const featureSettings = {
    configKey: 'isScreenHighResFeature',
    isDefault: false,
    shouldRunPerContext: false,
    shouldRunPerSession: true,
    shouldRun: false,
    isFrameRelated: false,
    runInUns: false,
    runInSlave: true,
    runInLean: true,
    isRunning: false,
    instance: null,
};

export default class ScreenHighResFeature extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    constructor(dataQ) {
        super();
        this._dataQ = dataQ;
    }

    startFeature() {
        Log.info('Starting Screen High Resolution Feature');

        const screenHighResInfo = ScreenHighResFeature.getScreenHighResInfo();
        const screenHighResContract = new ScreenHighResContract(screenHighResInfo);
        const screenHighResData = screenHighResContract.buildQueueMessage();
        this._dataQ.addToQueue('static_fields', screenHighResData, false);
    }

    /**
     * Gets the screen high resolution information
     * @returns {boolean} Whether the screen is high resolution
     */
    static getScreenHighResInfo() {
        const HIGH_RES_QUERY = "(-webkit-min-device-pixel-ratio: 2), (min-device-pixel-ratio: 2), (min-resolution: 192dpi)";
        const mediaQueryList = ScreenHighResFeature.getMediaQueryList(HIGH_RES_QUERY);
        return mediaQueryList ? mediaQueryList.matches : false;
    }

    /**
     * Gets the media query list for a given query
     * @param {string} query - The media query to check
     * @returns {MediaQueryList} The media query list
     */
    static getMediaQueryList(query) {
        if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
            return window.matchMedia(query);
        }
        return null;
    }
} 