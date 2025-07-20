import { ConfigurationFields } from '../../main/core/configuration/ConfigurationFields';
import Log from '../../main/technicalServices/log/Logger';
import { WorkerStatusCategoryType } from '../WorkerStatusCategoryType';
import { statusTypes } from '../../main/events/HeartBeatEvent';
import { MessageBusEventType } from '../../main/events/MessageBusEventType';
import HeartBeatEvent from '../../main/events/HeartBeatEvent';
import ConfigurationWrapperWupMessage from "../../main/core/configuration/ConfigurationWrapperWupMessage";
import {DATA_SOURCE_TYPE, DEFAULT_WUP_TYPE} from './Constants';
import {AgentType} from "../../main/contract/AgentType";
import { serverProtocolV4, serverProtocolV3 } from '../../main/const/communication';
import { buildServerUrl } from './WupUrlBuilder';


export default class WupServerClient {
    constructor(serverCommunicator,
                wupMessageBuilder,
                wupServerSessionState,
                wupStatisticsService,
                wupResponseProcessor,
                configurationRepository,
                msgBus) {
        this._serverCommunicator = serverCommunicator;
        this._wupMessageBuilder = wupMessageBuilder;
        this._wupServerSessionState = wupServerSessionState;
        this._wupStatisticsService = wupStatisticsService;
        this._wupResponseProcessor = wupResponseProcessor;
        this._configurationRepository = configurationRepository;
        this._msgBus = msgBus;
        // Retry infinite number of times until successful...
        this._INFINITE_MESSAGE_SEND_RETRIES = 0;

        this._retryMessage = this._serverCommunicator.getRetryMessage();
        this._MESSAGE_SEND_RETRIES = this._configurationRepository.get(ConfigurationFields.wupMessageNumToRetry);
        this._requestTimeout = this._configurationRepository.get(ConfigurationFields.wupMessageRequestTimeout);
    }

    startNewSession(cid, protocolType, minifiedUriEnabled,  csid, psid, muid, contextName, serverAddress) {
        this._validateCommonSessionRelatedParameters(muid, serverAddress);

        // Reset the request ID since we are starting a new session
        this._wupServerSessionState.setRequestId(0);
        //Reset the brand since the start new session arrived from the api and not from the server
        this._wupServerSessionState.setBrand(null);

        this._sendSessionMessage(null, cid, protocolType, minifiedUriEnabled, csid, psid, muid, contextName, serverAddress, null, this._wupServerSessionState.getRequestId());
    }

    /**
     * Send a new session or resume session message to the server
     * @param sid - the sid if available. If not a new session will be started.
     * @param cid
     * @param protocolType
     * @param minifiedUriEnabled
     * @param csid - csid if available
     * @param psid - psid if available
     * @param muid
     * @param contextName
     * @param serverAddress
     * @param serverState
     * @param requestId
     * @private
     */
    _sendSessionMessage(sid, cid, protocolType, minifiedUriEnabled, csid, psid, muid, contextName, serverAddress, serverState, requestId) {

        this._initSession(sid, cid, protocolType, minifiedUriEnabled, csid, psid, muid, contextName, serverAddress, serverState, requestId);

        const dataToSend = this._createStaticFieldsPart();

        //We should only request for configurations if we don't have them already and if we don't have a pending request for them
        const shouldRequestConfigurations = !this._wupServerSessionState.getHasConfiguration() && !this._wupServerSessionState.getHasPendingConfigurationRequest();

        //Mark that we are requesting configuration so that we don't do double requests... This can actually
        //happen if a customer for instance calls reset session fast enough
        if (shouldRequestConfigurations) {
            this._wupServerSessionState.markConfigurationRequested()
        }

        // Build the message to be sent
        const message = this._wupMessageBuilder.build(shouldRequestConfigurations ? DATA_SOURCE_TYPE : DEFAULT_WUP_TYPE, dataToSend);

        const onSendSuccess = (responseData) => {
            // If we don't have configurations yet, we indicate that we expect to receive configurations in the response
            this._onSendDataSuccess(responseData, shouldRequestConfigurations);
        };

        let serverUrl = buildServerUrl(
          serverAddress,
          protocolType,
          cid,
          minifiedUriEnabled
        );

        this._serverCommunicator.sendMessage(
          message, this._requestTimeout,
          shouldRequestConfigurations ? this._INFINITE_MESSAGE_SEND_RETRIES : this._MESSAGE_SEND_RETRIES,
          false, onSendSuccess,
          this._onSendDataRetryFailure.bind(this),
          this._onSendDataFailure.bind(this),
          serverUrl
        );
    }

