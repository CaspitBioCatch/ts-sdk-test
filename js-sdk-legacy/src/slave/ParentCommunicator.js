import WorkerCommunicator from '../main/technicalServices/WorkerCommunicator';
import { MasterSlaveMessage } from './MasterSlaveMessage';
import Log from '../main/technicalServices/log/Logger';

/**
 * This class is loaded in slave side only. It communicates with the slave parent (can be either other slave or
 * master). When registerToParent is called it sends 'registerSlave' message and as a response it will get
 * configurations from the master with updateSlaveConf message. This class holds all the slaves that are
 * childes of this slave in the _slaves array.
 * It also extends WorkerCommunicator in order that other objects can 'addMessageListener' to one of the messages.
 * @type {ParentCommunicator}
 */
export default class ParentCommunicator extends WorkerCommunicator {
    constructor(messageEventHandler) {
        // The temp here is a hack since we cannot use 'this' before the super
        // let temp = {
        //     setonmessage: function (callback) {
        //         temp.cb = callback;
        //
        //     }
        // };
        super(); // We pass this class as mimic of the CDPort object
        this.setMessagingPort(this);
        // this._workerCommCallback = temp.cb;
        this._slaves = [];
        this._msgRouter = {
            dataFromSlave: this._onDataFromSlave,
            registerSlave: this._onRegisterSlave,
            updateSlaveConf: this._onUpdateSlaveConf,
            updateSlaveState: this._onUpdateSlaveState,
            // This bubbles from slaves that changed the context until the master.
            // The master will update his context
            updateMasterContext: this._onUpdateMasterContext,
            resetSessionTriggerFromSlave: this._onResetSessionTriggerFromSlave,
            mouseChallengeTriggerFromSlave: this._onMouseChallengeTriggerFromSlave,
        };

        this.messageEventHandler = messageEventHandler;
    }

    setonmessage(callback) {
        this._workerCommCallback = callback;
    }

    /**
     * Message handling functions end
     */
    registerToParent() {
        Log.info(`ParentRegisterer:registerToParent - registering to parent from slave. url: ${window.location.href}`);
        this.messageEventHandler.subscribeToMessageEvents(this._getChannelMessageCallback(), this._getWindowMessageCallback());
        this.messageEventHandler.sendToParent({ msgType: MasterSlaveMessage.registerSlave });
    }

    sendToParent(msg) {
        this.messageEventHandler.sendToParent(msg);
    }

    sendToSlaves(msg) {
        Log.debug('ParentCommunicator:sendToSlaves');
        this._slaves.forEach((slave) => {
            slave.source.postMessage(msg, slave.origin);
        });
    }

    /**
     * Notification from the ContextMgr about context change in this slave.
     * Update the parent about the new context and it will bubble until it will reach the master.
     * Only contexts that were created out of context configuration are interesting.
     * @param contextData
     */
    notifyContextChange(contextData) {
        if (contextData.name !== 'slave_cd_auto') {
            this.sendAsync(MasterSlaveMessage.updateMasterContext, contextData);
        }
    }

    /**
     * Notify about a reset session in the slave.
     * Update the parent about the reset session and it will bubble until it will reach the master.
     * @param resetReasonData
     */
    notifyResetSession(resetReasonData) {
        this.sendAsync(MasterSlaveMessage.resetSessionTriggerFromSlave, resetReasonData);
    }

    /**
     * Notify about a mouse challenge detection in the slave.
     * Update the parent about the trigger and it will bubble until it will reach the master.
     * @param mouseChallengeData
     */
    notifyMouseChallenge(mouseChallengeData) {
        this.sendAsync(MasterSlaveMessage.mouseChallengeTriggerFromSlave, mouseChallengeData);
    }

    /**
     * The same function as in the WorkerCommunicator but without the ability to receive callback.
     * This is not needed in the slave so i did not implemented it.
     * This overrides the WorkerCommunicator base class implementation
     */
    sendAsync(msgType, data) {
        this.sendToParent({ msgType, data });
    }

    /**
     * Message handling functions start
     */
    _onDataFromSlave(e) {
        this.sendToParent(e.data);
    }

    _onRegisterSlave(e) {
        Log.debug('ParentCommunicator:_onRegisterSlave - registering a sub slave');
        this._slaves.push({ source: e.source, origin: e.origin });
        this.sendToParent(e.data);
    }

    _onUpdateSlaveConf(e) {
        Log.debug('ParentCommunicator:_onUpdateSlaveConf - got config');
        this.sendToSlaves(e.data);
        this._workerCommCallback(e);// pass the message to however added listener by addMessageListener
    }

    _onUpdateSlaveState(e) {
        Log.debug('ParentCommunicator:_onUpdateSlaveState');
        this.sendToSlaves(e.data);
        this._workerCommCallback(e);// pass the message to however added listener by addMessageListener
    }

    /**
     * This is a notification from a sub slave about a context update.
     * Just pass it to the parent until the master
     * @param e
     */
    _onUpdateMasterContext(e) {
        Log.debug('ParentCommunicator:_onUpdateMasterContext');
        this.sendToParent(e.data);
    }

    /**
     * This is a notification from a sub slave about a reset session detection.
     * Just pass it to the parent until the master
     * @param e
     */
    _onResetSessionTriggerFromSlave(e) {
        Log.debug('ParentCommunicator:_onResetSessionTriggerFromSlave');
        this.sendToParent(e.data);
    }

    /**
     * This is a notification from a sub slave about a mouse challenge detection.
     * Just pass it to the parent until the master
     * @param e
     */
    _onMouseChallengeTriggerFromSlave(e) {
        Log.debug('ParentCommunicator:_onMouseChallengeTriggerFromSlave');
        this.sendToParent(e.data);
    }

    _getWindowMessageCallback() {
        return (e, msgType) => {
            msgType && this._msgRouter[msgType] && this._msgRouter[msgType].call(this, e);
        };
    }

    _getChannelMessageCallback() {
        return (msgData) => {
            this._msgRouter[msgData.msgType] && this._msgRouter[msgData.msgType].call(this, { data: msgData });
        };
    }
}
