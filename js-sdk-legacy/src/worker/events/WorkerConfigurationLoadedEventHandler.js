/**
 * This class is for handling configuration updates in worker
 */
import { MessageBusEventType } from '../../main/events/MessageBusEventType';
import { ConfigurationFields } from '../../main/core/configuration/ConfigurationFields';
import { ConfigurationDefaultTemplates } from '../../main/core/configuration/ConfigurationRepository';
import { WorkerEvent } from '../../main/events/WorkerEvent';

export default class WorkerConfigurationLoadedEventHandler {
    constructor(messageBus,
                wupStatisticsService,
                dataDispatcher,
                logDataDispatcher,
                serverCommunicator,
                wupServerClient,
                logServerClient,
                logger,
                mainCommunicator) {
        this._messageBus = messageBus;
        this._wupStatisticsService = wupStatisticsService;
        this._dataDispatcher = dataDispatcher;
        this._logDataDispatcher = logDataDispatcher;
        this._serverCommunicator = serverCommunicator;
        this._wupServerClient = wupServerClient;
        this._logServerClient = logServerClient;
        this._logger = logger;
        this._mainCommunicator = mainCommunicator;

        this._messageBus.subscribe(MessageBusEventType.ConfigurationLoadedEvent, this._handle.bind(this));
    }

    _handle(configurationRepository) {

        this._wupStatisticsService.updateSettings(configurationRepository.get(ConfigurationFields.wupStatisticsLogIntervalMs));

        const wupDispatcheRateSettings = configurationRepository.get(ConfigurationFields.forceDynamicDataWupDispatchSettings) ? ConfigurationDefaultTemplates.defaultDynamicWupDispatchRateConfiguration
            : configurationRepository.get(ConfigurationFields.dataWupDispatchRateSettings);

        this._dataDispatcher.updateByConfig(wupDispatcheRateSettings);

        this._logDataDispatcher.updateByConfig(configurationRepository.get(ConfigurationFields.logWupDispatchRateSettings));
        this._serverCommunicator.updateSettings(configurationRepository.get(ConfigurationFields.serverCommunicationSettings));
        this._logger.updateLogConfig(configurationRepository);

        // Update the request timeouts in wup and log server clients. wupResponseTimeout config is deprecated but we still try to take it for backwards compatibility
        this._wupServerClient.setRequestTimeout(configurationRepository.get(ConfigurationFields.wupMessageRequestTimeout) || configurationRepository.get(ConfigurationFields.wupResponseTimeout));
        this._logServerClient.setRequestTimeout(configurationRepository.get(ConfigurationFields.logMessageRequestTimeout));


        this._wupServerClient.setConfigurationWupMessage();
        this._logServerClient.setConfigurationLogMessage();


        // Notify the main thread that configurations were loaded
        this._mainCommunicator.sendAsync(WorkerEvent.ConfigurationLoadedEvent, configurationRepository.getAll());
    }
}
