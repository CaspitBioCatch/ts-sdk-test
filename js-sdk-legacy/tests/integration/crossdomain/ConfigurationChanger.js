import { MessageBusEventType } from '../../../src/main/events/MessageBusEventType';

export default class ConfigurationChanger {
    static change(sysLoader, configuration) {
        sysLoader.getConfigurationRepository().loadConfigurations(configuration);
        sysLoader.getMessageBus().publish(MessageBusEventType.ConfigurationLoadedEvent, sysLoader.getConfigurationRepository());
    }
}
