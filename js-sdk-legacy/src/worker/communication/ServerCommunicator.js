import Queue from '../../main/infrastructure/Queue';
import Log from '../../main/technicalServices/log/Logger';
import DOMUtils from "../../main/technicalServices/DOMUtils";
import HashService from "../services/HashService";
import {sha256HeaderName} from "../../main/const/hashing";
import { POST } from "../../main/const/communication";

export default class ServerCommunicator {
    constructor(requestBodyBuilder, settings, workerUtils, retryMessage, acceptNoResponse = false,
                messageDescriptor = '') {
        this._requestBodyBuilder = requestBodyBuilder;
        this.updateSettings(settings);
        this._workerUtils = workerUtils;
        this._acceptNoResponse = acceptNoResponse;
        this._messageDescriptor = messageDescriptor;
        this.retryMessage = retryMessage;

        this._dataQueue = new Queue();
        this._awaitingServerResponse = false;
        this._currentSentItem = null;
        this._sendRetryTimeoutId = null;
        this._shouldRetryToSendMessage = false;

        // An id for a message for easier tracking of logs
        this._messageIdentifier = 0;

        this._enableRequestBodyHashing = false;
        this._isPaused = false;

    }

    updateSettings(settings) {
        this._queueLoadThershold = settings.queueLoadThreshold;
    }

    getRetryMessage() {
        return this.retryMessage;
    }

    updateEnableWupMessagesHashing(enableRequestBodyHashing) {
        this._enableRequestBodyHashing = enableRequestBodyHashing;
    }

    /**
     * Send a message to the server
     * @param message
     * @param timeout
     * @param maxNumberOfSendAttempts - The max number of send attempts for each message. 0 means infinite attempts
     * @param shouldFlush
     * @param onSuccessResponse
     * @param onMessageRetryFailure
     * @param onMessageFailure
     * @param serverUrl - The URL to send the message to
     */
    sendMessage(message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse, onMessageRetryFailure,
                onMessageFailure, serverUrl) {
        const onSuccess = (responseData) => {
            this._onMessageSendSuccess(responseData, onSuccessResponse);
        };

        const onFailure = (responseText, status, statusText) => {
            this._onMessageSendFailure(responseText, status, statusText, onMessageRetryFailure, onMessageFailure);
        };
        this._enqueueMessage(message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccess, onFailure, serverUrl);
    }

    flush() {
        this._flushData();
    }

    setIsPaused(state) {
        this._isPaused = state;
    }

    isReadyToSendData() {
        return !this._isPaused;
    }


    _onMessageSendSuccess(responseData, callback) {

        this._awaitingServerResponse = false;
        this._currentSentItem = null;
        this._shouldRetryToSendMessage = false;
        this.retryMessage.restartMessageSettings();
        callback(responseData);
        this._processNextQueueItem();
    }

    _onMessageSendFailure(responseText, status, statusText, onRetryError, onError) {
        // This should'nt happen but i suspect that it does so for now lets handle the scenario as best as we can
        if (!this._currentSentItem) {
            Log.error(`An unexpected error has occurred while handling a ${this._messageDescriptor} message send failure. Could not find sent item value. Moving to next queued item`);
            this._processNextQueueItem();
            return;
        }
        Log.warn(`Failed sending ${this._messageDescriptor} message #${this._currentSentItem.identifier}. ${this._buildFailureLog(responseText, status, statusText)}`);

        this._awaitingServerResponse = false;

        // If maxNumberOfSendAttempts is 0 the message is mandatory and we attempt to send until successful. Otherwise we check the number of send attempts...
        let isMandatoryMessage = this._currentSentItem.maxNumberOfSendAttempts === 0

        if (!this._isPaused && this.retryMessage.shouldReMessage(isMandatoryMessage)) {
            this._shouldRetryToSendMessage = true;
            Log.info(`Trying to send ${this._messageDescriptor} message #${this._currentSentItem.identifier} again. Number of send failures is ${this.retryMessage.getNumberOfSendFailures()}`);
            this._prepareMessageForSendRetry();

            // call onRetryError
            onRetryError && onRetryError(this.retryMessage.getNumberOfSendFailures());
        } else {
            this._shouldRetryToSendMessage = false;
            this.retryMessage.restartMessageSettings();
            Log.warn(`Discarding ${this._messageDescriptor} message #${this._currentSentItem.identifier} after ${this.retryMessage.getNumberOfSendFailures()} failed send attempts.`);
            // call onRetryError before resetting _currentMessageNumberOfSendFailures
            onRetryError && onRetryError(this.retryMessage.getNumberOfSendFailures());

            this._currentSentItem = null;

            // call onError
            onError && onError(responseText);
            this._processNextQueueItem();
        }
    }