    resumeSession(sid, cid, protocolType, minifiedUriEnabled, csid, psid, muid, contextName, serverAddress, serverState) {
        this._validateResumeSessionRelatedParameters(sid, muid, serverAddress);

        // if request id is zero or -1 or nan then it mean reset session
        // else just config request, reload page so increment it
        const requestId = serverState && serverState.requestId ? this._wupServerSessionState.setRequestId(serverState.requestId + 1)
            : this._wupServerSessionState.setRequestId(0);

        this._sendSessionMessage(sid, cid, protocolType, minifiedUriEnabled, csid, psid, muid, contextName, serverAddress, serverState, requestId);
    }

    sendData(data, shouldFlush = false) {
        const ottVal = this._wupServerSessionState.getOtt();
        const protocolType = this._wupServerSessionState.getProtocolType();

        const isV4 = protocolType === serverProtocolV4;
        const isV3 = protocolType === serverProtocolV3;
        const isStsStdExists = this._wupServerSessionState.getSts() && this._wupServerSessionState.getStd();

        if((ottVal && isV4) || (isStsStdExists && isV3)){
            this._sendMessage(data, shouldFlush);
            return;
        }

        // do not send data if no sts or std on V3 and ott on V4
        const noDataInfoLog = isV4 ? 'ott' : 'sts or std';
        Log.error(`Unable to send data. ${noDataInfoLog} is undefined`);

    }

    setRequestTimeout(timeout) {
        this._requestTimeout = timeout;
    }
    setConfigurationWupMessage (){
        this._configurationWrapperWupMessage = new ConfigurationWrapperWupMessage(this._configurationRepository);
        this._reWupMessageSettings = this._configurationWrapperWupMessage.createReMessageSettings();
        this._retryMessage.updateSettings(this._reWupMessageSettings);
    }

    /**
     * Initializes a new session
     */
    _initSession(sid, cid, protocolType, minifiedUriEnabled, csid, psid, muid, contextName, serverAddress, serverState, requestId) {
        Log.debug(`Initializing session. wupUrl:${serverAddress}, sid:${sid}`);

        this._wupServerSessionState.setBaseServerUrl(serverAddress);
        this._wupServerSessionState.setSid(sid);
        this._wupServerSessionState.setCid(cid);
        this._wupServerSessionState.setCsid(csid);
        this._wupServerSessionState.setPsid(psid);
        this._wupServerSessionState.setMuid(muid);
        this._wupServerSessionState.setProtocolType(protocolType);
        this._wupServerSessionState.setShouldMinifyUri(minifiedUriEnabled);

        this._wupServerSessionState.setContextName(contextName || '');
        this._wupServerSessionState.setRequestId(requestId, false);

        if (serverState) {
            this._wupServerSessionState.setSts(serverState.sts);
            this._wupServerSessionState.setStd(serverState.std);
            this._wupServerSessionState.setOtt(serverState.ott);
        } else { // a new session is starting (maybe as a result of session id change)
            Log.info('Resetting server state of server communicator. Deleting sts and std');
            this._wupServerSessionState.setSts(null);
            this._wupServerSessionState.setStd(null);
            this._wupServerSessionState.setOtt(null);

            // Reset the wup statistics once a new session is starting
            this._wupStatisticsService.resetCounters();
        }
    }

    updateCsid(csid) {
        // Get the next request id. In case there was no request id we get 0 but this should not happen
        const requestId = this._wupServerSessionState.incrementRequestId() || 0;

        this._wupServerSessionState.setCsid(csid);

        const data = { static_fields: [] };
        data.static_fields.push(
            ['requestId', requestId],
            ['contextId', this._wupServerSessionState.getContextName()],
            ['sessionId', this._wupServerSessionState.getSid()],
            ['customerSessionId', this._wupServerSessionState.getCsid()],
            ['partnerSessionId', this._wupServerSessionState.getPsid()],
            ['muid', this._wupServerSessionState.getMuid()],
        );

        this._sendMessage(data);
    }

    updatePsid(psid) {
        // Get the next request id. In case there was no request id we get 0 but this should not happen
        const requestId = this._wupServerSessionState.incrementRequestId() || 0;

        this._wupServerSessionState.setPsid(psid);

        const data = { static_fields: [] };
        data.static_fields.push(
            ['requestId', requestId],
            ['contextId', this._wupServerSessionState.getContextName()],
            ['sessionId', this._wupServerSessionState.getSid()],
            ['customerSessionId', this._wupServerSessionState.getCsid()],
            ['partnerSessionId', this._wupServerSessionState.getPsid()],
            ['muid', this._wupServerSessionState.getMuid()],
        );

        this._sendMessage(data);
    }

    updateBrand(brand) {
        this._wupServerSessionState.setBrand(brand);
    }

