import Log from "../main/technicalServices/log/Logger";
import {ConfigurationFields} from "../main/core/configuration/ConfigurationFields";

/**
 * This class responsible for buffering messages until the slave will execute successfully a handShake
 * @type {SlaveBuffer}
 * When the configuration enableAcknowledgeMessageEvents is true, this class also handles a logic
 * of buffering and giving a unique ID for the collected data.
 * Data won't be removed from the buffer unless ack message has been received from the Android channel.
 * The mechanism of handling these messages is done by the AcknowledgeMessageEventsHandler and AcknowledgeDataDispatcher classes
 */
export default class SlaveBuffer {
    constructor(configurationRepository, cdUtils) {
        this._enableBuffering = true;
        this._preHandshakeBuffer = [];
        this._configurationRepository = configurationRepository
        this._cdUtils = cdUtils;
    }

    addToBuffer(msg) {
        const isEnabled = this._configurationRepository.get(ConfigurationFields.enableAcknowledgeMessageEvents);
        if(isEnabled){
            msg = this._addAckIdToEvent(msg);
        }
        if (this._enableBuffering) {
            this._preHandshakeBuffer.push(msg);
        }
    }

    _addAckIdToEvent(msg){
        const msgId = this._cdUtils.generateUUID();
        msg.msgId = JSON.stringify(msgId);
        return {msgId,msg}
    }

    sendBufferedMessagesToChannel(postMessageToChannelCallback) {
        this._preHandshakeBuffer.forEach((msg) => {
            postMessageToChannelCallback(msg);
        });
        this.clearBuffer();
    }

    sendBufferedAckMessagesToChannel(postMessageToChannelCallback) {
        if(!this._preHandshakeBuffer.length){
            return;
        }
        this._preHandshakeBuffer.forEach((messageObj) => {
            postMessageToChannelCallback(messageObj.msg);
        });
    }

    postBufferedMessagesToParent() {
        this._preHandshakeBuffer.forEach((msg) => {
            window.parent.postMessage(msg, '*');
        });
        this.clearBuffer();
    }

    clearBuffer() {
        if (this._preHandshakeBuffer && this._preHandshakeBuffer.length > 0) {
            this._preHandshakeBuffer = [];
            this._enableBuffering = false;
        }
    }

    removeAcknowledgedMessage(msgId){
        if(!this._preHandshakeBuffer.length){
            Log.info('received ack message request but pre handshake queue is empty');
            return;
        }
        this._removeMessageIdFromBuffer(msgId);
    }

    //filtering out a message from the array of messages and builds
    // an updated array that have not received ack from the channel
    _removeMessageIdFromBuffer(msgId){
        this._preHandshakeBuffer = this._preHandshakeBuffer.filter((message) =>{
            return message.msgId !== msgId;
        });
    }

    isEmpty(){
        return this._preHandshakeBuffer.length === 0
    }

}