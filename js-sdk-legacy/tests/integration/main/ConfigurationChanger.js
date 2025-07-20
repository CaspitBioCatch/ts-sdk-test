import { MessageBusEventType } from '../../../src/main/events/MessageBusEventType';

export default class ConfigurationChanger {
    static change(sysLoader, configuration, forceOverride) {
        /**
         * The testing infra-structure is setting-up configurations via the configurationRepository.loadConfigurations.
         * Until the introduction of ConfigurationRepository.configOverrideBlackList this was 'reliable enough' way,
         * but since then - for setting up local configurations requires the additional forceOverride flag.
         * - force override also configurations which shouldn't be
         */
        sysLoader.getConfigurationRepository().loadConfigurations(configuration, forceOverride);
        sysLoader.getMessageBus().publish(MessageBusEventType.ConfigurationLoadedEvent, sysLoader.getConfigurationRepository());
    }
}
