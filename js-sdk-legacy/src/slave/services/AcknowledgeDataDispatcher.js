import {ConfigurationFields} from "../../main/core/configuration/ConfigurationFields";

export default class AcknowledgeDataDispatcher {
    constructor(configurationRepository, slaveBuffer) {
        this._configurationRepository = configurationRepository;
        this._slaveBuffer = slaveBuffer;
        this._ackDispatcherIntervalId = null;
    }

    start(postMessageToChannelCallback,portIsOpenCallback){
        const interval = this._configurationRepository.get(ConfigurationFields.acknowledgeDataDispatchingRate);
        if(!this._ackDispatcherIntervalId && interval !== 0){
            this._ackDispatcherIntervalId = setInterval(this._dataToChannelManager.bind(this,postMessageToChannelCallback,portIsOpenCallback) ,interval);
        }
    }

    _dataToChannelManager(postMessageToChannelCallback,portIsOpenCallback){
        const isChannelSupportsAckMessageLogic = this._configurationRepository.get(ConfigurationFields.isChannelSupportsAckMessageLogic);
        if(isChannelSupportsAckMessageLogic && portIsOpenCallback()){
           this._sendToChannel(postMessageToChannelCallback);
       }
   }

    _sendToChannel(postMessageToChannelCallback){
        this._slaveBuffer.sendBufferedAckMessagesToChannel(postMessageToChannelCallback);
    }

    clearInterval(){
        if(this._ackDispatcherIntervalId){
            clearInterval(this._ackDispatcherIntervalId);
        }
    }

    beforeUnloadEvent(postMessageToChannelCallback, portIsOpenCallback){
        this.clearInterval();
        if(!this._slaveBuffer.isEmpty() && portIsOpenCallback()){
            this._sendToChannel(postMessageToChannelCallback);
        }
    }
}