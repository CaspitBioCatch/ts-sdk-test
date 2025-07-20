/**
 * This class is for handling configuration load in the slave
 */
import { MessageBusEventType } from '../../main/events/MessageBusEventType';

export default class SlaveConfigurationLoadedEventHandler {
    constructor(messageBus,
                featureService,
                dataQ,
                pauseResumeMgr,
                logger,
                contextMgr,
                sensorGateKeeper) {
        this._messageBus = messageBus;
        this._featureService = featureService;
        this._dataQ = dataQ;
        this._pauseResumeMgr = pauseResumeMgr;
        this._logger = logger;
        this._contextMgr = contextMgr;
        this._sensorGateKeeper = sensorGateKeeper;

        this._messageBus.subscribe(MessageBusEventType.ConfigurationLoadedEvent, this._handle.bind(this));
    }

    _handle(configurationRepository) {
        this._featureService.updateRunByConfig(configurationRepository);
        this._dataQ.updateWithConfig(configurationRepository);
        this._pauseResumeMgr.onConfigUpdate(configurationRepository);
        this._logger.updateLogConfig(configurationRepository);
        this._contextMgr.onConfigUpdate(configurationRepository);
        this._sensorGateKeeper.configure();
    }
}
