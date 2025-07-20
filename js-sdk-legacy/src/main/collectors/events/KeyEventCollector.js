import DataCollector from '../DataCollector';
import { MessageBusEventType } from '../../events/MessageBusEventType';
import { IsTrustedValue } from './IsTrustedValue';
import { ConfigurationFields } from '../../core/configuration/ConfigurationFields';
import Log from '../../technicalServices/log/Logger';
import { SameCharType } from '../../services/SameCharService';
import { KeyRegionsStringTable } from './KeyRegionsStringTable';


const featureSettings = {
    configKey: 'isKeyEvents',
    isDefault: true,
    shouldRunPerContext: false,
    shouldRunPerSession: false,
    shouldRun: true,
    isFrameRelated: true,
    runInSlave: true,
    runInLean: true,
    runInUns: false,
    isRunning: false,
    instance: null,
};

export const KeyEventType = {
    keyup: 0,
    keydown: 1,
    keypress: 2,
};

const DEFAULT_KEY_REGION_VALUE = '-1';

export const EventStructure = ['eventSequence', 'timestamp', 'eventType', 'isTrusted', 'elementHash', 'charCode', 'character', 'keyComboType',
    'isCtrl', 'isShift', 'isAlt', 'isMetaKey', 'keyLocation', 'code', 'key', 'isRepeat', 'keyRegion', 'relativeTime', 'isSameKey'];

export default class KeyEventCollector extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    constructor(configurationRepository, utils, elements, dataQueue, msgbus, sameCharService, maskingService, startupConfigurations) {
        super();

        this._configurationRepository = configurationRepository;
        this._utils = utils;
        this._elements = elements;
        this._dataQueue = dataQueue;
        this._msgBus = msgbus;
        this._sameCharService = sameCharService;
        this._maskingService = maskingService;
        this._maxShadowDepth = startupConfigurations.getMaxShadowDepth();
        this._iframeLoadingTimeout = startupConfigurations.getIframeLoadingTimeout()


        // ctrl+c, ctrl+v, ctrl+a, ctrl+x, ctrl+z, ctrl+p, ctrl+s
        this.comboCodes = ['c', 'v', 'a', 'x', 'z', 'p', 's'];
        this._onKeyEvent = this._onKeyEvent.bind(this);
        this._useCaptureEvents = this._configurationRepository.get(ConfigurationFields.isCaptureKeyEvents);

