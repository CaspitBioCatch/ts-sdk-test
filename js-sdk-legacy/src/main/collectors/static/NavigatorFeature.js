import DataCollector from '../DataCollector';
import Log from '../../technicalServices/log/Logger';

const featureSettings = {
    configKey: 'isNavigatorFeature',
    isDefault: false,
    shouldRunPerContext: false,
    shouldRunPerSession: true,
    shouldRun: false,
    isFrameRelated: false,
    runInUns: false,
    runInSlave: true,
    runInLean: false,
    isRunning: false,
    instance: null,
};

export default class NavigatorFeature extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    constructor(dataQ, navigator = window.navigator) {
        super();
        this._dataQ = dataQ;
        this._navigator = navigator;
    }

    startFeature() {
        try {
            const navigatorData = {
                oscpu: this._navigator.oscpu || null,
                pdfViewerEnabled: this._navigator.pdfViewerEnabled || null,
                webdriver: this._navigator.webdriver || null,
                userAgentData: this._navigator.userAgentData || null,
                appVersion: this._navigator.appVersion || null,
                platform: this._navigator.platform || null,
                vendor: this._navigator.vendor || null,
                productSub: this._navigator.productSub || null,
                vendorSub: this._navigator.vendorSub || null,
                onLine: this._navigator.onLine || null,
                getHighEntropyValues: Boolean(this._navigator.userAgentData?.getHighEntropyValues),
                prototype: Object.getOwnPropertyNames(Object.getPrototypeOf(this._navigator))
            };

            Log.debug('NavigatorFeature: Collected navigator data', navigatorData);

            this._dataQ.addToQueue('static_fields', ['navigator_oscpu', navigatorData.oscpu], false);
            this._dataQ.addToQueue('static_fields', ['navigator_pdfViewerEnabled', navigatorData.pdfViewerEnabled], false);
            this._dataQ.addToQueue('static_fields', ['navigator_webdriver', navigatorData.webdriver], false);
            this._dataQ.addToQueue('static_fields', ['navigator_userAgentData', navigatorData.userAgentData], false);
            this._dataQ.addToQueue('static_fields', ['navigator_appVersion', navigatorData.appVersion], false);
            this._dataQ.addToQueue('static_fields', ['navigator_platform', navigatorData.platform], false);
            this._dataQ.addToQueue('static_fields', ['navigator_vendor', navigatorData.vendor], false);
            this._dataQ.addToQueue('static_fields', ['navigator_productSub', navigatorData.productSub], false);
            this._dataQ.addToQueue('static_fields', ['navigator_vendorSub', navigatorData.vendorSub], false);
            this._dataQ.addToQueue('static_fields', ['navigator_onLine', navigatorData.onLine], false);
            this._dataQ.addToQueue('static_fields', ['navigator_getHighEntropyValues', navigatorData.getHighEntropyValues], false);
            this._dataQ.addToQueue('static_fields', ['navigator_prototype', navigatorData.prototype], false);
            
        } catch (error) {
            Log.error('NavigatorFeature: Error collecting navigator data', error);
        }
    }
} 