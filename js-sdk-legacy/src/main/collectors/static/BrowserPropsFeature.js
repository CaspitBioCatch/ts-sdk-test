import DataCollector from '../DataCollector';
import Log from '../../technicalServices/log/Logger';
import { ConfigurationFields } from '../../core/configuration/ConfigurationFields';
import VersionClientBrowserPropsContract
    from "../../contract/staticContracts/browserPropsContract/VersionClientBrowserPropsContract";
import DeviceSourceBrowserPropsContract
    from "../../contract/staticContracts/browserPropsContract/DeviceSourceBrowserPropsContract";
import OSBrowserPropsContract from "../../contract/staticContracts/browserPropsContract/OSBrowserPropsContract";
import OSVersionBrowserPropsContract
    from "../../contract/staticContracts/browserPropsContract/OSVersionBrowserPropsContract";
import OSFamilyBrowserPropsContract
    from "../../contract/staticContracts/browserPropsContract/OSFamilyBrowserPropsContract";
import InputMechBrowserPropsContract
    from "../../contract/staticContracts/browserPropsContract/InputMechBrowserPropsContract";
import CoresBrowserPropsContract from "../../contract/staticContracts/browserPropsContract/CoresBrowserPropsContract";
import PluginsBrowserPropsContract
    from "../../contract/staticContracts/browserPropsContract/PluginsBrowserPropsContract";
import JsUaBrowserPropsContract from "../../contract/staticContracts/browserPropsContract/JsUaBrowserPropsContract";
import TimeZoneBrowserPropsContract
    from "../../contract/staticContracts/browserPropsContract/TimeZoneBrowserPropsContract";
import CookieEnabledBrowserPropsContract
    from "../../contract/staticContracts/browserPropsContract/CookieEnabledBrowserPropsContract";
import DeviceMemoryBrowserPropsContract
    from "../../contract/staticContracts/browserPropsContract/DeviceMemoryBrowserPropsContract";
import LangBrowserPropsContract from "../../contract/staticContracts/browserPropsContract/LangBrowserPropsContract";
import LanguagesListBrowserPropsContract
    from "../../contract/staticContracts/browserPropsContract/LanguagesListBrowserPropsContract";
import BuildIDBrowserPropsContract
    from '../../contract/staticContracts/browserPropsContract/BuildIDBrowserPropsContract';
import MaxTouchPointsBrowserPropsContract
    from '../../contract/staticContracts/browserPropsContract/MaxTouchPointsBrowserPropsContract';
import MathDetectContract from "../../contract/staticContracts/MathDetectContract";
import {
    BrowserDisplayBrowserPropsContract
} from "../../contract/staticContracts/browserPropsContract/BrowserDisplayBrowserPropsContract";

