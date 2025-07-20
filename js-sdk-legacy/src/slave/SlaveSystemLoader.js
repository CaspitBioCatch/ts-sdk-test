// eslint-disable-next-line max-classes-per-file
import CDUtils from '../main/technicalServices/CDUtils';
import MessageBus from '../main/technicalServices/MessageBus';
import { MessageBusEventType } from '../main/events/MessageBusEventType';
import { MasterSlaveMessage } from './MasterSlaveMessage';
import FeatureService from '../main/collectors/FeatureService';
import FeaturesBuilder from '../main/collectors/FeaturesBuilder';
import Log, { Logger } from '../main/technicalServices/log/Logger';
import FramesHandlerFactory from '../main/core/frames/FramesHandlerFactory';
import DOMUtils from '../main/technicalServices/DOMUtils';
import PauseResumeManager from '../main/core/state/PauseResumeManager';
import ScriptsRepository from '../main/collectors/perContext/ScriptsRepository';
import ElementsCollector from '../main/collectors/events/ElementsCollector';
import SensorsDataQueue from '../main/collectors/events/SensorsDataQueue';
import DataQ from '../main/technicalServices/DataQ';
import SlaveConfigurationLoadedEventHandler from './handlers/SlaveConfigurationLoadedEventHandler';
import SiteMapper from '../main/technicalServices/SiteMapper';
import ParentCommunicator from './ParentCommunicator';
import ConfigurationRepository from '../main/core/configuration/ConfigurationRepository';
import ContextMgr from '../main/core/context/ContextMgr';
import MessageEventHandler from './handlers/MessageEventHandler';
import EventAggregator from '../main/system/EventAggregator';
import SameCharService from '../main/services/SameCharService';
import SessionInfoService from '../main/core/session/SessionInfoService';
import SensorGateKeeper from '../main/collectors/SensorGateKeeper';
import BrowserContextsCache from '../main/core/browsercontexts/BrowserContextsCache';
import CustomElementsDetector from "../main/core/customelements/CustomElementsDetector";
import ElementsMutationObserverFactory from "../main/core/browsercontexts/ElementsMutationObserver";
import BrowserContext from "../main/core/browsercontexts/BrowserContext";
import { CustomElementDetectedEventHandler } from "../main/events/CustomElementDetectedEventHandler";
import MaskingService from "../main/core/masking/MaskingService";
import SlaveBuffer from "./SlaveBuffer";
import LogDataQ from "../main/technicalServices/log/LogDataQ";
import LogBridge from "../main/technicalServices/log/LogBridge";
import StorageUtilsWrapper from "../main/technicalServices/StorageUtilsWrapper";
import SlaveBrowserProps from "./collectors/SlaveBrowserProps";
import AcknowledgeMessageEventsHandler from "./handlers/AcknowledgeMessageEventsHandler";
import AcknowledgeDataDispatcher from "./services/AcknowledgeDataDispatcher";
import SlaveStartupConfigurationLoader from "./configuration/SlaveStartupConfigurationLoader";
import CategoryService from '../main/technicalServices/categories/CategoryService';
import { DevDebugDataQ } from '../main/technicalServices/dev_collectors/DevDebugDataQ';

export default class SlaveSystemLoader {
    constructor() {
        this._eventHandlers = [];
    }

