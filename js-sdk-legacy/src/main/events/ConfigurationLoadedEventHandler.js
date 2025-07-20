import { MessageBusEventType } from './MessageBusEventType';
import { State } from '../core/state/State';
import Log from '../technicalServices/log/Logger';

/**
 * This class is for handling the configuration loaded event
 */
export default class ConfigurationLoadedEventHandler {
    constructor(messageBus,
                featureService,
                dataQ,
                pauseResumeMgr,
                handleMetadata,
                logger,
                contextMgr,
                sessionService,
                sensorDataQ,
                slaveListener,
                stateService,
                performanceMonitor,
                heartBeatMessageService,
                sensorGateKeeper,
                sidRepository,
                coordinatesMaskingConfigurationUpdater) {
        this._messageBus = messageBus;
        this._featureService = featureService;
        this._dataQ = dataQ;
        this._pauseResumeMgr = pauseResumeMgr;
        this._handleMetadata = handleMetadata;
        this._logger = logger;
        this._contextMgr = contextMgr;
        this._sessionService = sessionService;
        this._sensorDataQ = sensorDataQ;
        this._slaveListener = slaveListener;
        this._stateService = stateService;
        this._performanceMonitor = performanceMonitor;
        this._heartBeatMessageService = heartBeatMessageService;
        this._sensorGateKeeper = sensorGateKeeper;
        this._sidRepository = sidRepository;
        this._coordinatesMaskingConfigurationUpdater = coordinatesMaskingConfigurationUpdater;

        this._messageBus.subscribe(MessageBusEventType.ConfigurationLoadedEvent, this._handle.bind(this));
    }

    _handle(configurationRepository) {
        Log.info('Configurations were loaded from the server.');

        this._performanceMonitor.stopMonitor('t.timeTillServerConfig');

        this._featureService.updateRunByConfig(configurationRepository);
        this._dataQ.updateWithConfig(configurationRepository);
        this._pauseResumeMgr.onConfigUpdate(configurationRepository);
        this._handleMetadata.onConfigUpdate(configurationRepository);
        this._logger.updateLogConfig(configurationRepository);
        this._contextMgr.onConfigUpdate(configurationRepository);
        this._sessionService.onConfigUpdate(configurationRepository);
        this._sensorDataQ.onConfigUpdate(configurationRepository);
        this._slaveListener.onConfigUpdate(configurationRepository);
        this._heartBeatMessageService.updateConfig(configurationRepository);
        this._sensorGateKeeper.configure();
        this._sidRepository.onConfigUpdate(configurationRepository);
        this._coordinatesMaskingConfigurationUpdater.onConfigUpdate(configurationRepository);

        // Mark the state as started
        this._stateService.updateState(State.started);

        Log.info('Successfully configured system');
    }
}
