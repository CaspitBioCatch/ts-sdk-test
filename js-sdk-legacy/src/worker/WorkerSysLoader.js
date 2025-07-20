// eslint-disable-next-line max-classes-per-file
import { ConfigurationFields } from '../main/core/configuration/ConfigurationFields';
import { WorkerEvent } from '../main/events/WorkerEvent';
import ConfigurationRepository, { ConfigurationDefaultTemplates } from '../main/core/configuration/ConfigurationRepository';
import WupServerSessionState from './communication/WupServerSessionState';
import LogRequestBodyBuilder from './communication/LogRequestBodyBuilder';
import ServerCommunicator from './communication/ServerCommunicator';
import LogMessageBuilder from './communication/LogMessageBuilder';
import DataPacker from './wup/DataPacker';
import LogServerClient from './communication/LogServerClient';
import WupStatisticsService from './wup/WupStatisticsService';
import WupDispatchRateCalculatorFactory from './wup/dispatching/WupDispatchRateCalculatorFactory';
import DataDispatcher from './DataDispatcher';
import LogAggregator from './LogAggregator';
import MessageProcessor from './MessageProcessor';
import Log, { Logger } from '../main/technicalServices/log/Logger';
import WupMessageBuilder from './communication/WupMessageBuilder';
import WupRequestBodyBuilder from './communication/WupRequestBodyBuilder';
import WupResponseProcessor from './communication/WupResponseProcessor';
import WupServerClient from './communication/WupServerClient';
import DataAggregator from './DataAggregator';
import WorkerConfigurationLoadedEventHandler from './events/WorkerConfigurationLoadedEventHandler';
import WorkerNewSessionStartedEventHandler from './events/WorkerNewSessionStartedEventHandler';
import WorkerServerStateUpdatedEventHandler from './events/WorkerServerStateUpdatedEventHandler';
import WorkerWupDispatchRateUpdatedEventHandler from './events/WorkerWupDispatchRateUpdatedEventHandler';
import WorkerService from './WorkerService';
import WorkerUtils from './utils/WorkerUtils';
import WorkerSystemStatusEventHandler from './WorkerSystemStatusEventHandler';
import LogBridge from "../main/technicalServices/log/LogBridge";
import RetryMessage from "./communication/RetryMessage";
import ConfigurationWrapperWupMessage from "../main/core/configuration/ConfigurationWrapperWupMessage";
import ConfigurationWrapperLogMessage from "../main/core/configuration/ConfigurationWrapperLogMessage";
import WorkerServerRestoredMuidEventHandler from "./events/WorkerServerRestoredMuidEventHandler";
import WorkerStateUpdateFromStorage from "./events/WorkerStateUpdateFromStorage";
import WorkerServerNewAgentId from "./events/WorkerServerNewAgentId";

export default class WorkerSysLoader {
    constructor(mainCommunicator, msgBus) {
        this._mainCommunicator = mainCommunicator;
        this._msgBus = msgBus;
        this._eventHandlers = [];
    }

