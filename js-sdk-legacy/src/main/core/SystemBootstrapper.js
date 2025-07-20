// eslint-disable-next-line max-classes-per-file
import CDUtils from '../technicalServices/CDUtils';
import { WorkerCommand } from '../events/WorkerCommand';
import { ConfigurationFields } from './configuration/ConfigurationFields';
import { State } from './state/State';
import WorkerWrapperFactory from '../technicalServices/WorkerWrapperFactory';
import WorkerCommunicator from '../technicalServices/WorkerCommunicator';
import DataQ from '../technicalServices/DataQ';
import PerfMonitor from '../technicalServices/PerfMonitor';
import SiteMapper from '../technicalServices/SiteMapper';
import ContextMgr from './context/ContextMgr';
import GlobalExceptionHandler from '../infrastructure/GlobalExceptionHandler';
import MessageBus from '../technicalServices/MessageBus';
import CidCache from './session/CidCache';
import ServerStateMgr from './state/ServerStateMgr';
import ConfigurationRepository from './configuration/ConfigurationRepository';
import ConfigurationService from './configuration/ConfigurationService';
import SensorsDataQueue from '../collectors/events/SensorsDataQueue';
import ElementsCollector from '../collectors/events/ElementsCollector';
import FramesHandlerFactory from './frames/FramesHandlerFactory';
import FeatureService from '../collectors/FeatureService';
import PauseResumeManager from './state/PauseResumeManager';
import CustomerApiBridge from '../api/CustomerApiBridge';
import MuidService from './MuidService';
import PsidCache from './session/PsidCache';
import PsidService from './session/PsidService';
import SidRepository from './session/SidRepository';
import CsidCache from './session/CsidCache';
import CsidService from './session/CsidService';
import SessionService from './session/SessionService';
import MetadataService from './metadata/MetadataService';
import SlaveListener from '../services/SlaveListener';
import FeaturesBuilder from '../collectors/FeaturesBuilder';
import ContextApiHandler from './context/ContextApiHandler';
import StateService from './state/StateService';
import ClientEventService from '../api/ClientEventService';
import ApiContextChangeEventHandler from '../events/ApiContextChangeEventHandler';
import ApiResetSessionEventHandler from '../events/ApiResetSessionEventHandler';
import ApiCustomerMetadataEventHandler from '../events/ApiCustomerMetadataEventHandler';
import ApiChangeStateEventHandler from '../events/ApiChangeStateEventHandler';
import ApiSetCsidEventHandler from '../events/ApiSetCsidEventHandler';
import ApiSetPsidEventHandler from '../events/ApiSetPsidEventHandler';
import NewSessionStartedEventHandler from '../events/NewSessionStartedEventHandler';
import ConfigurationLoadedEventHandler from '../events/ConfigurationLoadedEventHandler';
import StateChangedEventHandler from '../events/StateChangedEventHandler';
import ApiSetCustomerBrandEventHandler from '../events/ApiSetCustomerBrandEventHandler';
import Log, { Logger } from '../technicalServices/log/Logger';
import DOMUtils from '../technicalServices/DOMUtils';
import SameCharService from '../services/SameCharService';
import HeartBeatService from '../services/HeartBeatService';
import HeartBeatErrorsState from './state/HeartBeatErrorsState';
import SessionInfoService from './session/SessionInfoService';
import SensorGateKeeper from '../collectors/SensorGateKeeper';
import CustomElementsDetector from './customelements/CustomElementsDetector';
import BrowserContextsCache from './browsercontexts/BrowserContextsCache';
import BrowserContext from './browsercontexts/BrowserContext';
import { CustomElementDetectedEventHandler } from '../events/CustomElementDetectedEventHandler';
import StartupConfigurationLoader from "./configuration/StartupConfigurationLoader";
import MaskingService from "./masking/MaskingService";
import LogBridge from "../technicalServices/log/LogBridge";
import LogDataQ from "../technicalServices/log/LogDataQ";
import StorageUtilsWrapper from "../technicalServices/StorageUtilsWrapper";
import BrandService from './branding/BrandService';
import BrandRepository from './branding/BrandRepository';
import RestoredMuidEventHandler from "../events/RestoredMuidEventHandler";
import CoordinatesMaskingConfigurationUpdater from "../api/CoordinatesMaskingConfigurationUpdater";
import AgentIdCache from "./session/AgentIdCache";
import AgentIdService from "./session/AgentIdService";
import FeaturesList from "../collectors/FeaturesList";
import { AgentType } from "../contract/AgentType";
import { CollectionMode } from "../contract/CollectionMode";
import { FlutterSdkBridge } from '../flutter/FlutterSdkBridge';
import ProtocolTypeCache from './session/ProtocolTypeCache';
import ServerUrlCache from './session/ServerUrlCache';
import EncryptedMuidService from './EncryptedMuidService';
import CategoryService from '../technicalServices/categories/CategoryService';
import { DevDebugDataQ } from '../technicalServices/dev_collectors/DevDebugDataQ';