    _enqueueMessage(message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccess, onFailure, serverUrl) {
        this._dataQueue.enqueue({
            identifier: this._messageIdentifier++,
            messageToSend: message,
            onSuccess,
            onError: onFailure,
            timeout,
            maxNumberOfSendAttempts,
            serverUrl
        });
        if (!this._shouldRetryToSendMessage) {
            // Clear the retry timeout if set because we are about to retry right now.
            this._clearRetryTimeout();

            // If a flush was requested we flush all that is in the queue before sending the current item
            if (shouldFlush) {
                this._flushData();
            }

            if (!this._awaitingServerResponse) { // Process the next queue item if we are not currently waiting for a respomnse from server
                this._processNextQueueItem(shouldFlush);
            }
        }
    }

    _processNextQueueItem(shouldFlush = false, shouldDequeue = true) {
        // No items to process
        if (!this._dataQueue.hasItems() && shouldDequeue) {
            return;
        }
        let item = null;
        if (shouldDequeue) {
            item = this._dataQueue.dequeue();
            this._currentSentItem = item;

        } else {
            item = this._currentSentItem;
        }

        const requestBody = this._requestBodyBuilder.build(item.messageToSend, shouldFlush);

        if (this._enableRequestBodyHashing) {
            HashService.hashSha256(requestBody, (err, hashedBody) => {
                if (err) {
                    Log.error(err);
                    return;
                }
                this._sendProcessedQueueItem(requestBody, item, shouldFlush, hashedBody);
            });
        } else {
            this._sendProcessedQueueItem(requestBody, item, shouldFlush);
        }

    }

    _sendProcessedQueueItem(requestBody, item, shouldFlush, hashedBody = null) {
        //using 'self' as there's no access to the window object from the worker.
        //Request is not supported by IE 11.
        if (DOMUtils.isWebWorkerFetchSupported() && shouldFlush) {
            const headers = new Headers();
            if (hashedBody) {
                headers.append(sha256HeaderName, hashedBody);
            }
            const requestData = { method: POST, headers: headers, body: requestBody, keepalive: true };
            this._sendWithFetch(requestData, item.serverUrl);
        }
        else {
            this._sendWithXMLHttpRequest(requestBody, item, hashedBody);
        }

        this._checkQueueLength();
    }

    _sendWithFetch(requestOptions, serverUrl) {
        this._currentSentItem = null;
        self.fetch(serverUrl, requestOptions)
        Log.info('Flush data was sent by fetch');
    }

    _sendWithXMLHttpRequest(requestBody, item, hashedBody) {
        this._awaitingServerResponse = true;
        this._workerUtils.getPostUrl(
            item.serverUrl,
            POST,
            requestBody,
            item.onSuccess,
            item.onError,
            this._acceptNoResponse,
            item.timeout,
            hashedBody
        );
    }

    _checkQueueLength() {
        if (this._dataQueue.length() > this._queueLoadThershold) {
            Log.warn(`Data queue has ${this._dataQueue.length()} items in queue. Might indicate slow\\unstable communication issues.`);
        }
    }

    _flushData() {
        while (this._dataQueue.hasItems()) {
            this._processNextQueueItem(true);
        }
    }

    _prepareMessageForSendRetry() {

        this._clearRetryTimeout();
        this.retryMessage.updateRetryInterval();
        let timeBetweenRetry = this.retryMessage.getNextInterval()
        this._sendRetryTimeoutId = setTimeout(() => {
            this._processNextQueueItem(false, false);
        }, timeBetweenRetry);
    }

    _clearRetryTimeout() {
        if (this._sendRetryTimeoutId) {
            clearTimeout(this._sendRetryTimeoutId);
        }
    }

    _buildFailureLog(responseText, status, statusText) {
        let failureLog = '';

        if (responseText) {
            failureLog += `Response Text: ${responseText}.`;
        }

        if (status) {
            failureLog += `Status: ${status}.`;
        }

        if (statusText) {
            failureLog += `Status Text: ${statusText}.`;
        }

        return failureLog;
    }
}