const featureSettings = {
    configKey: 'collectBrowserProps',
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

/* eslint-disable prefer-destructuring */
export default class BrowserPropsFeature extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    constructor(dataQ, pointerHoverDetector, utils, configurationRepository, configurations) {
        super();
        this._dataQ = dataQ;
        this._pointerHoverDetector = pointerHoverDetector;
        this._utils = utils;
        this._configurationRepository = configurationRepository;
        this._configurations = configurations;
    }

    startFeature() {
        Log.info('Collecting Browser Props');

        // basic required fields
        let versionClientBrowserPropsContract = new VersionClientBrowserPropsContract(this._utils.scriptVersion);
        let versionClientData = versionClientBrowserPropsContract.buildQueueMessage();
        this._dataQ.addToQueue('static_fields', versionClientData, false);

        let deviceSourceBrowserPropsContract = new DeviceSourceBrowserPropsContract('js');
        let deviceSourceData = deviceSourceBrowserPropsContract.buildQueueMessage();
        this._dataQ.addToQueue('static_fields', deviceSourceData, false);

        Log.info(`SDK Version is ${this._utils.scriptVersion}`);

        let language = BrowserPropsFeature.getLanguage();
        if (language) {
            // If configuration specifies to hash the language field...
            if (this._configurationRepository.get('browserPropsShouldHashLanguageField')) {
                Log.debug('Hashing language field according to configuration');
                language = this._utils.getHash(language).toString();
            }
            let mainLangBrowserPropsContract = new LangBrowserPropsContract(language);
            let mainLangData = mainLangBrowserPropsContract.buildQueueMessage();
            this._dataQ.addToQueue('static_fields', mainLangData, false);
        }
        let osBrowserPropsContract = new OSBrowserPropsContract(BrowserPropsFeature.getAvailablePlatform(window.navigator));
        let osData = osBrowserPropsContract.buildQueueMessage();
        this._dataQ.addToQueue('static_fields', osData, false);

        const os = BrowserPropsFeature.getOperatingSystem();
        let osVersionBrowserPropsContract = new OSVersionBrowserPropsContract(os.version);
        let osVersionData = osVersionBrowserPropsContract.buildQueueMessage();
        this._dataQ.addToQueue('static_fields', osVersionData, false);

        let osFamilyBrowserPropsContract = new OSFamilyBrowserPropsContract(os.name); //here
        let osFamilyData = osFamilyBrowserPropsContract.buildQueueMessage();
        this._dataQ.addToQueue('static_fields', osFamilyData, false);

        const pointerHover = this._pointerHoverDetector.getPointerHover();
        let inputMechBrowserPropsContract = new InputMechBrowserPropsContract(pointerHover.pointer, pointerHover.hover);
        let inputMechData = inputMechBrowserPropsContract.buildQueueMessage();
        this._dataQ.addToQueue('static_fields', inputMechData, false);

        // supported in Chrome, Opera, FF 38+
        let coresBrowserPropsContract = new CoresBrowserPropsContract(window.navigator.hardwareConcurrency || 0);
        let coresData = coresBrowserPropsContract.buildQueueMessage();
        this._dataQ.addToQueue('static_fields', coresData, false);

        if (navigator.languages) {
            let languages = navigator.languages;
            // If configuration specifies to hash the language field...
            if (this._configurationRepository.get('browserPropsShouldHashLanguageField')) {
                Log.debug('Hashing languages field according to configuration');
                languages = Array.from(languages, (lang) => {
                    return this._utils.getHash(lang).toString();
                });
            }
            let languageslistBrowserPropsContract = new LanguagesListBrowserPropsContract(languages);
            let languageslistData = languageslistBrowserPropsContract.buildQueueMessage();
            this._dataQ.addToQueue('static_fields', languageslistData, false);
        }


        const plugins = BrowserPropsFeature.getPlugins();
        if (plugins && plugins.length > 0) {
            let pluginsBrowserPropsContract = new PluginsBrowserPropsContract(plugins);
            let pluginsData = pluginsBrowserPropsContract.buildQueueMessage();
            this._dataQ.addToQueue('static_fields', pluginsData, false);
        }
        let jsUaBrowserPropsContract = new JsUaBrowserPropsContract(navigator.userAgent);
        let jsUaData = jsUaBrowserPropsContract.buildQueueMessage();
        this._dataQ.addToQueue('static_fields', jsUaData, false);

        const tz = (new Date()).getTimezoneOffset() * -1;
        let timeZoneBrowserPropsContract = new TimeZoneBrowserPropsContract(tz);
        let timeZoneData = timeZoneBrowserPropsContract.buildQueueMessage();
        this._dataQ.addToQueue('static_fields', timeZoneData, false);

        const isCookie = BrowserPropsFeature.checkCookie();
        let cookieEnabledBrowserPropsContract = new CookieEnabledBrowserPropsContract(isCookie);
        let cookieEnabledData = cookieEnabledBrowserPropsContract.buildQueueMessage();
        this._dataQ.addToQueue('static_fields', cookieEnabledData, false);

        // device memory from https://github.com/w3c/device-memory#the-web-exposed-api.
        // max value is 8 for now even on 16GB RAM
        const memory = navigator.deviceMemory || 0;
        let deviceMemoryBrowserPropsContract = new DeviceMemoryBrowserPropsContract(memory);
        let deviceMemoryData = deviceMemoryBrowserPropsContract.buildQueueMessage();
        this._dataQ.addToQueue('static_fields', deviceMemoryData, false);

        //Returns the build identifier of the browser.
        //In modern browsers this property now returns a fixed timestamp as a privacy measure, e.g. 20181001000000 in Firefox 64 onwards.
        //Available only on Firefox browsers, from version 64, for any other browser will return undefined and will not be included in the
        const buildId = navigator.buildID;
        if (buildId) {
            const buildBrowserPropsContract = new BuildIDBrowserPropsContract(buildId);
            const buildIdData = buildBrowserPropsContract.buildQueueMessage();
            this._dataQ.addToQueue('static_fields', buildIdData, false);
        }

        //The maxTouchPoints read-only property of the Navigator interface returns the maximum number of simultaneous touch contact points
        //are supported by the current device.
        const maxTouchPoints = navigator.maxTouchPoints;
        const maxTouchPointsContract = new MaxTouchPointsBrowserPropsContract(maxTouchPoints);
        const maxTouchPointsData = maxTouchPointsContract.buildQueueMessage();
        this._dataQ.addToQueue('static_fields', maxTouchPointsData, false);

        // Browser Display Properties.
        if (this._configurations.isBrowserDisplayDetectEnabled()) {
            const browserDisplayProperties = `${BrowserPropsFeature.isTransparencyReduced()},
            ${BrowserPropsFeature.isMotionReduced()},
            ${BrowserPropsFeature.getColorGamut()},
            ${BrowserPropsFeature.areColorsForced()},
            ${BrowserPropsFeature.areColorsInverted()},
            ${BrowserPropsFeature.isHDR()},
            ${BrowserPropsFeature.getMonochromeDepth()}`;
            const browserDisplayPropertiesBrowserPropsContract = new BrowserDisplayBrowserPropsContract(browserDisplayProperties);
            const browserDisplayPropertiesData = browserDisplayPropertiesBrowserPropsContract.buildQueueMessage();
            this._dataQ.addToQueue('static_fields', browserDisplayPropertiesData, false);
        }

        // Math.
       if (this._configurations.isMathDetectEnabled()) {
            const mathFingerprint = BrowserPropsFeature.getMathFingerprint();
            const mathDetectContract = new MathDetectContract(mathFingerprint);
            const mathDetectData = mathDetectContract.buildQueueMessage();
            this._dataQ.addToQueue('static_fields', mathDetectData, false);
        }

        Log.info('Browser Props collected');
    }

    /**
     * userLanguage - non standard. Retrieves the operating system's natural language setting
     * browserLanguage - non standard. Retrieves the current operating system language. Can be different from userLanguage
     * e.g in IE 11, userLanguage is 'he-IL' but browserLanguage is 'en-US'
     * language - standard. The preferred language of the user, usually the language of the browser UI
     * @returns {*}
     */
    static getLanguage() {
        if (navigator) {
            if (navigator.language) { // Chrome, FF, Edge, IE 11, Safari etc.
                return navigator.language;
            }

            if (navigator.userLanguage) { // IE 10 and lower
                return navigator.userLanguage;
            }
            // I commented out these options since they are not rele
            // else if (navigator.browserLanguage) {
            //     return navigator.browserLanguage;
            // }
            // else if (navigator.systemLanguage) { // IE 10 and lower
            //     return navigator.systemLanguage;
            // }
        }
        return undefined;
    }

    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@media/monochrome
     */
    static getMonochromeDepth() {
        if (!matchMedia('(min-monochrome: 0)').matches) {
            // The media feature isn't supported by the browser
            return undefined
        }

        // A variation of binary search algorithm can be used here.
        // But since expected values are very small (≤10), there is no sense in adding the complexity.
        for (let i = 0; i <= 100; ++i) {
            if (matchMedia(`(max-monochrome: ${i})`).matches) {
                return i
            }
        }

        return undefined;
    }

    /**
     * @see https://www.w3.org/TR/mediaqueries-5/#dynamic-range
     */
    static isHDR() {
        const doesMatch = (value) => {
            return matchMedia(`(dynamic-range: ${value})`).matches
        };

        if (doesMatch('high')) {
            return 'high';
        }
        if (doesMatch('standard')) {
            return 'standard';
        }
        return 'undefined';
    }

    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@media/inverted-colors
     */
    static areColorsInverted() {
        const doesMatch = (value) => {
            return matchMedia(`(inverted-colors: ${value})`).matches
        };

        if (doesMatch('inverted')) {
            return 'inverted'
        }
        if (doesMatch('none')) {
            return 'none'
        }
        return 'undefined'
    }

    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors
     */
    static areColorsForced() {
        const doesMatch = (value) => {
            return matchMedia(`(forced-colors: ${value})`).matches
        };

        if (doesMatch('active')) {
            return 'active'
        }
        if (doesMatch('none')) {
            return 'none'
        }
        return 'undefined'
    }

    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@media/color-gamut
     */
    static getColorGamut() {
        // rec2020 includes p3 and p3 includes srgb
        for (const gamut of ['rec2020', 'p3', 'srgb']) {
            if (matchMedia(`(color-gamut: ${gamut})`).matches) {
                return gamut
            }
        }
        return 'undefined'
    }

    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
     */
    static isMotionReduced() {
        const doesMatch = (value) => {
            return matchMedia(`(prefers-reduced-motion: ${value})`).matches
        };

        if (doesMatch('reduce')) {
            return 'reduce'
        }
        if (doesMatch('no-preference')) {
            return 'no-preference'
        }
        return 'undefined'
    }

    /**
     * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-transparency
     */
    static isTransparencyReduced() {
        const doesMatch = (value) => {
            return matchMedia(`(prefers-reduced-transparency: ${value})`).matches
        };

        if (doesMatch('reduce')) {
            return 'reduce'
        }
        if (doesMatch('no-preference')) {
            return 'no-preference'
        }
        return 'undefined'
    }

    static getMathFingerprint() {
        return [
            Math.acos(0.123124234234234242),
            Math.acosh(1e308),
            Math.asin(0.123124234234234242),
            Math.asinh(1),
            Math.atan(0.5),
            Math.atanh(0.5),
            Math.sin(-1e300),
            Math.sinh(1),
            Math.cos(10.000000000123),
            Math.cosh(1),
            Math.tan(-1e300),
            Math.tanh(1),
            Math.exp(1),
            Math.expm1(1),
            Math.log1p(10),
            Math.pow(Math.PI, -100),
        ].join('|');
    }

    static getPlugins() {
        try {
            const pList = [];

            if (window.navigator.plugins && window.navigator.plugins.length > 0) {
                for (let i = 0, len = window.navigator.plugins.length; i < len; i++) {
                    pList.push([
                        window.navigator.plugins[i].name,
                        window.navigator.plugins[i].filename,
                        window.navigator.plugins[i].description,
                        window.navigator.plugins[i].version ? window.navigator.plugins[i].version : '']);
                }
            } else if (window.navigator.mimeTypes && window.navigator.mimeTypes.length > 0) {
                for (let x = 0; x < window.navigator.mimeTypes.length; x++) {
                    pList.push([
                        window.navigator.mimeTypes[x].type, '',
                        window.navigator.mimeTypes[x].description, '']);
                }
            }
            // Custom logic for enhancing the plugins list with a ShockwaveFLash entry if detected
            const detectFlashInIE = BrowserPropsFeature.isActiveXAndFlashEnabled;
            BrowserPropsFeature.augmentWithFlashInIE(pList, window.navigator.plugins, detectFlashInIE);
            return pList;
        } catch (e) {
            Log.warn(`getPlugins error: ${e.message}`, e);
        }
    }

    static checkCookie() {
        let cookieEnabled = navigator.cookieEnabled;
        if (!cookieEnabled) {
            // for mobile compatibility
            // 1 minute expiration time
            this._utils.StorageUtils.setCookie('testcookie', '1', 60000);
            cookieEnabled = document.cookie.indexOf('testcookie') !== -1;
        }
        return cookieEnabled;
    }

    static getOperatingSystem() {
        const dataOS = [
            {name: 'Windows Phone', value: 'Windows Phone', version: 'OS'},
            {name: 'Windows', value: 'Win', version: 'NT'},
            {name: 'iPhone', value: 'iPhone', version: 'OS'},
            {name: 'iPad', value: 'iPad', version: 'OS'},
            {name: 'Kindle', value: 'Silk', version: 'Silk'},
            {name: 'Android', value: 'Android', version: 'Android'},
            {name: 'PlayBook', value: 'PlayBook', version: 'OS'},
            {name: 'BlackBerry', value: 'BlackBerry', version: '/'},
            {name: 'Macintosh', value: 'Mac', version: 'OS X'},
            {name: 'Linux', value: 'Linux', version: 'rv'},
            {name: 'Palm', value: 'Palm', version: 'PalmOS'},
        ];
        const navAgentData = [BrowserPropsFeature.getAvailablePlatform(window.navigator), navigator.userAgent].join(' ');
        let version = '';
        let os = 'Unknown';

        let osRegex;
        let verRegex;
        let osMatch;
        let verMatch;

        for (let index = 0; index < dataOS.length; index++) {
            osRegex = new RegExp(dataOS[index].value, 'i');
            osMatch = osRegex.test(navAgentData);
            if (osMatch) {
                verRegex = new RegExp(dataOS[index].version + '[- /:;]([\\d._]+)', 'i');
                verMatch = navAgentData.match(verRegex);

                if (verMatch) {
                    if (verMatch[1]) {
                        verMatch = verMatch[1];
                    }

                    verMatch = verMatch.split(/[._]+/);

                    for (let verIndex = 0; verIndex < verMatch.length; verIndex++) {
                        if (verIndex === 0) {
                            version += verMatch[verIndex] + '.';
                        } else {
                            version += verMatch[verIndex];
                        }
                    }
                }
                os = dataOS[index].name;
                break;
            }
        }
        return {
            version: parseFloat(version) || null,
            name: os,
        };
    }

    /**
     * Must be wrapped with try/catch to avoid undefined errors in non IE browsers
     * (assuming you consider IE a browser)
     * If the ShockwaveFlash plugin is installed and enabled it is expected to appear in
     * the navigator.plugins list in IE 11. However in IE < 11 (10, 9 ,8) the navigator.plugins is not a PluginArray
     * object and therefore this custom detection is required.
     * @returns {boolean}
     */
    static isActiveXAndFlashEnabled() {
        try {
            return Boolean(new ActiveXObject('ShockwaveFlash.ShockwaveFlash'));
        } catch (exception) {
            return false;
        }
    }

    static getAvailablePlatform(_navigator) {
        if ('platform' in _navigator) {
            return _navigator['platform'];
        } else if ('userAgentData' in _navigator) {
            return _navigator['userAgentData']['platform'];
        }
        return null;
    }

    /**
     * The Flash Enable related data point is the result of collecting the Shockwave flash entry available in the navigator.plugins/mimeTypes
     * However, this entry is added in IE11, Chrome, Firefox and Safari
     * This method is called to enhance the plugins/mimeTypes data upon detecting Flash in IE < 11 using
     * the activeX API
     * @param {Array} data
     * @param {object} navigatorPluginsObject by which IE < 11 behavior is detected as we only augment
     * @param {function} detectFlashInIE
     * MSMimeTypesCollection and MSPluginsCollection collections
     */
    static augmentWithFlashInIE(data, navigatorPluginsObject, detectFlashInIE) {
        // We are not expected to augment the navigator.plugins/mimeTypes object PluginArray (IE 11+) type
        // Only MSMimeTypesCollection and MSPluginsCollection should be augmented

        const pluginsCollectionName = Object.prototype.toString.call(navigatorPluginsObject);

        if (pluginsCollectionName === '[object PluginArray]') {
            return data;
        }

        const pluginsEntry = [
            'Flash32_32_0_0_238.ocx',
            2,
            'Shockwave Flash',
            '32.0.0.238'
        ];
        if (detectFlashInIE()) {
            data.push(pluginsEntry);
        }

        return data;
    }
}
/* eslint-enable prefer-destructuring */
