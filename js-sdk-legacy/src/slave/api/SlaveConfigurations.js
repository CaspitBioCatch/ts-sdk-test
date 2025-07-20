export default class SlaveConfigurations {
    constructor(enableCustomElementDetector = true, enableBufferAckMessage, mutationMaxChunkSize, mutationChunkDelayMs, maxShadowDepth, iframeLoadingTimeout, useLegacyZeroTimeout) {
        this._enableCustomElementDetector = enableCustomElementDetector;
        this._enableBufferAckMessage = enableBufferAckMessage;
        this._mutationMaxChunkSize = mutationMaxChunkSize;
        this._mutationChunkDelayMs = mutationChunkDelayMs;
        this._maxShadowDepth = maxShadowDepth;
        this._iframeLoadingTimeout = iframeLoadingTimeout;
        this._useLegacyZeroTimeout = useLegacyZeroTimeout;
    }

    getEnableCustomElementDetector() {
        return this._enableCustomElementDetector
    }

    getEnableBufferAckMessage() {
        return this._enableBufferAckMessage;
    }

    getMutationMaxChunkSize() {
        return this._mutationMaxChunkSize;
    }

    getMutationChunkDelayMs() {
        return this._mutationChunkDelayMs;
    }

    isFlutterApp() {
        /**
         * If the hosting app and the sdk is built by Flutter engine - it doesn't make any sense (for now) the deprecated hybrid solution
         * would be enabled.
         */
        return false;
    }

    getMaxShadowDepth() {
        return this._maxShadowDepth;
    }

    getIframeLoadingTimeout() {
        return this._iframeLoadingTimeout;
    }

    getUseLegacyZeroTimeout() {
        return this._useLegacyZeroTimeout;
    }
}
