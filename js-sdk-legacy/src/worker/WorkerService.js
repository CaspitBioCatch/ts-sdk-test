/**
 * The class is the worker api entry point. All communication to worker should start here
 */
import { WorkerCommand } from '../main/events/WorkerCommand';
import Log from '../main/technicalServices/log/Logger';

export default class WorkerService {
    constructor(mainCommunicator, wupServerClient, logServerClient, configurationRepository,
                messageProcessor, logMessageProcessor, wupServerSessionState, dataServerCommunicator) {
        this._mainCommunicator = mainCommunicator;
        this._wupServerClient = wupServerClient;
        this._logServerClient = logServerClient;
        this._configurationRepository = configurationRepository;
        this._messageProcessor = messageProcessor;
        this._logMessageProcessor = logMessageProcessor;
        this._wupServerSessionState = wupServerSessionState;
        this._dataServerCommunicator = dataServerCommunicator;
    }

    /**
     * Start the worker service. Once called the service will start listening for all relevant worker commands and act upon them.
     */
    start() {
        Log.debug('Starting Worker Service');

        this._mainCommunicator.addMessageListener(WorkerCommand.startNewSessionCommand, this._onStartNewSessionCommand.bind(this));
        this._mainCommunicator.addMessageListener(WorkerCommand.resumeSessionCommand, this._onResumeSessionCommand.bind(this));
        this._mainCommunicator.addMessageListener(WorkerCommand.changeContextCommand, this._onChangeContextCommand.bind(this));
        this._mainCommunicator.addMessageListener(WorkerCommand.updateCsidCommand, this._onUpdateCsidCommand.bind(this));
        this._mainCommunicator.addMessageListener(WorkerCommand.updatePsidCommand, this._onUpdatePsidCommand.bind(this));
        this._mainCommunicator.addMessageListener(WorkerCommand.updateLogUrlCommand, this._onUpdateLogUrlCommand.bind(this));
        this._mainCommunicator.addMessageListener(WorkerCommand.sendDataCommand, this._onSendDataCommand.bind(this));
        this._mainCommunicator.addMessageListener(WorkerCommand.sendLogCommand, this._onSendLogCommand.bind(this));
        this._mainCommunicator.addMessageListener(WorkerCommand.updateBrandCommand, this._onUpdateBrandCommand.bind(this));
        this._mainCommunicator.addMessageListener(WorkerCommand.setAgentTypeCommand, this._setSessionAgentType.bind(this));
        this._mainCommunicator.addMessageListener(WorkerCommand.updateAgentIdCommand, this._onUpdateAgentId.bind(this));
        this._mainCommunicator.addMessageListener(WorkerCommand.enableWupMessagesHashingCommand, this._setWupMessagesHashing.bind(this));
    }

    _onStartNewSessionCommand(command) {
        this._wupServerClient.startNewSession(
          command.cid,
          command.protocolType,
          command.minifiedUri,
          command.csid,
          command.psid,
          command.muid,
          command.contextName,
          command.serverAddress
        );
    }

    _onResumeSessionCommand(command) {
        this._wupServerClient.resumeSession(
          command.cdsnum,
          command.cid,
          command.protocolType,
          command.minifiedUri,
          command.csid,
          command.psid,
          command.muid,
          command.contextName,
          command.serverAddress,
          command.serverState
        );
    }

    /**
     * For cases where the sid is updated during and after init like customer event or late csid
     * Server expects to request ID to start from 0 every new SID. Can also be used to update the wup wrapper
     * fields - (csid, context_name etc)
     * @param data - structure of data - if contains updateParams=true, then fields objects exists,
     * otherwise pass all the data for initialization
     */
    _onChangeContextCommand(data) {
        Log.debug('Worker received a ChangeContextCommand from main.');

        this._wupServerSessionState.setContextName(data.contextName);
    }

    /**
     * Handles the UpdateCsidCommand. Function updates the csid in the server communicator session data and sends an update wup to the server
     * @param data - the csid
     */
    _onUpdateCsidCommand(data) {
        Log.debug(`Worker received an UpdateCsidCommand from main. CSID: ${data.csid}.`);
        this._wupServerClient.updateCsid(data.csid);
    }

    /**
     * Handles the UpdatePsidCommand. Function updates the psid in the server communicator session data and sends an update wup to the server
     * @param data - the psid
     */
    _onUpdatePsidCommand(data) {
        Log.debug(`Worker received an UpdatePsidCommand from main. PSID: ${data.psid}.`);

        this._wupServerClient.updatePsid(data.psid);
    }

    _onUpdateLogUrlCommand(data) {
        /**
         * attach the session identifiers to the worker's Log instance.
         * Log.attachSessionIdentifiers also been called from ConfigurationService.updateLogUrlToWorker so that
         * it Log static instance will be updated as well.
         */
        Log.attachSessionIdentifiers(data.sessionIdentifiers)

        this._logServerClient.setServerUrl(data.logAddress);
    }

    _onSendDataCommand(message) {
        this._messageProcessor.process(message);
    }

    _onSendLogCommand(message) {
        this._logMessageProcessor.process(message);
    }

    _onUpdateBrandCommand(data) {
        this._wupServerClient.updateBrand(data.brand);
    }

    _setSessionAgentType(data){
        this._wupServerSessionState.setAgentType(data.agentType);
    }

    _onUpdateAgentId(data){
        this._wupServerSessionState.setAgentId(data.agentId);
    }

    _setWupMessagesHashing(data){
        this._dataServerCommunicator.updateEnableWupMessagesHashing(data.enableWupMessagesHashing);
    }

}