    isReady() {
        const isCommonReady = this._serverCommunicator.isReadyToSendData();
        const protocolType = this._wupServerSessionState.getProtocolType();

        // on wupserver V4 the std has a default value of 'std'
        if(protocolType === serverProtocolV4){
            return !!(isCommonReady && this._wupServerSessionState.getOtt());
        }
        // support for wupserver V3
        const isStsStdExists = this._wupServerSessionState.getStd() && this._wupServerSessionState.getSts();
        return !!(isCommonReady && isStsStdExists);
    }


    /**
     * Validate mandatory parameters for session resume
     * These parameters must be sent when session message is sent to server
     * @param sid
     * @param muid
     * @param serverAddress
     * @private
     */
    _validateResumeSessionRelatedParameters(sid, muid, serverAddress) {
        if (!sid) {
            throw new Error(`Invalid sid parameter ${sid}. Unable to start new session`);
        }

        this._validateCommonSessionRelatedParameters(muid, serverAddress);
    }

    /**
     * Validate mandatory parameters for start and resume of session
     * @param muid
     * @param serverAddress
     * @private
     */
    _validateCommonSessionRelatedParameters(muid, serverAddress) {
        if (!muid) {
            if (this._wupServerSessionState.getAgentType() !== AgentType.SECONDARY) {
                throw new Error(`Invalid muid parameter ${muid}. Unable to start new session`);
            }
        }

        if (!serverAddress) {
            throw new Error(`Invalid serverAddress parameter ${serverAddress}. Unable to start new session`);
        }
    }

    /**
     * Create the static fields message part out of the session state
     * @returns {{static_fields: Array}}
     * @private
     */
    _createStaticFieldsPart() {
        const staticFieldsPart = { static_fields: [] };
        staticFieldsPart.static_fields.push(
            ['requestId', this._wupServerSessionState.getRequestId()],
            ['contextId', this._wupServerSessionState.getContextName()],
            ['sessionId', this._wupServerSessionState.getSid()],
            ['customerSessionId', this._wupServerSessionState.getCsid()],
            ['partnerSessionId', this._wupServerSessionState.getPsid()],
            ['muid', this._wupServerSessionState.getMuid()],
        );

        return staticFieldsPart;
    }

    /**
     * Used to send a regular wup (all except for configuration)
     * @param data
     * @param shouldFlush
     * @private
     */
    _sendMessage(data, shouldFlush = false) {
        // Build the message to be sent
        const wupMessage = this._wupMessageBuilder.build(DEFAULT_WUP_TYPE, data);

        let serverUrl = buildServerUrl(
          this._wupServerSessionState.getBaseServerUrl(),
          this._wupServerSessionState.getProtocolType(),
          this._wupServerSessionState.getCid(),
          this._wupServerSessionState.getShouldMinifyUri()
        );

        this._serverCommunicator.sendMessage(
            wupMessage,
            this._requestTimeout,
            this._MESSAGE_SEND_RETRIES,
            shouldFlush,
            this._onSendDataSuccess.bind(this),
            this._onSendDataRetryFailure.bind(this),
            this._onSendDataFailure.bind(this),
            serverUrl
        );
    }

    _onSendDataSuccess(response, expectConfiguration) {
        // If we didn't receive the parameter we default to false
        expectConfiguration = expectConfiguration || false;

        this._publishWorkerSystemStatus(WorkerStatusCategoryType.WupServerError, statusTypes.Ok);
        this._publishWorkerSystemStatus(WorkerStatusCategoryType.WupServerError, statusTypes.Ok);

        this._handleSuccessResponse(response, expectConfiguration);

        this._wupStatisticsService.incrementSentWupCount();
    }

    _onSendDataRetryFailure(retriesCount) {
        if (retriesCount === this._MESSAGE_SEND_RETRIES) {
            // connectivity error published when retries count reach max value
            this._publishWorkerSystemStatus(WorkerStatusCategoryType.WupServerError, statusTypes.Error);
        }
    }

    _onSendDataFailure(/* response */) {
    }

    _handleSuccessResponse(response, expectConfiguration) {
        const category = expectConfiguration ? WorkerStatusCategoryType.ConfigurationReceived : WorkerStatusCategoryType.WupServerResponse;
        try {
            const parsedResponse = JSON.parse(response);

            //in the wupResponseProcessor we are using the WupServerSessionState to set the correct received from the server
            this._wupResponseProcessor.process(parsedResponse, expectConfiguration);
            this._publishWorkerSystemStatus(category, statusTypes.Ok);
        } catch (ex) {
            this._publishWorkerSystemStatus(category, statusTypes.Error);
            const err = `Failed to parse message from server: ${ex.message}`;
            Log.error(err, ex);
        }
    }

    _publishWorkerSystemStatus(category, status) {
        this._msgBus.publish(MessageBusEventType.WorkerSystemStatusEvent, new HeartBeatEvent(category, status));
    }
}