        this._listeners = [];
        this._listenedDocuments = new WeakSet();
    }

    /**
     * @param {BrowserContext} browserContext
     */
    startFeature(browserContext) {
        try {
            const currDocument = browserContext.getDocument();
            this._bind(currDocument, this._onKeyEvent, this._useCaptureEvents);

            browserContext.collectAllElementsBySelectorAsync('iframe', this._maxShadowDepth, this._iframeLoadingTimeout)
                .then((iframes) => {
                    iframes.forEach((iframe) => {
                        if (iframe && iframe.contentDocument) {
                            this._bind(iframe.contentDocument, this._onKeyEvent, this._useCaptureEvents);
                        }
                    });
                })
        } catch (err) {
            Log.error(`KeyEvents:startFeature failed, msg: ${err.message}`, err);
        }
    }

    /**
     * @param {BrowserContext} browserContext
     */
    stopFeature(browserContext) {
        try {
            const currDocument = browserContext.getDocument();
            this._unbind(currDocument);
            browserContext.collectAllElementsBySelectorAsync('iframe', this._maxShadowDepth, this._iframeLoadingTimeout)
                .then((iframes) => {
                    iframes.forEach((iframe) => {
                        if (iframe && iframe.contentDocument) {
                            this._unbind(iframe.contentDocument);
                        }
                    });
                })
        } catch (err) {
            Log.error(`KeyEvents:stopFeature failed, msg: ${err.message}`, err);
        }
    }

    /**
     * @param {BrowserContext} browserContext
     */
    updateFeatureConfig(browserContext) {
        try {
            if (this._configurationRepository.get(ConfigurationFields.isCaptureKeyEvents) !== this._useCaptureEvents) {
                const currDocument = browserContext.getDocument();
                const useCaptureEvents = this._configurationRepository.get(ConfigurationFields.isCaptureKeyEvents);

                // Remove current subscribers
                this._unbind(currDocument);

                // Subscribe using the new capture definition
                this._bind(currDocument, this._onKeyEvent, useCaptureEvents);
                this._useCaptureEvents = useCaptureEvents;
            }
        } catch (err) {
            Log.error(`KeyEvents:startFeature failed, msg: ${err.message}`, err);
        }
    }

    _bind(document, handler, isCapture) {
        if (this._listenedDocuments.has(document)) {
            return; // Already added
        }
        this._listenedDocuments.add(document);

        this._addListener(document, 'keyup', handler, isCapture);
        this._addListener(document, 'keydown', handler, isCapture);
        this._addListener(document, 'keypress', handler, isCapture);
    }

    _unbind(document) {
        this._listenedDocuments.delete(document);

        this._removeAllListeners(document, 'keyup');
        this._removeAllListeners(document, 'keydown');
        this._removeAllListeners(document, 'keypress');
    }

    _addListener(target, type, handler, options) {
        target.addEventListener(type, handler, options);
        this._listeners.push({ target, type, handler, options });
    }

    _removeAllListeners(target, type) {
        this._listeners
            .filter((l) => {return l.target === target && l.type === type})
            .forEach((l) => {
                l.target.removeEventListener(l.type, l.handler, l.options);
            });
        this._listeners = this._listeners.filter((l) => {return !(l.target === target && l.type === type)});
    }

    _onKeyEvent(e) {
        const type = KeyEventType[e.type];
        if (type === KeyEventType.keydown
            || type === KeyEventType.keyup) {
            this._msgBus.publish(MessageBusEventType.KeyEvent, { action: type });
        }
        this._handleKeyEvent(e, 'key_events');
    }

    _handleKeyEvent(e, eventName) {
        //get element id for masking
        const element = this._elements.getRealEventTarget(e);
        const elementID = element.id

        let eventType = KeyEventType[e.type];
        if (this._utils.isUndefinedNull(eventType)) {
            eventType = -1;
        }
        const eventSequence = this._utils.StorageUtils.getAndUpdateEventSequenceNumber();
        const timestamp = this.getEventTimestamp(e);
        const eventKey = e.key || this._maskingService.getKeyFromLegacyProperties(e);
        const eventCode = e.code || '';
        const KeyMaskedParameters = this._maskingService.maskKey(eventKey, eventCode, elementID);
        const character = (KeyMaskedParameters.key.length > 1) ? '' : KeyMaskedParameters.key;
        const elementHash = this._elements.getElementHashFromEvent(e);
        // make sure it doesn't count double
        const keyComboType = this._getComboType(e, eventKey); // only on keydown
        const isTrusted = IsTrustedValue[e.isTrusted];
        const metaKey = e.key === 'Meta' || e.key === 'OS' || e.key === 'Win' || e.metaKey || e.keyCode === 91 || e.keyCode === 92;
        const keyRegion = this._configurationRepository.get(ConfigurationFields.collectKeyRegionValue) ? this._getKeyRegion(eventCode) : DEFAULT_KEY_REGION_VALUE;
        const relativeTs = this.getTimestampFromEvent(e);
        let isSameKey = SameCharType.undefined;
        if (e.type === 'keypress') {
            isSameKey = this._sameCharService.compare(e.target, e.key);
            this._sameCharService.update(e.target, e.key);
        }

        // the if is for performance optimization
        if (Log.isDebug()) {
            Log.trace(`onKeyEvent: got event: ${eventType}, at time:${timestamp}, key: ${KeyMaskedParameters.key}, code:${KeyMaskedParameters.code}, old charCode:${KeyMaskedParameters.charCode}`);
        }
        this._dataQueue.addToQueue(eventName,
            this._utils.convertToArrayByMap(EventStructure,
                {
                    eventType,
                    eventSequence,
                    timestamp,
                    charCode: KeyMaskedParameters.charCode,
                    character,
                    elementHash,
                    keyComboType,
                    isTrusted,
                    isCtrl: e.ctrlKey || false,
                    isShift: e.shiftKey || false,
                    isAlt: e.altKey || false,
                    isMetaKey: metaKey || false,
                    keyLocation: e.location || 0,
                    code: KeyMaskedParameters.code || '',
                    key: KeyMaskedParameters.key || '',
                    location: e.location || '',
                    isRepeat: e.repeat || false, // is pressed repeatedly,
                    keyRegion,
                    relativeTime: relativeTs,
                    isSameKey,
                }));
    }

    _getKeyRegion(code) {
        return KeyRegionsStringTable[code] ? KeyRegionsStringTable[code] : DEFAULT_KEY_REGION_VALUE;
    }

    _getComboType(e, eventKey) {
        return (e.ctrlKey || e.metaKey) && eventKey !== undefined ? this.comboCodes.indexOf(eventKey) : -1;
    }
}
