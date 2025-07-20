import { WorkerEvent } from '../../events/WorkerEvent';
import { SIDChangeType } from './SIDChangeType';
import { ConfigurationFields } from '../configuration/ConfigurationFields';
import { WorkerCommand } from '../../events/WorkerCommand';
import { MessageBusEventType } from '../../events/MessageBusEventType';
import Log from '../../technicalServices/log/Logger';
import {AgentType} from "../../contract/AgentType";

export default class SessionService {
    constructor(
      messageBus,
      configurationService,
      configurationRepository,
      utils,
      domUtils,
      workerComm,
      contextMgr,
      muidService,
      serverStateMgr,
      resetSessionSiteMapper,
      sidRepository,
      serverUrlCache,
      cidCache,
      protocolTypeCache,
      minifiedWupUriEnabled,
      csidService,
      csidCache,
      psidCache,
      brandService,
      agentIdService
    ) {
        this._messageBus = messageBus;
        this._configurationService = configurationService;
        this._configurationRepository = configurationRepository;
        this._utils = utils;
        this._domUtils = domUtils;
        this._workerComm = workerComm;
        this._contextMgr = contextMgr;
        this._muidService = muidService;
        this._serverStateMgr = serverStateMgr;
        this._resetSessionSiteMapper = resetSessionSiteMapper;
        this._sidRepository = sidRepository;
        this._csidService = csidService;
        this._csidCache = csidCache;
        this._serverAddress = serverUrlCache.get();
        this._cidCache = cidCache;
        this._protocolType = protocolTypeCache.get();
        this._minifiedWupUriEnabled = minifiedWupUriEnabled;
        this._psidCache = psidCache;
        this._brandService = brandService;
        this._agentIdService = agentIdService;
        this._agentType = configurationRepository.get(ConfigurationFields.agentType);
        this._enableStartupCustomerSessionId = this._configurationRepository.get(ConfigurationFields.enableStartupCustomerSessionId);

        // External reset is either an api call for reset or a trigger by configuration
        // we use this parameter to prevent consecutive resets from occurring
        this.lastExternalResetCallTime = null;
        this.sessionId = null;
        this._resetSessionSiteMapper.updateObserver(this._onSiteMapperMatch.bind(this));

        workerComm.addMessageListener(WorkerEvent.NewSessionStartedEvent, this._onNewSessionStartedEvent.bind(this));
        // set the session agent type by sending a message to the worker that updates the wup request payload
        this._setSessionStartupData();

    }

    resumeOrStartSession() {
        // Get existing sid if we have one available in storage. If we have a sid we will resume the session.
        // Otherwise we will send an empty sid to start a new session
        const sid = this._getSessionId();

        // We need to get rid of this idiotic isResetEveryLoad configuration.
        if (sid) {
            this._resumeSession(sid);
        } else {
            this._startNewSession();
        }
    }

    onConfigUpdate(confMgr) {
        this._resetSessionSiteMapper.onConfigUpdate(confMgr);

        if (this._configurationRepository.get('logAddress')) {
            this._configurationService.updateLogUrlToWorker(this.sessionId, this._csidCache.get(), this._workerComm);
        }
    }

    resetSession(msg) {
        this.onResetSession(msg);
    }

    /**
     * called by:
     * * the api of the customer in the cdApi
     * * onSiteMapperMatch
     * @param msg - should be in this structure { resetReason: 'my_reason'}
     */
    onResetSession(msg) {
        let resetReason = msg.resetReason ? msg.resetReason : SIDChangeType.unknown;
        // we can't control the cdApi make sure it's customerApi - the only option for other reset reason
        if (!SIDChangeType.hasOwnProperty(resetReason)) {
            resetReason = SIDChangeType.customerApi;
        }

        Log.info(`Received a Reset Session event, reason: ${resetReason}`);

        // if from the last time we re-generated session number until now less then 20 seconds passed,
        // do not reset the session.
        // We want to avoid this re-generation
        // if the server requests we need to regenerate anyway because it expects it and will not save session correctly
        if ((this._utils.dateNow() - this.lastExternalResetCallTime) > this._configurationRepository.get(ConfigurationFields.resetSessionApiThreshold)) {
            this._startNewSession(msg?.csid);
            // we need to update the sid in the log
            this._configurationService.updateLogUrlToWorker(this.sessionId, this._csidCache.get(), this._workerComm);
            this.lastExternalResetCallTime = this._utils.dateNow();
        } else {
            Log.info("Ignoring external reset session call since resetSessionApiThreshold hasn't passed");
        }
    }

    startNewSession() {
        this._startNewSession();
    }

    _startNewSession(csid = null) {
        Log.info(`Starting a new session. Previous session was ${this.sessionId}`);

        // Reset the sessionId until we get a new one from server
        this.sessionId = null;

        // If the sid has changed we reset the csid/psid if we already had one since we don't want it
        // to be included in the new session messages
        this._enableStartupCustomerSessionId ? this._setOrFetchCsid(csid) : this._csidCache.set(csid || null);
        this._psidCache.set(null);

        // If sid has changed, we don't want the server state anymore. We want to get a new one from server
        this._serverStateMgr.onSessionIdChange();

        this._onStartedNewSession();
    }

