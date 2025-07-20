import CollectionSettings from './CollectionSettings';

export default class StartupConfigurations {
    constructor(wupServerURL,
                logServerURL,
                enableFramesProcessing,
                enableCustomElementsProcessing,
                enableSameSiteNoneAndSecureCookies,
                useUrlWorker,
                workerUrl,
                isWupServerURLProxy,
                clientSettings,
                collectionSettings,
                enableStartupCustomerSessionId,
                mutationMaxChunkSize,
                mutationChunkDelayMs,
                passwordIdMaskingList,
                enableUnmaskedValues,
                allowedUnmaskedValuesList,
                enableCoordinatesMasking,
                isFlutterApp,
                enableMinifiedWupUri,
                enableMinifiedLogUri,
                maxShadowDepth,
                iframeLoadingTimeout,
                elementCategories,
                elementAttributes,
                enableMathDetect,
                enableBrowserDisplayDetect,
                enableGraphCard,
                useLegacyZeroTimeout

    ) {
        this._wupServerURL = wupServerURL;
        this._logServerURL = logServerURL;
        this._enableFramesProcessing = enableFramesProcessing;
        this._enableCustomElementsProcessing = enableCustomElementsProcessing;
        this._enableSameSiteNoneAndSecureCookies = enableSameSiteNoneAndSecureCookies
        this._useUrlWorker = useUrlWorker;
        this._workerUrl = workerUrl;
        this._isWupServerURLProxy = isWupServerURLProxy;
        this._clientSettings = clientSettings;
        this._collectionSettings = collectionSettings || new CollectionSettings();
        this._enableStartupCustomerSessionId = enableStartupCustomerSessionId;
        this._mutationMaxChunkSize = mutationMaxChunkSize || 0;
        this._mutationChunkDelayMs = mutationChunkDelayMs || 100;
        this._passwordIdMaskingList = passwordIdMaskingList;
        this._enableUnmaskedValues = enableUnmaskedValues || false;
        this._allowedUnmaskedValuesList = allowedUnmaskedValuesList || [];
        this._enableCoordinatesMasking = enableCoordinatesMasking || false;
        this._isFlutterApp = isFlutterApp || false;
        this._enableMinifiedWupUri = enableMinifiedWupUri !== undefined ? enableMinifiedWupUri : true;
        this._enableMinifiedLogUri = enableMinifiedLogUri !== undefined ? enableMinifiedLogUri : false;
        this._maxShadowDepth = maxShadowDepth || 0;
        this._iframeLoadingTimeout = iframeLoadingTimeout || 5000;
        this._elementCategories = elementCategories;
        this._elementAttributes = elementAttributes;
        this._enableMathDetect = enableMathDetect;
        this._enableBrowserDisplayDetect = enableBrowserDisplayDetect;
        this._enableGraphCard = enableGraphCard;
        this._useLegacyZeroTimeout = useLegacyZeroTimeout;
    }

    getWupServerURL() {
        return this._wupServerURL;
    }

    getLogServerURL() {
        return this._logServerURL;
    }

    isMinifiedLogUriEnabled() {
        return this._enableMinifiedLogUri;
    }

    getEnableFramesProcessing() {
        return this._enableFramesProcessing;
    }

    getEnableCustomElementsProcessing() {
        return this._enableCustomElementsProcessing;
    }

    getEnableSameSiteNoneAndSecureCookies() {
        return this._enableSameSiteNoneAndSecureCookies;
    }

    getUseUrlWorker() {
        return this._useUrlWorker;
    }

    getWorkerUrl() {
        return this._workerUrl;
    }

    getIsWupServerURLProxy() {
        return this._isWupServerURLProxy;
    }

    getClientSettings() {
        return this._clientSettings;
    }

    getCollectionSettings() {
        return this._collectionSettings;
    }
    getEnableStartupCustomerSessionId() {
        return this._enableStartupCustomerSessionId;
    }

    getMutationMaxChunkSize() {
        return this._mutationMaxChunkSize;
    }

    getMutationChunkDelayMs() {
        return this._mutationChunkDelayMs;
    }

    getPasswordIdMaskingList() {
        return this._passwordIdMaskingList;
    }

    isUnmaskedValuesEnabled() {
        return this._enableUnmaskedValues;
    }

    getAllowedUnmaskedValuesList() {
        return this._allowedUnmaskedValuesList;
    }

    isCoordinatesMaskingEnabled() {
        return this._enableCoordinatesMasking;
    }

    isFlutterApp() {
        return this._isFlutterApp;
    }

    isMinifiedWupUriEnabled() {
        return this._enableMinifiedWupUri;
    }

    getMaxShadowDepth() {
        return this._maxShadowDepth;
    }

    getIframeLoadingTimeout() {
        return this._iframeLoadingTimeout;
    }

    getElementCategories() {
        return this._elementCategories;
    }

    getElementAttributes() {
        return this._elementAttributes;
    }

    isMathDetectEnabled() {
        return this._enableMathDetect;
    }

    isBrowserDisplayDetectEnabled() {
        return this._enableBrowserDisplayDetect;
    }

    isGraphCardEnabled() {
        return this._enableGraphCard;
    }

    getUseLegacyZeroTimeout() {
        return this._useLegacyZeroTimeout;
    }
}
