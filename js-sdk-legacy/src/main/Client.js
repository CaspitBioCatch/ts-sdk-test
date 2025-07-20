import SystemBootstrapper from './core/SystemBootstrapper';
import Log from './technicalServices/log/Logger';
import { MessageBusEventType } from './events/MessageBusEventType';
import { ConfigurationFields } from "./core/configuration/ConfigurationFields";
import CdApiFacade from "./api/CdApiFacade";

export default class Client {

    autoStart(remoteConfigurationLoadedCallback) {

        // Create the cdApi facade here so we can get the configurations
        const cdApiFacade = new CdApiFacade();

        cdApiFacade.getConfigurations((configurations) => {
            if (!configurations) {
                // Log is not really doing something here since we don't have the log server url, hence will never get the logs address
                Log.error('Failed starting the JS SDK. Received invalid start configurations');
                return;
            }

            // Make sure we have a wup server URL otherwise there is no point to continue
            if (!configurations.getWupServerURL()) {
                Log.error('Missing server URL. Unable to start the library.');
                return;
            }

            if (configurations.getUseUrlWorker() && configurations.getWorkerUrl() === '') {
                Log.error('Failed starting the JS SDK. Received invalid WorkerUrl configuration');
                return;
            }

            // Load the system components
            this.start(cdApiFacade, configurations, remoteConfigurationLoadedCallback);
        });
    }

    manualStart(configurations, wupServerUrl, remoteConfigurationLoadedCallback, cdApi) {
        const cdApiFacade = new CdApiFacade(undefined, cdApi);

        this.start(cdApiFacade, configurations, remoteConfigurationLoadedCallback);
    }

    start(cdApiFacade, configurations, remoteConfigurationLoadedCallback) {
        this._cdApiFacade = cdApiFacade;
        this._startupConfigurations = configurations;
        this._configurationLoadedCallback = remoteConfigurationLoadedCallback;
        this.systemBootstrapper = new SystemBootstrapper();

        cdApiFacade.createClientInterface(this, configurations.getClientSettings());

        this.systemBootstrapper.start(cdApiFacade, configurations);

        Log.info(`Got server address: ${configurations.getWupServerURL()}`);

        const pm = this.systemBootstrapper.getPerfMonitor();
        pm.startMonitor('t.timeTillServerConfig');
        pm.startMonitor('t.timeTillDataCollect'); // will be stopped in the MouseEvents startFeature

        this.configurationService = this.systemBootstrapper.getConfigurationService();
        this.sessionService = this.systemBootstrapper.getSessionService();

        this.configurationService.setConfigurationLoadedCallback(remoteConfigurationLoadedCallback);

        this.systemBootstrapper.getFeatureService().buildFrameRelatedLists();
        this.systemBootstrapper.getFeatureBuilder().buildFeatures();

        Log.info('Started default features collection');
        this.systemBootstrapper.getFeatureService().runDefault();

        this.systemBootstrapper.getApiBridge().enableApi();
        this.systemBootstrapper.getContextMgr().initContextHandling();
        this.systemBootstrapper.registerPostLoadEvents();

        this.systemBootstrapper.getMuidService()?.initMuid()

        const enableStartupCustomerSessionId = this.systemBootstrapper.getConfigurationRepository()
            .get(ConfigurationFields.enableStartupCustomerSessionId);
        // Start a new session or resume an existing one...
        enableStartupCustomerSessionId ? this.sessionService.startNewSession() : this.sessionService.resumeOrStartSession()
    }

    stop() {
        this.systemBootstrapper.stop();
    }

    pause() {
        window.postMessage({ type: 'cdChangeState', toState: 'pause' }, window.location.href);
    }

    resume() {
        window.postMessage({ type: 'cdChangeState', toState: 'run' }, window.location.href);
    }

    updateCustomerSessionID(customerSessionID) {
        window.postMessage({ type: 'cdSetCsid', csid: customerSessionID }, window.location.href);
    }

    changeContext(contextName) {
        window.postMessage({ type: 'ContextChange', context: contextName }, window.location.href);
    }

    startNewSession(customerSessionID) {
        window.postMessage({ type: 'ResetSession', resetReason: 'customerApi', csid: customerSessionID }, window.location.href);
    }

    setCustomerBrand(brand) {
        window.postMessage({ type: 'cdSetCustomerBrand', brand: brand }, window.location.href);
    }

    restart() {
        this.stop();
        this.start(this._cdApiFacade, this._startupConfigurations, this._configurationLoadedCallback);
    }

    /**
     * flush(), setCoordinatesMasking(), and submitCustomElement()
     * are methods appended to window.cdApi object using the
     * createClientInterface of the CdApiFacade class
     */

    flush() {
        this.systemBootstrapper.flushAllMessages();
    }

    /**
     * @param isEnabled
     */

    setCoordinatesMasking(isEnabled) {
        this.systemBootstrapper.handleCoordinatesMaskingConfigurationUpdate(isEnabled);
    }

    /**
     * @param customElement
     */
    submitCustomElement(customElement) {
        const messageBus = this.systemBootstrapper.getMessageBus();
        messageBus.publish(MessageBusEventType.CustomElementSubmitted, customElement);
    }
}

