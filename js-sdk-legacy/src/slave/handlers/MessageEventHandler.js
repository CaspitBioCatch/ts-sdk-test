/**
 This class responsible for handling messages event and act as compositor
 for 2 different communicating methods - window postMessage and MessageChannel.
 * @type {MessageEventHandler}
 */
import { ConfigurationFields } from '../../main/core/configuration/ConfigurationFields';
import { MasterSlaveMessage } from '../MasterSlaveMessage';

export default class MessageEventHandler {
    constructor(configurationRepository, slaveBuffer, eventAggregator, acknowledgeMessageEventsHandler) {
        this._channelPort = null;
        this._slaveBuffer = slaveBuffer;
        this._configurationRepository = configurationRepository;
        this._eventAggregator = eventAggregator;
        this._keepAliveIntervalID = null;
        this._acknowledgeMessageEventsHandler = acknowledgeMessageEventsHandler;
        this._isRecivedIsChannelSupportsAckMessage = false;
        this._isHandshakeCompleted = false;
    }

    subscribeToMessageEvents(channelMessageCallback, windowMessageCallback) {
        setTimeout(()=>{
            if(!this._isRecivedIsChannelSupportsAckMessage){
                this._slaveBuffer.clearBuffer.call(this._slaveBuffer);
            }
        },this._configurationRepository.get(ConfigurationFields.slaveChannelHandshakeTimeout))

        this._eventAggregator.addEventListener(window, 'message', (e) => {
            if (this._isChannelMessage(e)) {
                this._handleChannelMessage(e, channelMessageCallback);
            } else {
                this._handleWindowPostMessage(e, windowMessageCallback);
            }
        });

        this._eventAggregator.addEventListener(window, 'beforeunload', () => {
            this._sendToChannel({ msgType: MasterSlaveMessage.onBeforeUnload });
            this._acknowledgeMessageEventsHandler.handleBeforeUnloadEvent(this._postMessageToChannel.bind(this), this.portIsOpen.bind(this));

        });
    }

    sendToParent(msg) {
        window.parent.postMessage(msg, '*');
        this._sendToChannel(msg);
    }

    _handleWindowPostMessage(e, postMessageCallback) {

        // handle only messages that come from a slave or a parent, not messages that are from the same
        // window. This is needed since in hybrid the slave is loaded on the top window and we do not want
        // to post to ourselves over and over
        // isNative is used to accept messages originating from the SDKs
        // this is because these messages and the slave reside on the same window

        if ((e.data && e.data.isNative) && (e.data.msgType && e.data.msgType === MasterSlaveMessage.updateSlaveConf))
            this._slaveBuffer.postBufferedMessagesToParent();

        if (e.source !== window || (e.data && e.data.isNative)) {
            postMessageCallback(e, e.data.msgType);
        }
    }

    _handleChannelMessage(e, channelMessageCallback) {

        if(this._channelPort) {
            this._channelPort.close();
        }

        if(this._keepAliveIntervalID) {
            clearInterval(this._keepAliveIntervalID);
        }

        this._channelPort = e.ports[0];

        this._setPortEventHandlers(channelMessageCallback);
        this._postMessageToChannel({ msgType: MasterSlaveMessage.slaveHandShake });
        this._postMessageToChannel({ msgType: MasterSlaveMessage.registerSlave });
        this._postMessageToChannel({ msgType: MasterSlaveMessage.slaveAlive });

        this._keepAliveIntervalID = setInterval(this._postSlaveAliveMessage, this._configurationRepository.get(ConfigurationFields.slaveAliveMessageInterval), this);
    }

    _postSlaveAliveMessage(self) {
        self._postMessageToChannel({ msgType: MasterSlaveMessage.slaveAlive });
    }

    _setPortEventHandlers(channelMessageCallback) {
        this._channelPort.onmessage = this._portMessageHandler(channelMessageCallback);

        this._channelPort.onmessageerror = (error) => {
            log.error('port error', error.toString());
        };
    }

    _isChannelMessage(e) {
        return typeof e.ports !== 'undefined' && Array.isArray(e.ports) && e.ports.length > 0
            && e.data === MasterSlaveMessage.cdHandShake;
    }

    _portMessageHandler(channelMessageCallback) {
        return (event) => {
            if (typeof event.ports !== 'undefined' && Array.isArray(event.ports)) {
                const msgData = JSON.parse(event.data);

                if(msgData.msgType === MasterSlaveMessage.isChannelSupportsAckMessageLogic){
                    this._isRecivedIsChannelSupportsAckMessage = true;
                    this._configurationRepository.set(ConfigurationFields.isChannelSupportsAckMessageLogic, true);
                }

                if (msgData.msgType === MasterSlaveMessage.updateSlaveConf) {
                    const isEnableAckMessageLogic = this._isEnableAckMessageLogic.call(this);
                    channelMessageCallback(msgData);
                    const funcPostMessageToChannel = this._postMessageToChannel.bind(this);

                    if(isEnableAckMessageLogic){
                        this._acknowledgeMessageEventsHandler.enableAcknowledgeMessageEvents(this._postMessageToChannel.bind(this),this.portIsOpen.bind(this));
                    }
                    else{
                        this._configurationRepository.set(ConfigurationFields.enableAcknowledgeMessageEvents, false);
                        this._slaveBuffer.sendBufferedMessagesToChannel(funcPostMessageToChannel);
                    }
                    this._isHandshakeCompleted = true;
                }

                if(msgData.msgType === MasterSlaveMessage.channelMessageIdAck) {
                    this._acknowledgeMessageEventsHandler.removeAcknowledgedMessage(msgData.msgId);
                }
            }
        };
    }

    _isEnableAckMessageLogic(){
        if(!this._isRecivedIsChannelSupportsAckMessage){
            return false;
        }
        return  !!this._configurationRepository.get(ConfigurationFields.enableAcknowledgeMessageEvents);
    }

    _sendToChannel(msg) {
        if (this.portIsOpen() && this._isHandshakeCompleted) {
             this._isEnableAckMessageLogic() ? this._slaveBuffer.addToBuffer(msg) : this._postMessageToChannel(msg);
        } else {
            // port is not opened yet, so add to buffer
            this._slaveBuffer.addToBuffer(msg);
        }
    }

    portIsOpen() {
        return this._channelPort !== null && typeof (this._channelPort) !== 'undefined';
    }

    _postMessageToChannel(msg) {
        if (msg.data === undefined) {
            msg.data = {};
        }
        this._channelPort.postMessage(JSON.stringify(msg));
    }

}
