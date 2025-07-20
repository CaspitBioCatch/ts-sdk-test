import { ApiContractName } from "../../main/api/ApiContractName";
import SlaveConfigurations from "./SlaveConfigurations";
import { APIConfigurationKey } from "../../main/contract/APIConfigurationKey";
import CDUtils from "../../main/technicalServices/CDUtils";

export default class SlaveCdApiFacade {

    isSlaveCdApiAvailable() {
        return !CDUtils.isUndefinedNull(window.slaveCdApi)
    }

    isApiAvailable(api) {
        return this.isSlaveCdApiAvailable() && !CDUtils.isUndefinedNull(window.slaveCdApi[api])
    }

    _isValidConfiguration(configuration) {
        return !CDUtils.isUndefinedNull(configuration) && CDUtils.isBoolean(configuration);
    }

    _isValidNumberConfiguration(configuration) {
        return !CDUtils.isUndefinedNull(configuration) && CDUtils.isNumber(configuration);
    }

    getConfigurations() {
        let enableCustomElementDetector = true;
        let enablePreHandshakeEvents = null;
        let mutationMaxChunkSize = 0;
        let mutationChunkDelayMs = 100;
        let maxShadowDepth = 0;
        let iframeLoadingTimeout = 5000;
        let useLegacyZeroTimeout = true;

        if (this.isApiAvailable(ApiContractName.GetConfigurations)) {
            window.slaveCdApi[ApiContractName.GetConfigurations]((configurations) => {
                if (configurations) {
                    if (configurations.hasOwnProperty(APIConfigurationKey.enableCustomElementDetector)) {
                        const configuration = configurations[APIConfigurationKey.enableCustomElementDetector]
                        enableCustomElementDetector = this._isValidConfiguration(configuration) ? configuration : enableCustomElementDetector;
                    }

                    if (configurations.hasOwnProperty(APIConfigurationKey.enableAcknowledgeMessageEvents)) {
                        const configuration = configurations[APIConfigurationKey.enableAcknowledgeMessageEvents]
                        enablePreHandshakeEvents = this._isValidConfiguration(configuration) ? configuration : enablePreHandshakeEvents;
                    }

                    if (configurations.hasOwnProperty(APIConfigurationKey.mutationMaxChunkSize)) {
                        const configuration = configurations[APIConfigurationKey.mutationMaxChunkSize];
                        mutationMaxChunkSize = this._isValidNumberConfiguration(configuration) ? configuration : mutationMaxChunkSize;
                    }

                    if (configurations.hasOwnProperty(APIConfigurationKey.mutationChunkDelayMs)) {
                        const configuration = configurations[APIConfigurationKey.mutationChunkDelayMs];
                        mutationChunkDelayMs = this._isValidNumberConfiguration(configuration) ? configuration : mutationChunkDelayMs;
                    }

                    if (configurations.hasOwnProperty(APIConfigurationKey.maxShadowDepth)) {
                        const configuration = configurations[APIConfigurationKey.maxShadowDepth];
                        maxShadowDepth = this._isValidNumberConfiguration(configuration) ? configuration : maxShadowDepth;
                    }

                    if (configurations.hasOwnProperty(APIConfigurationKey.iframeLoadingTimeout)) {
                        const configuration = configurations[APIConfigurationKey.iframeLoadingTimeout];
                        iframeLoadingTimeout = this._isValidNumberConfiguration(configuration) ? configuration : iframeLoadingTimeout;
                    }
                    if (configurations.hasOwnProperty(APIConfigurationKey.useLegacyZeroTimeout)) {
                        const configuration = configurations[APIConfigurationKey.useLegacyZeroTimeout];
                        useLegacyZeroTimeout = configuration
                    }
                }
            });
        }

        return new SlaveConfigurations(enableCustomElementDetector, enablePreHandshakeEvents, mutationMaxChunkSize, mutationChunkDelayMs, maxShadowDepth, iframeLoadingTimeout, useLegacyZeroTimeout);
    }
}

