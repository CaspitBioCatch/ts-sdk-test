import CDUtils from '../../technicalServices/CDUtils';
import { ConfigurationFields } from './ConfigurationFields';
import { AgentType } from "../../contract/AgentType";
import { CollectionMode } from "../../contract/CollectionMode";

export default class StartupConfigurationLoader {
    constructor(configurationRepository, startUpConfigurations) {
        this._configurationRepository = configurationRepository;
        this._startUpConfigurations = startUpConfigurations;
    }

    /**
     * Sets certain local startupConfiguration's values into their equivalent values in the remote configurationRepository.
     * By design - all configurations available both in remote and local - should be addressed explicitly within this function's body.
     */
    loadStartUpConfigurations() {
        this._setConfigurationOrDefault(
          ConfigurationFields.logAddress,
          this._startUpConfigurations.getLogServerURL(),
          null,
        );
        this._setConfigurationOrDefault(
          ConfigurationFields.enableMinifiedLogUri,
          this._startUpConfigurations.isMinifiedLogUriEnabled(),
          false,
        );
        this._setConfigurationOrDefault(
            ConfigurationFields.enableFramesProcessing,
            this._startUpConfigurations.getEnableFramesProcessing(),
            true
        );
        this._setConfigurationOrDefault(
            ConfigurationFields.enableCustomElementsProcessing,
            this._startUpConfigurations.getEnableCustomElementsProcessing(),
            false
        );
        this._setConfigurationOrDefault(
            ConfigurationFields.customElementAttribute,
            this._startUpConfigurations.getCollectionSettings().getElementSettings().getCustomElementAttribute(),
            'data-automation-id'
        );
        this._setConfigurationOrDefault(
            ConfigurationFields.enableSameSiteNoneAndSecureCookies,
            this._startUpConfigurations.getEnableSameSiteNoneAndSecureCookies(),
            true
        );
        this._setConfigurationOrDefault(
            ConfigurationFields.maskElementsAttributes,
            this._startUpConfigurations.getCollectionSettings().getElementSettings().getAttributesToMask(),
            []
        );
        this._setConfigurationOrDefault(
            ConfigurationFields.parentElementSelector,
            this._startUpConfigurations.getCollectionSettings().getCustomInputElementSettings().getParentElementSelector(),
            ''
        );
        this._setConfigurationOrDefault(
            ConfigurationFields.childElementWithCustomAttribute,
            this._startUpConfigurations.getCollectionSettings().getCustomInputElementSettings().getChildElementWithCustomAttribute(),
            ''
        );
        this._setConfigurationOrDefault(
            ConfigurationFields.elementDataAttribute,
            this._startUpConfigurations.getCollectionSettings().getCustomInputElementSettings().getElementDataAttribute(),
            ''
        );
        this._setConfigurationOrDefault(
            ConfigurationFields.customButtons,
            this._startUpConfigurations.getCollectionSettings().getCustomInputElementSettings().getCustomButtons(),
            []
        );
        this._setConfigurationOrDefault(
            ConfigurationFields.agentType,
            this._startUpConfigurations.getCollectionSettings().getAgentType(),
            AgentType.PRIMARY
        );
        this._setConfigurationOrDefault(
            ConfigurationFields.collectionMode,
            this._startUpConfigurations.getCollectionSettings().getAgentMode(),
            CollectionMode.FULL
        );
        this._setConfigurationOrDefault(
            ConfigurationFields.keyEventsMaskSpecialChars,
            this._startUpConfigurations.getCollectionSettings().getElementSettings().getKeyEventsMaskSpecialChars(),
            false
        );
        this._setConfigurationOrDefault(
            ConfigurationFields.enableWupMessagesHashing,
            this._startUpConfigurations.getClientSettings()?.enableWupMessagesHashing,
            false
        );
        this._setConfigurationOrDefault(
            ConfigurationFields.enableCoordinatesMasking,
            this._startUpConfigurations.getClientSettings()?.enableCoordinatesMasking,
            false
        );
        this._setConfigurationOrDefault(
            ConfigurationFields.enableStartupCustomerSessionId,
            this._startUpConfigurations.getEnableStartupCustomerSessionId(),
            false
        );
        this._setNumberConfigurationOrDefault(
            ConfigurationFields.mutationMaxChunkSize,
            this._startUpConfigurations.getMutationMaxChunkSize(),
            0
        );
        this._setNumberConfigurationOrDefault(
            ConfigurationFields.mutationChunkDelayMs,
            this._startUpConfigurations.getMutationChunkDelayMs(),
            100
        );
        this._setConfigurationOrDefault(
            ConfigurationFields.passwordIdMaskingList,
            this._startUpConfigurations.getPasswordIdMaskingList(),
            []
        );
        this._setConfigurationOrDefault(
          ConfigurationFields.enableUnmaskedValues,
          this._startUpConfigurations.isUnmaskedValuesEnabled(),
          false
        );
        this._setConfigurationOrDefault(
          ConfigurationFields.allowedUnmaskedValuesList,
          this._startUpConfigurations.getAllowedUnmaskedValuesList(),
          []
        );
        this._setConfigurationOrDefault(
          ConfigurationFields.useLegacyZeroTimeout,
          this._startUpConfigurations.getUseLegacyZeroTimeout(),
          []
        );
    }
    _setConfigurationOrDefault(ConfigurationField, startupConfiguration, defaultValue) {
        if (!CDUtils.isUndefinedNull(startupConfiguration)) {
            this._configurationRepository.set(ConfigurationField, startupConfiguration);
        } else {
            this._configurationRepository.set(ConfigurationField, defaultValue);
        }
    }

    _setNumberConfigurationOrDefault(ConfigurationField, startupConfiguration, defaultValue) {
        if (CDUtils.isNumber(startupConfiguration)) {
            this._configurationRepository.set(ConfigurationField, startupConfiguration);
        } else {
            this._configurationRepository.set(ConfigurationField, defaultValue);
        }
    }
}
