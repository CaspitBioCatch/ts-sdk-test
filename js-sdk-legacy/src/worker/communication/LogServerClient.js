import { ConfigurationFields } from '../../main/core/configuration/ConfigurationFields';
import Log from '../../main/technicalServices/log/Logger';
import ConfigurationWrapperLogMessage from "../../main/core/configuration/ConfigurationWrapperLogMessage";

export default class LogServerClient {
    constructor(serverCommunicator,
                logMessageBuilder,
                configurationRepository) {
        this._serverCommunicator = serverCommunicator;
        this._logMessageBuilder = logMessageBuilder;
        this._configurationRepository = configurationRepository;
        this._serverUrl = null;

        this._MESSAGE_SEND_RETRIES = 5;
        this._requestTimeout = this._configurationRepository.get(ConfigurationFields.logMessageRequestTimeout);
    }

    setServerUrl(serverUrl) {
        this._serverUrl = serverUrl;
    }

    setIsPaused(state) {
        this._serverCommunicator.setIsPaused(state);
    }

    sendData(data, shouldFlush = false) {
        if (!this._serverUrl) {
            Log.error('Cannot send log message: server URL is not set');
            return;
        }

        const logMessage = this._logMessageBuilder.build(data);

        this._serverCommunicator.sendMessage(
            logMessage, 
            this._requestTimeout,  
            this._serverCommunicator.getRetryMessage().getMessageNumToRetry(),
            shouldFlush, 
            this._onSendDataSuccess.bind(this), 
            null,
            this._onSendDataFailure.bind(this),
            this._serverUrl
        );

        if (shouldFlush) {
            this._serverCommunicator.flush();
        }
    }

    isReady() {
        return this._serverCommunicator.isReadyToSendData();
    }

    setRequestTimeout(timeout) {
        this._requestTimeout = timeout;
    }
    setConfigurationLogMessage (){
        this._configurationWraperLogMessage = new ConfigurationWrapperLogMessage(this._configurationRepository);
        this._reLogMessageSettings =  this._configurationWraperLogMessage.createReMessageSettings();
        this._serverCommunicator.getRetryMessage().updateSettings(this._reLogMessageSettings)
    }

    _onSendDataSuccess(/* responseData */) {
        // No handling for responses from log server since there is no response currently
    }

    _onSendDataFailure(response) {
        Log.warn(`Failed sending log message. Error: ${response}.`);
    }
}