    loadSystem() {
        this._configurationRepository = new ConfigurationRepository();
        this._wupServerSessionState = new WupServerSessionState();

        this._logRequestBodyBuilder = new LogRequestBodyBuilder();

        this._configurationWrapperLogMessage = new ConfigurationWrapperLogMessage(this._configurationRepository);
        this._logReMessageSettings = this._configurationWrapperLogMessage.createReMessageSettings();
        this._logRetryMessage = new RetryMessage(this._logReMessageSettings);

        this._logServerCommunicator = new ServerCommunicator(this._logRequestBodyBuilder,
            this._configurationRepository.get(ConfigurationFields.serverCommunicationSettings),
            WorkerUtils, this._logRetryMessage,true, 'log');
        this._logMessageBuilder = new LogMessageBuilder(new DataPacker());
        this._logServerClient = new LogServerClient(this._logServerCommunicator, this._logMessageBuilder, this._configurationRepository);

        this._wupStatisticsService = new WupStatisticsService(this._configurationRepository.get(ConfigurationFields.wupStatisticsLogIntervalMs));
        this._wupDispatchRateCalculatorFactory = new WupDispatchRateCalculatorFactory(this._wupStatisticsService, this._wupServerSessionState);

        const logAggregator = new LogAggregator();
        this._logDataDispatcher = new DataDispatcher(this._logServerClient,
            logAggregator,
            this._wupDispatchRateCalculatorFactory,
            this._configurationRepository.get(ConfigurationFields.logWupDispatchRateSettings));

        const workerLogBridge = new LogBridge(logAggregator, 'worker');

        this._logMessageProcessor = new MessageProcessor(this._logDataDispatcher);

        const logger = new Logger(workerLogBridge);
        Log.setLogger(logger);

        this._wupMessageBuilder = new WupMessageBuilder(this._wupServerSessionState, new DataPacker());
        this._wupRequestBodyBuilder = new WupRequestBodyBuilder(this._wupServerSessionState);

        this._configurationWrapperWupMessage= new ConfigurationWrapperWupMessage(this._configurationRepository);
        this._wupReMessageSettings =  this._configurationWrapperWupMessage.createReMessageSettings();
        this._wupRetryMessage = new RetryMessage(this._wupReMessageSettings);

        this._dataServerCommunicator = new ServerCommunicator(this._wupRequestBodyBuilder,
            this._configurationRepository.get(ConfigurationFields.serverCommunicationSettings), WorkerUtils, this._wupRetryMessage,
            false, 'wup');
        this._wupResponseProcessor = new WupResponseProcessor(this._wupServerSessionState, this._msgBus, this._configurationRepository);
        this._wupServerClient = new WupServerClient(this._dataServerCommunicator, this._wupMessageBuilder,
            this._wupServerSessionState, this._wupStatisticsService, this._wupResponseProcessor,
            this._configurationRepository, this._msgBus);

        const wupDispatchRateSettings = this._configurationRepository.get(ConfigurationFields.forceDynamicDataWupDispatchSettings)
            ? ConfigurationDefaultTemplates.defaultDynamicWupDispatchRateConfiguration : this._configurationRepository.get(ConfigurationFields.dataWupDispatchRateSettings);

        this._dataDispatcher = new DataDispatcher(this._wupServerClient,
            new DataAggregator(this._wupServerSessionState),
            this._wupDispatchRateCalculatorFactory,
            wupDispatchRateSettings);

        this._messageProcessor = new MessageProcessor(this._dataDispatcher);

        // Create the event handlers
        this._eventHandlers.push(new WorkerConfigurationLoadedEventHandler(this._msgBus, this._wupStatisticsService,
            this._dataDispatcher, this._logDataDispatcher, this._dataServerCommunicator,
            this._wupServerClient, this._logServerClient, logger, this._mainCommunicator));

        this._eventHandlers.push(new WorkerNewSessionStartedEventHandler(this._msgBus, logger, this._mainCommunicator));
        this._eventHandlers.push(new WorkerServerStateUpdatedEventHandler(this._msgBus, logger, this._mainCommunicator));
        this._eventHandlers.push(new WorkerWupDispatchRateUpdatedEventHandler(this._msgBus, this._dataDispatcher, logger));
        this._eventHandlers.push(new WorkerSystemStatusEventHandler(this._mainCommunicator, this._msgBus, logger));
        this._eventHandlers.push(new WorkerServerRestoredMuidEventHandler(this._msgBus,this._mainCommunicator));
        this._eventHandlers.push(new WorkerStateUpdateFromStorage(this._mainCommunicator, this._wupServerSessionState, this._logServerClient));
        this._eventHandlers.push(new WorkerServerNewAgentId(this._msgBus, this._mainCommunicator));

        // update the main with the server state on each response from server. Currently 'onServerStateUpdated' is triggered only for requestId changes
        // we should probably get rid soon and move it to the bus event handler
        this._wupServerSessionState.onServerStateUpdated.subscribe((serverState) => {

            this._mainCommunicator.sendAsync(WorkerEvent.ServerStateUpdatedEvent, serverState);
        });

        this._workerService = new WorkerService(this._mainCommunicator, this._wupServerClient, this._logServerClient,
            this._configurationRepository, this._messageProcessor, this._logMessageProcessor,
            this._wupServerSessionState, this._dataServerCommunicator);

        this._workerService.start();
        Log.info('Loaded worker');
    }
}
