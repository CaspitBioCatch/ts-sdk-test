import DataCollector from '../DataCollector';
import BrowserDetectContract from "../../contract/staticContracts/BrowserDetectContract";

const featureSettings = {
    configKey: 'isBrowserDetect',
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

export default class BrowserDetect extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    constructor(dataQ) {
        super();
        this._dataQ = dataQ;
    }

    /**
     * detect browsers by feature detection since user agent can lie
     */
    startFeature() {
        let isChrome = false;
        let isOpera = false;
        let isFirefox = false;
        let isSafari = false;
        let isIE = false;
        let isEdge = false;
        let isBlink = false;

        if (this.doesUserAagentDataExists()) {
            // Modern detection using userAgentData
            navigator.userAgentData.brands.forEach((brand) => {
              if (brand.brand === 'Google Chrome') isChrome = true;
              if (brand.brand === 'Opera') isOpera = true;
              if (brand.brand === 'Microsoft Edge') isEdge = true;
              if (brand.brand === 'Firefox') isFirefox = true;
            });
            
            // Detect Safari via platform or specific WebKit engine check
            if (navigator.userAgentData.platform) {
                isSafari = navigator.userAgentData.platform === 'macOS' && 
                !isChrome && !isEdge && !isOpera && /Safari/.test(navigator.userAgent);
            }
            // Blink is the engine behind Chrome and Opera
            isBlink = isChrome || isOpera;
        } else {
            // Fallback for older browsers
            const userAgent = navigator.userAgent;
          
            isOpera = /OPR|Opera/.test(userAgent);
            isFirefox = /Firefox/.test(userAgent);
            isSafari = /Safari/.test(userAgent) && /Apple Computer/.test(navigator.vendor);
            isIE = /MSIE|Trident/.test(userAgent);  // MSIE for older versions, Trident for IE 11+
            isEdge = /Edg/.test(userAgent);  // Edge (Chromium-based)
            // In case we use Opera or Edge, the system detect 'Chrome' as well, 
            // that's why we are adding the verification to make sure it's also not Edge and Opera
            isChrome = /Chrome/.test(userAgent) && !isEdge && !isOpera && /Google Inc/.test(navigator.vendor);
            isBlink = (isChrome || isOpera) && !!window.CSS;  // Blink engine detection
        }

        let browserDetectContract = new BrowserDetectContract(isChrome, isFirefox, isEdge, isIE, isSafari, isOpera, isBlink);
        let data = browserDetectContract.buildQueueMessage();
        this._dataQ.addToQueue('static_fields', data, false);
    }

    doesUserAagentDataExists() {
        return navigator.userAgentData && navigator.userAgentData.brands && navigator.userAgentData.brands.length > 0
    }
}
