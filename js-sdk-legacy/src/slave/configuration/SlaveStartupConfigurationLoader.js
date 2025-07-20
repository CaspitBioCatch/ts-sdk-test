import CDUtils from "../../main/technicalServices/CDUtils";
import { ConfigurationFields } from "../../main/core/configuration/ConfigurationFields";

export default class SlaveStartupConfigurationLoader {
    constructor(configurationRepository, startUpConfigurations) {
        this._configurationRepository = configurationRepository;
        this._startUpConfigurations = startUpConfigurations;
    }

    loadStartUpConfigurations() {
        this._setBooleanConfigurationOrDefault(ConfigurationFields.enableAcknowledgeMessageEvents, this._startUpConfigurations.getEnableBufferAckMessage(), false);
        this._setNumberConfigurationOrDefault(ConfigurationFields.mutationMaxChunkSize, this._startUpConfigurations.getMutationMaxChunkSize(), 0);
        this._setNumberConfigurationOrDefault(ConfigurationFields.mutationChunkDelayMs, this._startUpConfigurations.getMutationChunkDelayMs(), 100);
        this._setBooleanConfigurationOrDefault(ConfigurationFields.useLegacyZeroTimeout, this._startUpConfigurations.getUseLegacyZeroTimeout(), false);
    }

    _setBooleanConfigurationOrDefault(ConfigurationField, startupConfiguration, defaultValue) {
        if (CDUtils.isBoolean(startupConfiguration)) {
            this._configurationRepository.set(ConfigurationField, startupConfiguration);
        } else {
            this._configurationRepository.set(ConfigurationField, defaultValue)
        }
    }

    _setNumberConfigurationOrDefault(ConfigurationField, startupConfiguration, defaultValue) {
        if (CDUtils.isNumber(startupConfiguration)) {
            this._configurationRepository.set(ConfigurationField, startupConfiguration);
        } else {
            this._configurationRepository.set(ConfigurationField, defaultValue)
        }
    }
}