    loadSystem(featuresList, configurations) {
        function clearFeaturesInList(features) {
            if (!features) {
                return;
            }

            Object.keys(features).forEach((featureKey) => {
                if (!features[featureKey].runInSlave) {
                    delete features[featureKey];
                }
            });
        }

        clearFeaturesInList(featuresList.list);
        const isCustomElementsDetectorEnabled = configurations.getEnableCustomElementDetector();

        this._configurationRepository = new ConfigurationRepository();

        const slaveStartUpConfigurationLoader = new SlaveStartupConfigurationLoader(this._configurationRepository, configurations);
        slaveStartUpConfigurationLoader.loadStartUpConfigurations();

        const slaveBuffer = new SlaveBuffer(this._configurationRepository, CDUtils);
        const acknowledgeDataDispatcher = new AcknowledgeDataDispatcher(this._configurationRepository, slaveBuffer);
        const acknowledgeMessageEventsHandler = new AcknowledgeMessageEventsHandler(slaveBuffer, this._configurationRepository, acknowledgeDataDispatcher);
        const messageEventHandler = new MessageEventHandler(this._configurationRepository, slaveBuffer, EventAggregator, acknowledgeMessageEventsHandler);
        this._parentCommunicator = new ParentCommunicator(messageEventHandler);

        const logPerfDataQ = new LogDataQ(DOMUtils, this._parentCommunicator, null, null, 'logPerfSlave');

        const storageUtilsWrapper = new StorageUtilsWrapper(CDUtils, this._configurationRepository)

        const contextSiteMapper = new SiteMapper(self.MutationObserver, CDUtils, DOMUtils, 'contextConfiguration', null, true, 400);
        this._contextMgr = new ContextMgr(CDUtils, contextSiteMapper, this._parentCommunicator, storageUtilsWrapper);

        const slaveLogBridge = new LogBridge(logPerfDataQ, this._contextMgr.url, 'SLAVE: ');
        const logger = new Logger(slaveLogBridge);
        Log.setLogger(logger);

        this._msgBus = new MessageBus();

        // subscribe to config update messages arriving from parent
        this._parentCommunicator.addMessageListener(MasterSlaveMessage.updateSlaveConf, (e) => {
            this._configurationRepository.loadConfigurations(e);
            this._msgBus.publish(MessageBusEventType.ConfigurationLoadedEvent, this._configurationRepository);
        });
        this._sessionInfoService = new SessionInfoService();
        this._sensorGateKeeper = new SensorGateKeeper(this._sessionInfoService, this._configurationRepository);

        this._dataQ = new DataQ(DOMUtils, this._parentCommunicator, this._contextMgr, null, 'dataFromSlave');
        this._devDebugDataQueue = new DevDebugDataQ(this._configurationRepository, this._dataQ);
        this._sensorDataQ = new SensorsDataQueue(this._configurationRepository, this._dataQ, this._msgBus, CDUtils, this._sensorGateKeeper);
        this._maskingService = new MaskingService(this._configurationRepository);
        this._categoryService = new CategoryService();
        this._elementsUtils = new ElementsCollector(this._configurationRepository, CDUtils, this._dataQ, this._contextMgr, this._maskingService, this._categoryService);

        const browserContextCache = new BrowserContextsCache();
        const framesHandlerFactory = new FramesHandlerFactory(this._configurationRepository, DOMUtils, CDUtils);
        this._frameHandler = framesHandlerFactory.create();

        this._featureService = new FeatureService(featuresList, this._frameHandler, this._configurationRepository, DOMUtils, CDUtils, browserContextCache);

        //SlaveBrowserProps dispatches the slave script client version
        this._slaveBrowserProps = new SlaveBrowserProps(this._dataQ, CDUtils);

        this._pauseResumeMgr = new PauseResumeManager(this._featureService, this._configurationRepository, this._dataQ);
        // Subscribe to state change messages arriving from parent
        this._parentCommunicator.addMessageListener(MasterSlaveMessage.updateSlaveState, this._pauseResumeMgr.onStateChange.bind(this._pauseResumeMgr));

        this._scriptsRepository = new ScriptsRepository(CDUtils);

        this._sameChar = new SameCharService();
        // Use the default MutationObserver on the window since this is the one that did not create issues
        // muid service and session manager are only required in files feature which does not run in slave, so sending null
        this._featureBuilder = new FeaturesBuilder(featuresList, this._configurationRepository, CDUtils, this._elementsUtils,
            self.MutationObserver, this._dataQ, this._devDebugDataQueue, configurations, null,
            null, null, null, this._sensorDataQ, this._msgBus, this._scriptsRepository, this._sameChar, this._maskingService);

        // subscribe the FeatureService to context changes
        this._contextMgr.onContextChange.subscribe(this._featureService.runPerContextFeatures.bind(this._featureService));
        // subscribe the ParentCommunicator to context changes so it will pass the new context to the parent until the master
        this._contextMgr.onContextChange.subscribe(this._parentCommunicator.notifyContextChange.bind(this._parentCommunicator));

        // Create the event handlers
        this._eventHandlers.push(new SlaveConfigurationLoadedEventHandler(this._msgBus, this._featureService, this._dataQ, this._pauseResumeMgr,
            logger, this._contextMgr, this._sensorGateKeeper));

        // generate the first context. In the main the ContextApiHandler does it
        this._contextMgr.changeContext('slave_cd_auto');

        if (isCustomElementsDetectorEnabled) {
            const customElementsDetector = new CustomElementsDetector(CDUtils, this._msgBus, this._configurationRepository);
            customElementsDetector.start(new BrowserContext(window.self));
        }
        this._eventHandlers.push(new CustomElementDetectedEventHandler(browserContextCache, this._featureService, this._msgBus));
    }

    getConfigurationRepository() {
        return this._configurationRepository;
    }

    getFeatureBuilder() {
        return this._featureBuilder;
    }

    getFeatureService() {
        return this._featureService;
    }

    getContextMgr() {
        return this._contextMgr;
    }

    getParentCommunicator() {
        return this._parentCommunicator;
    }

    getSlaveBrowserProps() {
        return this._slaveBrowserProps;
    }

}
