import Log from '../main/technicalServices/log/Logger';

export default class MessageProcessor {
    constructor(dataDispatcher) {
        this._dataDispatcher = dataDispatcher;
    }

    /**
     * Initial message processing. Understands if the message is an array of messages or a single message (why do we even send different structures?!?!?!?!)
     * and forwards accordingly for message processing.
     * Finally the method triggers the wup dispatcher data send if required.
     * @param message
     */
    process(message) {
        if (!message) {
            throw new Error('Invalid message received for processing.');
        }

        let shouldFlush = false;

        if (Array.isArray(message)) {
            for (let i = 0, len = message.length; i < len; i++) {
                // Check if flush was requested on one of the messages or if flush was already requested just keep it true
                shouldFlush = this._processSingleMessage(message[i]) || shouldFlush;
            }
        } else {
            // Check if flush was requested on one of the messages or if flush was already requested just keep it true
            shouldFlush = this._processSingleMessage(message) || shouldFlush;
        }

        this._dataDispatcher.sendIfRequired(shouldFlush);
    }

    /**
     * Processes a single message. Decides if the message includes a flush request or is a flush message.
     * Validates the message structure and forwards to wup dispatcher in case there is data to send
     * @param message
     * @returns {boolean} - True if a flush of data is required. False otherwise
     * @private
     */
    _processSingleMessage(message) {
        // If the message is a flush message containing no data we just return true for the flush
        if (this._isEmptyFlushMessage(message)) {
            return true;
        }

        // In case the message contains the shouldFlush property we mark should flush as true
        // but continue to process the data on the message
        let shouldFlush = false;
        if (message.shouldFlush) {
            shouldFlush = true;
        }

        if (this._isDataValid(message)) {
            this._dataDispatcher.add(message);
        } else {
            const logMessage = 'Received a message with invalid structure. Missing eventName or Data fields';
            Log.error(logMessage);
            throw new Error(logMessage);
        }

        return shouldFlush;
    }

    _isEmptyFlushMessage(message) {
        return message.eventName === 'flushData';
    }

    _isDataValid(message) {
        return message.eventName && message.data;
    }
}