    _setOrFetchCsid(csid) {
        if (csid) {
            this._csidCache.set(csid);
        } else {
            this._csidService.get();
        }
    }

    _resumeSession(sid) {
        Log.info(`Resuming an existing session with sid ${sid}`);

        // Update the session id
        this.sessionId = sid;

        this._saveSidToStorage(this.sessionId);

        this._handleBrandResume();

        this._onResumedSession();

        this._handleCsid();
    }

    /**
     * Get an exising session number from the storage
     * @returns {*}
     * @private
     */
    _getSessionId() {
        Log.info('Attempting to get sid from storage');

        const sid = this._sidRepository.get();

        if (sid) {
            Log.info(`Read sid ${sid} from storage`);
        }

        return sid;
    }

    _saveSidToStorage(sid) {
        Log.info(`Saving sid ${sid} to storage`);

        // Save the session id to a persistent storage
        this._sidRepository.set(sid);
    }

    _onStartedNewSession() {
        // We need to get rid of this crap. This creates a very unclear behavior... We shouldn't even get here
        // without a server address.
        if (!this._serverAddress) {
            return;
        }

        const message = {
            serverAddress: this._serverAddress,
            csid: this._csidCache.get(),
            cid: this._cidCache.get(),
            protocolType: this._protocolType,
            minifiedUri: this._minifiedWupUriEnabled,
            psid: this._psidCache.get(),
            muid: this._muidService?.muid,
            contextName: this._contextMgr.getContextName(),
        };
        this._workerComm.sendAsync(WorkerCommand.startNewSessionCommand, message);
        this._configurationService.updateLogUrlToWorker(this.sessionId, this._csidCache.get(), this._workerComm);
    }

    _onResumedSession() {
        // We need to get rid of this crap. This creates a very unclear behavior... We shouldn't even get here
        // without a server address.
        if (!this._serverAddress) {
            return;
        }

        const srvState = this._serverStateMgr.getServerState(this.sessionId);
        const message = {
            serverAddress: this._serverAddress,
            csid: this._csidCache.get(),
            cid: this._cidCache.get(),
            protocolType: this._protocolType,
            minifiedUri: this._minifiedWupUriEnabled,
            psid: this._psidCache.get(),
            cdsnum: this.sessionId,
            muid: this._muidService?.muid,
            contextName: this._contextMgr.getContextName(),
            // notify the server for change by customer
            serverState: srvState,
        };

        this._workerComm.sendAsync(WorkerCommand.resumeSessionCommand, message);
        this._configurationService.updateLogUrlToWorker(this.sessionId, this._csidCache.get(), this._workerComm);
    }

    /**
     * The below function should be deprecated and removed
     */
    _handleCsid() {
        this._domUtils.onDocumentBody(self, () => {
            Log.debug(`SessionService:_sessionIdRegeneration, onDocumentBody callback: cdSNum: ${this.sessionId}`);
            this._csidService.get(() => {
                Log.info(`Received csid from client. csid: ${this._csidCache.get()}, sid:${this?.sessionId}`);
                this._sendCsidToServer();
            });
        });

    }

    _sendCsidToServer() {
        // If there is no server address we don't continue since we have nowhere to send the data to
        if (!this._serverAddress) {
            return;
        }

        Log.info(`Sending csid to worker. csid: ${this._csidCache.get()}, sid:${this.sessionId}`);

        this._workerComm.sendAsync(WorkerCommand.updateCsidCommand, { csid: this._csidCache.get() });
        this._configurationService.updateLogUrlToWorker(this.sessionId, this._csidCache.get(), this._workerComm);
    }

    _handleBrandResume() {
        this._brandService.update();
    }

    /**
     * Sent to SiteMapper to be called on match for resetSession
     */
    _onSiteMapperMatch() {
        this.onResetSession({ resetReason: SIDChangeType.configuration });
    }

    /**
     * Event is triggered once a new session is started and we receive the notification from the server
     * @param newSid - the new sid received from the server
     * @private
     */
    _onNewSessionStartedEvent(newSid) {

        this.sessionId = newSid;
        this._saveSidToStorage(this.sessionId);

        this._configurationService.updateLogUrlToWorker(this.sessionId, this._csidCache.get(), this._workerComm);

        this._notifyNewSessionStarted();
        // When agentType is Secondary, we should not act upon receiving "NewSessionStartedEvent" event.
        // The Primary is responsible for setting/resetting the Secondary CSID
        if(this._agentType !== AgentType.SECONDARY) this._handleCsid();

        Log.info(`A new session ${newSid} has started`);
    }

    _notifyNewSessionStarted() {
        // Notify subscribers about the session reset
        this._messageBus.publish(MessageBusEventType.NewSessionStartedEvent, this.sessionId);
    }

    _setSessionStartupData() {
        this._workerComm.sendAsync(WorkerCommand.setAgentTypeCommand, { agentType: this._configurationRepository.get(ConfigurationFields.agentType)});
        this._agentIdService.updateAgentIdWithServer();
    }
}