export default class SystemBootstrapper {
    constructor() {
        this._serverWorker = null;
        this._serverWorkerCommunicator = null;
        this._configurationService = null;
        this._featureBuilder = null;
        this._featureService = null;
        this._dataQ = null;
        this._frameHandler = null;
        this._eventHandlers = [];
        this._contextMgr = null;

        this._runWorker = function (configurations) {
            const workerWrapperFactory = new WorkerWrapperFactory(configurations.getUseUrlWorker(), configurations.getWorkerUrl());
            return workerWrapperFactory.create();
        };
    }

    start(cdApiFacade, configurations) {
        this._loadSystem(cdApiFacade, configurations);
    }
    stop() {
        if (this._serverWorker) {
            this._serverWorker.close();
        }
        if (this.heartBeatService) {
            this.heartBeatService.stop();
        }
    }

    registerPostLoadEvents() {
        this._slaveListener.onResetSessionTrigger.subscribe(this._sessionService.resetSession.bind(this._sessionService));
    }
    flushAllMessages() {
        this._dataQ.flushAllMessages();
    }
    handleCoordinatesMaskingConfigurationUpdate(isEnabled) {
        this._coordinatesMaskingConfigurationUpdater.updateConfig(isEnabled);
    }

    getServerWorkerCommunicator() {
        return this._serverWorkerCommunicator;
    }
    getFeatureBuilder() {
        return this._featureBuilder;
    }
    getFeatureService() {
        return this._featureService;
    }
    getConfigurationService() {
        return this._configurationService;
    }
    getConfigurationRepository() {
        return this._configurationRepository;
    }
    getSessionService() {
        return this._sessionService;
    }
    getContextMgr() {
        return this._contextMgr;
    }
    getMuidService() {
        return this._muidService;
    }
    getEncryptedMuidService() {
        return this._muidEncryptedService;
    }
    getApiBridge() {
        return this._customerApiBridge;
    }
    getPerfMonitor() {
        return this._perfMonitor;
    }
    getServerStateMgr() {
        return this._serverStateMgr;
    }
    getMessageBus() {
        return this._msgBus;
    }
    getAgentIdService() {
        return this._agentIdService;
    }

