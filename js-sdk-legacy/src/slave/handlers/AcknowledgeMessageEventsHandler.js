import {ConfigurationFields} from "../../main/core/configuration/ConfigurationFields";

export default class AcknowledgeMessageEventsHandler {
    constructor(slaveBuffer,configurationRepository,acknowledgeDataDispatcher) {
        this._slaveBuffer = slaveBuffer;
        this._configurationRepository = configurationRepository;
        this._acknowledgeDataDispatcher = acknowledgeDataDispatcher;
    }

    enableAcknowledgeMessageEvents(postMessageToChannelCallback,portIsOpenCallback){
        this._acknowledgeDataDispatcher.start(postMessageToChannelCallback,portIsOpenCallback);
    }

    removeAcknowledgedMessage(msgId){
        this._slaveBuffer.removeAcknowledgedMessage(msgId);

    }

    handleBeforeUnloadEvent(postMessageToChannelCallback, portIsOpenCallback){
        const isEnabled = this._configurationRepository.get(ConfigurationFields.enableAcknowledgeMessageEvents);
        if(isEnabled){
            this._acknowledgeDataDispatcher.beforeUnloadEvent(postMessageToChannelCallback, portIsOpenCallback);
        }
    }
}