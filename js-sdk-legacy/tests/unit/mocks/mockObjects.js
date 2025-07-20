/* eslint-disable */
import CDUtils from '../../../src/main/technicalServices/CDUtils';
import CDEvent from '../../../src/main/infrastructure/CDEvent';

export const dataQueue = {
    requests: [],
    addToQueue(name, object) {
        if (this.requests) {
            this.requests.push(object);
        } else if (requests) {
            this.requests.push(object);
        }
    },
    resetHistory() {
        this.requests = [];
    }
};

export function TestTargetEvent() {
}

TestTargetEvent.prototype.addEventListener = function (type, callback) {
};
TestTargetEvent.prototype.removeEventListener = function (type, callback) {
};
TestTargetEvent.prototype.dispatchEvent = function (event) {
};

export const MockObjects = {

    get contextMgr() {
        return {
            contextId: 0,
            contextName: null,
            changeContext(name) {
                if (name !== this.contextName) {
                    this.contextName = name;
                    this.onContextChange.publish({
                        name,
                        contextId: 1,
                        url: 'https://aaa.bbb.ccc',
                        timestamp: 55,
                    });
                }
            },
            onContextChange: new CDEvent(),
            setContext(contextData) {
            },
            onConfigUpdate(configurationRepository) {
            },
            onSessionReset() {
            },
        };
    },

    get featureList() {
        return {
            list: {
                TestFeat1: {
                    configKey: 'isTestFeat1',
                    isDefault: true,
                    shouldRunPerSession: false,
                    shouldRunPerContext: false,
                    shouldRun: true,
                    isFrameRelated: true,
                    isRunning: false,
                    runInUns: true,
                    runInLean: true,
                    init() {
                        this._features.list.TestFeat1.instance = 'TestFeat1Instance';
                    },
                    instance: null,
                },
                TestFeat2: {
                    configKey: 'isTestFeat2',
                    isDefault: true,
                    shouldRunPerSession: false,
                    shouldRunPerContext: false,
                    shouldRun: true,
                    isFrameRelated: false,
                    isRunning: false,
                    runInLean: true,
                    init() {
                        this._features.list.TestFeat2.instance = 'TestFeat2Instance';
                    },
                    instance: null,
                },
                TestFeat3: {
                    configKey: 'isTestFeat3',
                    isDefault: false,
                    shouldRunPerSession: false,
                    shouldRunPerContext: false,
                    shouldRun: true,
                    isFrameRelated: true,
                    runInUns: true,
                    isRunning: false,
                    runInLean: false,
                    init() {
                        this._features.list.TestFeat3.instance = 'TestFeat3Instance';
                    },
                    instance: null,
                },
                TestFeat4: {
                    configKey: 'isTestFeat4',
                    isDefault: true,
                    shouldRunPerSession: false,
                    shouldRunPerContext: false,
                    shouldRun: true,
                    isFrameRelated: true,
                    isRunning: false,
                    runInLean: false,
                    init() {
                        this._features.list.TestFeat4.instance = 'TestFeat4Instance';
                    },
                    instance: null,
                },
                TestFeat5: {
                    configKey: 'isTestFeat5',
                    isDefault: false,
                    shouldRunPerSession: false,
                    shouldRunPerContext: false,
                    shouldRun: true,
                    isFrameRelated: false,
                    isRunning: false,
                    runInLean: false,
                    init() {
                        this._features.list.TestFeat5.instance = 'TestFeat5Instance';
                    },
                    instance: null,
                },
                TestFeat6: {
                    configKey: 'isTestFeat6',
                    isDefault: false,
                    shouldRunPerSession: true,
                    shouldRunPerContext: false,
                    shouldRun: true,
                    isFrameRelated: false,
                    isRunning: false,
                    runInLean: false,
                    init() {
                        this._features.list.TestFeat5.instance = 'TestFeat7Instance';
                    },
                    instance: null,
                },
                TestFeat7: {
                    configKey: 'isTestFeat7',
                    isDefault: false,
                    shouldRunPerSession: false,
                    shouldRunPerContext: true,
                    shouldRun: true,
                    isFrameRelated: false,
                    isRunning: false,
                    runInLean: false,
                    init() {
                        this._features.list.TestFeat5.instance = 'TestFeat7Instance';
                    },
                    instance: null,
                },
            },
            getDefaultFeatures() {
                return this.getFeaturesByCondition((feature) => {
                    return feature.isDefault;
                });
            },
            getPerSessionFeatures() {
                return this.getFeaturesByCondition((feature) => {
                    return feature.shouldRunPerSession;
                });
            },
            getPerContextFeatures(){
                return this.getFeaturesByCondition((feature) => {
                    return feature.shouldRunPerContext;
                });
            },
            getNonDefaultFeatures(){
                return this.getFeaturesByCondition((feature) => {
                    return !feature.isDefault && !feature.shouldRunPerContext && !feature.shouldRunPerSession;
                });
            },
            getFeaturesByCondition(condition) {
                const defaultFeatures = {};
                Object.keys(this.list).forEach((featureKey) => {
                    const feature = this.list[featureKey];
                    if (condition(feature)) {
                        defaultFeatures[featureKey] = feature;
                    }
                });

                return defaultFeatures;
            },
        }
    },

    get unsPort() {
        return {
            postMessage(msg) {
            },
            close() {
            },
            setonmessage(cb) {
            },
        };
    },

    get eventAggregator() {
        return {
            addEventListener(target, type, handler, isCapture = false,
                             isPassive = true, isOnce = false) {
            },
            removeEventListener(target, type, handler, isCapture = false) {
            }
        }
    },

    get cdUtils() {
        return {
            isUndefinedNull(value) {
                return (typeof (value) === 'undefined' || value === null || value === undefined);
            },
            dateNow() {
                return Date.now();
            },
            scriptVersion(){
              return  '2.22.0';
            },
            isPassiveSupported: CDUtils.isPassiveSupported,
            // This function is not a mock since it is needed for testing functionality
            addEventListener: CDUtils.addEventListener.bind(CDUtils),
            // This function is not a mock since it is needed for testing functionality
            removeEventListener: CDUtils.removeEventListener.bind(CDUtils),

            clearTextFromNumbers(text) {
                return text;
            },
            maskText(text) {
                return text;
            },
            getDropDownListValues() {
                return [];
            },
            getMapCode(b, c, d) {
                // 'A'
                return 65;
            },
            generateUUID() {
                let d = Date.now();
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    const r = (d + Math.random() * 16) % 16 | 0;
                    d = Math.floor(d / 16);
                    return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                });
            },
            getHash(value) {
                return value.length + 2908394;
            },
            getTruncatedHash(value) {
                return value.substring(2);
            },
            getXPath(elem) {
                return 'elem_full_path_' + elem.className;
            },
            getPostUrl(url, method, data, onSuccess, onError) {

            },
            minutesToMilliseconds(minutes) {
                return minutes * 60 * 1000;
            },
            cutDecimalPointDigits(num, len) {
                return num;
            },
            StorageUtils: {
                counter: 0,
                getAndUpdateEventSequenceNumber() {
                    this.counter++;
                    return this.counter;
                },
                getFromLocalStorage(key) {
                    return 'aaa-123-bbb';
                },
                removeFromLocalStorage(key) {
                },
                saveToLocalStorage(key, value, expiration) {
                },
                getFromSessionStorage(key) {
                },
                saveToSessionStorage(key, value) {
                },
                getCookie(key) {
                },
                setCookie(key, value, miliSec) {
                },
            },
            JQueryUtils: {
                isJQueryAvailable() {
                    return false;
                },

                addEventListener(element, type, handler) {
                },

                removeEventListener(element, type, handler) {
                },
            },
            convertToArrayByMap(structure, map) {
                return ['stubbed', 'array']; // always returns fixed value
            },
        };
    },

    get domUtils() {
        return {
            // This function is not a mock since it is needed for testing functionality
            addEventListener: CDUtils.addEventListener.bind(CDUtils),
            // This function is not a mock since it is needed for testing functionality
            removeEventListener: CDUtils.removeEventListener.bind(CDUtils),

            getXPath() {
                return 'xpath';
            },
            onPageLoad() {
            },
            onDocumentBody(frame, callback) {
            },
            onWindowDocumentReady(contentWindow, callback) {
            },
            isWindowDocumentReady(contentWindow) {
            },
            canAccessIFrame(frame) {
            },
            canAccessIFrame(frame) {
            },
            isSubtleCryptoSupported() {
            },
            matches(element, selector) {
            },
        };
    },

    get logger() {
        return {
            info() {
            },
            debug() {
            },
            updateLogConfig() {
            },
        };
    },
};
/* eslint-enable */