    _loadSystem(cdApiFacade, configurations) {
        this._runServerWorker(configurations);
        this._serverWorkerCommunicator = new WorkerCommunicator();
        this._serverWorkerCommunicator.setMessagingPort(this._serverWorker.port);

        const logPerfDataQ = new LogDataQ(DOMUtils, this._serverWorkerCommunicator, null, 'logPerfQPassWorkerInterval',
            WorkerCommand.sendLogCommand);

        this._perfMonitor = new PerfMonitor(logPerfDataQ);

        this._configurationRepository = new ConfigurationRepository();
        const startUpConfigurationLoader = new StartupConfigurationLoader(this._configurationRepository, configurations);
        startUpConfigurationLoader.loadStartUpConfigurations();

        const enableWupMessagesHashing = this._configurationRepository?.get(ConfigurationFields.enableWupMessagesHashing);
        this._shouldEnableWorkerWupMessagesHashing(enableWupMessagesHashing, this._serverWorkerCommunicator);

        const storageUtilsWrapper = new StorageUtilsWrapper(CDUtils, this._configurationRepository)
        const contextSiteMapper = new SiteMapper(self.MutationObserver, CDUtils, DOMUtils, 'contextConfiguration', null, true, 400);
        this._contextMgr = new ContextMgr(CDUtils, contextSiteMapper, this._serverWorkerCommunicator, storageUtilsWrapper);

        const mainLogBridge = new LogBridge(logPerfDataQ, this._contextMgr.url);
        const logger = new Logger(mainLogBridge);
        Log.setLogger(logger);

        const collectionMode = this._configurationRepository?.get(ConfigurationFields.collectionMode);
        this._registerFeatures(collectionMode);

        this._currScriptName = document.currentScript ? document.currentScript.src : '';

        this._globalexceptionHandler = new GlobalExceptionHandler(CDUtils, this._currScriptName);

        this._msgBus = new MessageBus();
        this._dataQ = new DataQ(DOMUtils, this._serverWorkerCommunicator, this._contextMgr, 'dataQPassWorkerInterval',
            WorkerCommand.sendDataCommand);

        this._devDebugDataQueue = new DevDebugDataQ(this._configurationRepository, this._dataQ);

        this._agentIdCache = new AgentIdCache(storageUtilsWrapper);
        this._agentIdService = new AgentIdService(this._agentIdCache, this._serverWorkerCommunicator);

        this._cidCache = new CidCache(configurations.getWupServerURL());
        this._serverStateMgr = new ServerStateMgr(this._serverWorkerCommunicator, CDUtils, this._agentIdService);

        this._sessionInfoService = new SessionInfoService();
        this._sensorGateKeeper = new SensorGateKeeper(this._sessionInfoService, this._configurationRepository);

        this._configurationService = new ConfigurationService(CDUtils, this._configurationRepository, this._msgBus, this._cidCache, this._serverWorkerCommunicator);
        this._sensorDataQ = new SensorsDataQueue(this._configurationRepository, this._dataQ, this._msgBus, CDUtils, this._sensorGateKeeper);

        this._maskingService = new MaskingService(this._configurationRepository);

        let elementCategories = configurations.getElementCategories();
        let elementAttributes = configurations.getElementAttributes();
        this._categoryService = new CategoryService(elementCategories, elementAttributes);

        this._elementsUtils = new ElementsCollector(this._configurationRepository, CDUtils, this._dataQ, this._contextMgr, this._maskingService, this._categoryService);

        const browserContextCache = new BrowserContextsCache();
        const framesHandlerFactory = new FramesHandlerFactory(this._configurationRepository, DOMUtils, CDUtils);
        this._frameHandler = framesHandlerFactory.create();
        this._featureService = new FeatureService(FeaturesList, this._frameHandler, this._configurationRepository, DOMUtils, CDUtils, browserContextCache);

        const customElementsDetector = new CustomElementsDetector(CDUtils, this._msgBus, this._configurationRepository);

        // Create the state service which is holding the current state of the SDK
        this._stateService = new StateService(this._msgBus);

        this._pauseResumeMgr = new PauseResumeManager(this._featureService, this._configurationRepository, this._dataQ, this._stateService, this._serverWorkerCommunicator);
        this._customerApiBridge = new CustomerApiBridge(this._pauseResumeMgr, this._msgBus, cdApiFacade, CDUtils);

        if (this._configurationRepository.get(ConfigurationFields.agentType) !== AgentType.SECONDARY) {
            this._muidService = new MuidService(CDUtils, this._dataQ, storageUtilsWrapper, this._configurationRepository);

            this._muidEncryptedService = new EncryptedMuidService({
                domUtils: DOMUtils,
                utils: CDUtils,
                storage: storageUtilsWrapper,
                configurationRepository: this._configurationRepository,
            });
        }

        this._psidCache = new PsidCache();
        const psidService = new PsidService(this._psidCache, this._serverWorkerCommunicator);

        const resetSessionSiteMapper = new SiteMapper(self.MutationObserver, CDUtils, DOMUtils, 'resetSessionConfig');
        const sidRepository = new SidRepository(CDUtils, storageUtilsWrapper, this._configurationRepository);

        this._csidCache = new CsidCache();
        const csidService = new CsidService(this._customerApiBridge, this._csidCache, this._serverWorkerCommunicator);

        const brandRepository = new BrandRepository(CDUtils, storageUtilsWrapper);
        this._brandService = new BrandService(this._serverWorkerCommunicator, brandRepository);

        this._coordinatesMaskingConfigurationUpdater = new CoordinatesMaskingConfigurationUpdater(this._configurationRepository);

        let serverUrlCache = new ServerUrlCache(configurations.getWupServerURL());
        let protocolTypeCache = new ProtocolTypeCache(configurations.getWupServerURL());
        let minifiedWupUriEnabled = configurations.isMinifiedWupUriEnabled();

        this._sessionService = new SessionService(this._msgBus, this._configurationService, this._configurationRepository, CDUtils,
            DOMUtils, this._serverWorkerCommunicator, this._contextMgr, this._muidService, this._serverStateMgr, resetSessionSiteMapper,
            sidRepository, serverUrlCache, this._cidCache, protocolTypeCache, minifiedWupUriEnabled, csidService, this._csidCache, this._psidCache, this._brandService, this._agentIdService);

        this._metadataService = new MetadataService(this._configurationRepository, this._dataQ);

        // create the slave listener that will manage slaves slow and communication
        this._slaveListener = new SlaveListener(this._dataQ, this._configurationRepository, CDUtils, logPerfDataQ, this._contextMgr);
        this._slaveListener.listen();

        this._sameChar = new SameCharService();

        // Use the default MutationObserver on the window since this is the one that did not created issues
        this._featureBuilder = new FeaturesBuilder(FeaturesList, this._configurationRepository, CDUtils, this._elementsUtils,
            self.MutationObserver, this._dataQ, this._devDebugDataQueue, configurations, this._sessionService,
            this._muidService, this._muidEncryptedService, this._perfMonitor, this._sensorDataQ, this._msgBus, this._cidCache, this._sameChar, this._maskingService, this._contextMgr);

        // Leave this crappy class until we remove its implementation to a better place.
        this._contextApiHandler = new ContextApiHandler(this._contextMgr, this._dataQ);

        // subscribe the FeatureService to context changes
        this._contextMgr.onContextChange.subscribe(this._featureService.runPerContextFeatures.bind(this._featureService));

        // Create the service for client events (API events)
        const clientEventService = new ClientEventService();

        // Create the heartBeat postMessage service
        this.heartBeatService = new HeartBeatService(this._serverWorkerCommunicator, new HeartBeatErrorsState(),
            this._configurationRepository.get(ConfigurationFields.heartBeatMessageInterval));
        this.heartBeatService.start();

        // Create the event handlers
        this._eventHandlers.push(new RestoredMuidEventHandler(this._msgBus, this._muidService, clientEventService, this._serverWorkerCommunicator));
        this._eventHandlers.push(new ApiContextChangeEventHandler(this._msgBus, this._contextMgr));
        this._eventHandlers.push(new ApiResetSessionEventHandler(this._msgBus, this._sessionService));
        this._eventHandlers.push(new ApiCustomerMetadataEventHandler(this._msgBus, this._metadataService));
        this._eventHandlers.push(new ApiChangeStateEventHandler(this._msgBus, this._pauseResumeMgr, this._slaveListener));
        this._eventHandlers.push(new ApiSetCsidEventHandler(this._msgBus, csidService));
        this._eventHandlers.push(new ApiSetPsidEventHandler(this._msgBus, psidService));
        this._eventHandlers.push(new ApiSetCustomerBrandEventHandler(this._msgBus, this._brandService));

        this._eventHandlers.push(new StateChangedEventHandler(this._msgBus, clientEventService));
        this._eventHandlers.push(new ConfigurationLoadedEventHandler(this._msgBus, this._featureService, this._dataQ,
            this._pauseResumeMgr, this._metadataService, logger, this._contextMgr, this._sessionService,
            this._sensorDataQ, this._slaveListener, this._stateService, this._perfMonitor, this.heartBeatService, this._sensorGateKeeper, sidRepository,
            this._coordinatesMaskingConfigurationUpdater));
        this._eventHandlers.push(new NewSessionStartedEventHandler(this._msgBus, this._featureService,
            this._customerApiBridge, this._contextMgr, clientEventService, this._sessionInfoService));
        if (this._configurationRepository.get(ConfigurationFields.enableCustomElementsProcessing)) {
            customElementsDetector.start(new BrowserContext(window.self));
            this._eventHandlers.push(new CustomElementDetectedEventHandler(browserContextCache, this._featureService, this._msgBus));
        }

        // Set the default log address if available
        if (configurations.getLogServerURL()) {
            this._configurationService.updateLogUrlToWorker(this._sessionService.sessionId, this._csidCache.get(), this._serverWorkerCommunicator);
        }

        if (configurations.isFlutterApp()) {
            if (window.bcClient) {
                window.bcClient.flutterBridge = new FlutterSdkBridge(this._msgBus)
            } else {
                Log.error('Cannot initiate FlutterSdkBridge: bcClient object not found.');
            }
        }

        // Mark the state as starting
        this._stateService.updateState(State.starting);
    }

    _runServerWorker(configurations) {
        this._serverWorker = this._runWorker(configurations);
    }

    _registerFeatures(collectionMode) {
        switch (collectionMode) {
            case CollectionMode.LEAN: {
                Log.info('Build features per collection mode: LEAN');
                FeaturesList.registerLeanFeatures();
                break;
            }
            default: {
                Log.info('Build features per collection mode: FULL');
                FeaturesList.register();
                return;
            }
        }
    }

    _shouldEnableWorkerWupMessagesHashing(enableWupMessagesHashing, serverWorkerCommunicator) {
        if (!enableWupMessagesHashing) return;
        serverWorkerCommunicator.sendAsync(WorkerCommand.enableWupMessagesHashingCommand, { enableWupMessagesHashing });
    }
}
