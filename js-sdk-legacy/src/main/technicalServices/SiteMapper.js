import Log from './log/Logger';

/**
 * This class is meant for working with configuration of the type { triggers:[], mappings:[] }
 * (see https://docs.google.com/a/biocatch.com/document/d/1onukKn6caLeiA20miRg_lFQB1-oyyv7HPF7z8IBTifw/edit?usp=sharing )
 * for more details.
 * The class will call the _onMatchCB with the matched mapping when a match is found.
 * Currently the class is being used by the ContextMgr for reporting contexts and by the SessionService for
 * resetting the session number in case the customer does not call the startNewSession API.
 */
export default class SiteMapper {
    constructor(mutationObserver, cdUtils, domUtils, siteMappingKey, matchCallback, stopOnFirstMappingMatch = true, maxMappings = 200) {
        this._mutationObserver = mutationObserver;
        this._siteMapKey = siteMappingKey;
        this._keyUrl = siteMappingKey + '_isUrlNonMasked';
        // Determines if after a first mapping match we continue to process additional mappings or not
        this._stopOnFirstMappingMatch = stopOnFirstMappingMatch;
        this._siteMap = null;
        this._observers = [];
        this._utils = cdUtils;
        this._domUtils = domUtils;
        this._onMatchCB = matchCallback;

        this._maxMappings = maxMappings;
        this._maxTriggers = 10;
    }

    updateObserver(observerCallback) {
        this._onMatchCB = observerCallback;
    }

    _observeChange(selector, handler) {
        if (selector) {
            try {
                const result = window.document.querySelector(selector);
                if (result) {
                    const obs = new this._mutationObserver(function (mutations) {
                        if (mutations.length > 0) {
                            handler();
                        }
                    });
                    // we need the subtree in order to follow changes on textNodes
                    obs.observe(result, {
                        childList: true,
                        characterData: true,
                        attributes: true,
                        subtree: true,
                    });
                    this._observers.push(obs);
                } else {
                    Log.error(`Selector:${JSON.stringify(selector)} not found on page. Check ${this._siteMapKey} configuration`);
                }
            } catch (ex) {
                Log.error(`SiteMapper._observeChange: ${ex.message}`, ex);
            }
        }
    }

    initTracking() {
        const testQuerySelector = () => {
            try {
                for (let j = 0; j < this._siteMap.mappings.length; j++) {
                    const mapping = this._siteMap.mappings[j];
                    // if no url check selector, if no selector, only url
                    if (!mapping.url || this._url.indexOf(mapping.url) > -1) {
                        if (mapping.selector) {
                            const result = window.document.querySelector(mapping.selector);
                            if (result) {
                                if (mapping.byText) {
                                    // selector & byText both expressions should be true
                                    if (
                                        (result.innerText !== undefined && result.innerText.indexOf(mapping.byText) !== -1)
                                        || (result.value === mapping.byText)
                                        || result.textContent === mapping.byText) {
                                        // by text can be either in inner text or in the value field(entered by user)
                                        this._onMatchCB(mapping);

                                        if (this._stopOnFirstMappingMatch) {
                                            return;
                                        }
                                    }
                                } else {
                                    // only selector - which exists
                                    this._onMatchCB(mapping);
                                    if (this._stopOnFirstMappingMatch) {
                                        return;
                                    }
                                }
                            }
                        } else if (this._url.indexOf(mapping.url) > -1) {
                            // only url
                            this._onMatchCB(mapping);
                            if (this._stopOnFirstMappingMatch) {
                                return;
                            }
                        }
                    }
                }
            } catch (ex) {
                Log.error(`SiteMapper:testQuerySelector failed. ex: ${ex.message}`, ex);
            }
        };

        if (!this._siteMap) {
            const siteMap = this._utils.StorageUtils.getFromSessionStorage(this._siteMapKey);
            if (siteMap && siteMap.triggers.length <= this._maxTriggers && siteMap.mappings.length <= this._maxMappings) {
                this._siteMap = siteMap;
            }
            this._isNonMaskedUrl = this._utils.StorageUtils.getFromSessionStorage(this._keyUrl);
        }

        if (this._siteMap) {
            this._url = this._isNonMaskedUrl ? window.document.location.href : this._utils.getDocUrl();
            this._domUtils.onDocumentBody(window, () => {
                // run module for mutationObserver
                if (this._mutationObserver) {
                    this._siteMap.triggers.forEach((trigger) => {
                        if (!trigger.url || this._url.indexOf(trigger.url) > -1) {
                            this._observeChange(trigger.selector, testQuerySelector);
                        }
                    });
                }
                testQuerySelector();
            });
        }
    }

    onConfigUpdate(configurationRepository) {
        try {
            if (!this._siteMap && configurationRepository.get(this._siteMapKey)) {
                this.stopTracking();
                const siteMap = configurationRepository.get(this._siteMapKey) && JSON.parse(configurationRepository.get(this._siteMapKey));
                this._isNonMaskedUrl = configurationRepository.get('useNonMaskedUrlInMappings');
                if (siteMap && siteMap.triggers.length <= this._maxTriggers && siteMap.mappings.length <= this._maxMappings) {
                    this._siteMap = siteMap;
                    // save config
                    this._utils.StorageUtils.saveToSessionStorage(this._siteMapKey, this._siteMap);
                    this._utils.StorageUtils.saveToSessionStorage(this._keyUrl, this._isNonMaskedUrl);
                    this.initTracking();
                } else {
                    Log.warn(`Configuration ${this._siteMapKey} contains an illegal amount of triggers or mappings. Max Allowed Triggers: ${this._maxTriggers}, `
                        + `Max Allowed Mappings: ${this._maxMappings}`);
                }
            }
        } catch (ex) {
            Log.error(`An error occurred while loading ${this._siteMapKey} configuration. Make sure the configuration value is valid. ${ex.message}`, ex);
        }
    }

    stopTracking() {
        for (let i = 0; i < this._observers.length; i++) {
            this._observers[i].disconnect();
        }

        this._observers = [];
        this._siteMap = null;
    }
}
