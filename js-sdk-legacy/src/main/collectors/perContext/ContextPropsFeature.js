import DataCollector from '../DataCollector';
import CDUtils from "../../technicalServices/CDUtils";
import Log from "../../technicalServices/log/Logger";
import DOMUtils from "../../technicalServices/DOMUtils";
import {ConfigurationFields} from "../../core/configuration/ConfigurationFields";
import {AgentType} from "../../contract/AgentType";

const featureSettings = {
    configKey: 'isContextPropsFeature',
    isDefault: false,
    shouldRunPerContext: true,
    shouldRunPerSession: false,
    shouldRun: true,
    isFrameRelated: false,
    runInUns: true,
    runInSlave: false,
    runInLean: false,
    isRunning: false,
    instance: null,
};

export default class ContextPropsFeature extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    constructor(dataQ, domUtils, perfMonitor, configurationRepository) {
        super();
        this._dataQ = dataQ;
        this._domUtils = domUtils;
        this._perfMonitor = perfMonitor;
        this._configurationRepository = configurationRepository;
        this._observerCallback = this._observerCallback.bind(this);
        this.calcTime = this.calcTime.bind(this);
        this._getEntriesByType = this._getEntriesByType.bind(this);

        this.callMethod = this._configurationRepository.get(ConfigurationFields.useLegacyZeroTimeout)
            ? CDUtils.asyncCall
            : CDUtils.asyncTimeoutCall;

    }

    startFeature() {
        if (self.screen) {
            const xdpi = window.devicePixelRatio ? window.devicePixelRatio : -1;
            const ydpi = window.devicePixelRatio ? window.devicePixelRatio : -1;

            if (this._shouldCollectStaticFields()) {
                this._dataQ.addToQueue('static_fields', ['display', [screen.colorDepth, screen.width, screen.height,
                    screen.availHeight || -1, screen.availWidth || -1, xdpi, ydpi]], false);
            }
        }
        this.reportPageLoadTime();
    }

    _shouldCollectStaticFields() {
        return this._configurationRepository?.get(ConfigurationFields.agentType) !== AgentType.SECONDARY;
    }

    //Observer callback function for getting entries
    _observerCallback(list, observer) {
        const entries = list.getEntries()[0];
        if (entries.duration) {
            this.calcTime(entries);
            if ("disconnect" in observer) {
                observer.disconnect();
            }
        }
    }

    //checking if the entry type is supported by the useragent
    _isEntrySupportedByBrowser(entry) {
        //if the supportedEntryTypes is not available feature in browser I skip it and return true
        if (!("supportedEntryTypes" in window.PerformanceObserver)) {
            return true;
        }
        return PerformanceObserver.supportedEntryTypes.includes(entry);
    }

    //get the Performance Navigation API entries
    _getEntriesByType() {
        if (window.performance.timing) {
            if (window.performance.timing.loadEventEnd && window.performance.timing.navigationStart) {
                const entries = {duration: window.performance.timing.loadEventEnd - window.performance.timing.navigationStart}
                this.calcTime(entries);
            }
        }
    }

    //entries is an instance of the PerformanceNavigationTiming interface;
    // if not supported it fallback to Navigation Timing API: see class function _getEntriesByType
    calcTime(entries) {
        //when either entries or duration are not captured a warning log will be dispatched
        if (CDUtils.isUndefinedNull(entries)) {
            Log.warn("Context Props Feature: no entries of navigation timing were captured");
            return;
        }
        if (!(CDUtils.isUndefinedNull(entries))) {
            if (CDUtils.isUndefinedNull(entries.duration)) {
                Log.warn("Context Props Feature: page duration loading was not calculated");
                return
            }
        }
        this._perfMonitor.reportMonitor('t.timeTillPageLoad',
            Math.round(entries.duration));
    }

    /*
     * Calculates the page load time based on navigation timing api:
     * PerformanceNavigationTiming: https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming
     * PerformanceObserver: https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver
     * Observer introduced in newer browser versions, so the PerformanceNavigationTiming might be defined but the Observer not
     */

    reportPageLoadTime() {
        //first checking if the new Performance Navigation API is supported
        //if not, it uses the old Navigation API
        if (window.performance && ("PerformanceNavigationTiming" in window)) {
            const entryType = "navigation";
            // if either PerformanceObserver or entryType are not defined/supported we use a fallback
            if (!("PerformanceObserver" in window) || !this._isEntrySupportedByBrowser(entryType)) {
                this.reportPageLoadTimeFallback();
                return;
            }
            // create PerformanceObserver instance
            const performanceObserver = new PerformanceObserver(this._observerCallback);
            try {
                //as of today, there is no sufficient way to detect if a browser supports the type attribute or not
                //therefore we use the try&catch approach.
                performanceObserver.observe({type: entryType, buffered: true});
            } catch (e) {
                this.reportPageLoadTimeFallback();
            }
        } else {
            this.reportPageLoadTimeFallback();
        }
    }

    //fallback function to calculate page loading time
    //for old browsers we use the deprecated interface- https://developer.mozilla.org/en/docs/Web/API/Navigation_timing_API

    reportPageLoadTimeFallback() {
        //sometimes the load event triggers before we subscribed to it.
        //this way we ensure calling the asyncCall function in case it has been missed
        if (DOMUtils.isWindowDocumentReady(window)) {
            this.callMethod.call(this._getEntriesByType);
            return;
        }
        CDUtils.addEventListener(self, 'load', () => {
            //since a timeout is needed for getting all PerformanceNavigationTiming entries
            //we use the asyncCall
            this.callMethod.call(this._getEntriesByType);
        })

    }

}


