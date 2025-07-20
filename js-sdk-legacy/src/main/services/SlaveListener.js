/**
 * This class is loaded in the master side. It listens to messages from slaves and sending them messages back.
 * The main messages are data and logs that the slaves send. In addition context change messages that will cause
 * the master to change context.
 * The _slaves array contains all the direct slaves (children iframes) that communicates with the master.
 * @type {SlaveListener}
 */
import CDEvent from '../infrastructure/CDEvent';
import { MasterSlaveMessage } from '../../slave/MasterSlaveMessage';
import Log from '../technicalServices/log/Logger';

export default class SlaveListener {
    constructor(dataQ, configurationRepository, utils, logPerfDataQ, contextMgr, sessionService) {
        this._slaves = [];
        this._dataQ = dataQ;
        this._configurationRepository = configurationRepository;
        this._utils = utils;
        this._logPerfDataQ = logPerfDataQ;
        this._contextMgr = contextMgr;
        this._sessionService = sessionService;

        this.onResetSessionTrigger = new CDEvent();
        this.onMouseChallengeTrigger = new CDEvent();

        this._msgRouter = {
            dataFromSlave: this._onDataFromSlave,
            registerSlave: this._onRegisterSlave,
            logPerfSlave: this._onLogPerfSlave,
            updateMasterContext: this._onUpdateMasterContext,
            resetSessionTriggerFromSlave: this._onResetSessionTriggerFromSlave,
            mouseChallengeTriggerFromSlave: this._onMouseChallengeTriggerFromSlave,
        };
    }

    listen() {
        Log.debug('SlaveListener:listen');
        this._utils.addEventListener(window, 'message', (e) => {
            const msgType = e.data.msgType;
            msgType && this._msgRouter[msgType] && this._msgRouter[msgType].call(this, e);
        });
    }

    sendToSlaves(msgType, data) {
        Log.debug('SlaveListener:sendToSlaves');
        this._slaves.forEach((slave) => {
            slave.source.postMessage({ msgType, data }, slave.origin);
        });
    }

    onConfigUpdate() {
        Log.debug(`SlaveListener:onConfigUpdate, updating ${this._slaves.length} slaves`);
        this.sendToSlaves(MasterSlaveMessage.updateSlaveConf, this._configurationRepository.getAll());
    }

    notifyStateChange(stateChangeMessage) {
        Log.info(`SlaveListener:notifyStateChange, updating ${this._slaves.length} slaves that the new state is ${stateChangeMessage.toState}`);
        this.sendToSlaves(MasterSlaveMessage.updateSlaveState, stateChangeMessage);
    }

    _onDataFromSlave(e) {
        const msg = e.data;
        if (msg.data.eventName === 'flushData') return;
        if(this._isScriptVersionMessage(msg)) {
            msg.data.eventName && this._dataQ.addToQueue(msg.data.eventName, msg.data.data,false);
            return;
        }
        msg.data.eventName && this._dataQ.addToQueue(msg.data.eventName, msg.data.data);
    }

    _isScriptVersionMessage(msg){
        if(msg.data.eventName === 'static_fields' && msg.msgType === 'dataFromSlave'){
            return msg.data && msg.data.data && (msg.data.data[0] === 'slave_version_client' || msg.data.data[0] === 'device_source');
        }
        return false;
    }

    _onRegisterSlave(e) {
        Log.info(`SlaveListener:_onRegisterSlave - slave registered, origin ${e.origin}`);

        this._slaves.push({ source: e.source, origin: e.origin });
        e.source.postMessage({ msgType: 'updateSlaveConf', data: this._configurationRepository.getAll() },
            e.origin);
    }

    _onLogPerfSlave(e) {
        const msg = e.data;
        if (msg.data.eventName === 'flushData') return;

        // when the slave is unloaded its DataQ sends a flushData message ("data":[{"eventName":"flushData"}])
        // which is not relevant to the main
        msg.data.eventName && this._logPerfDataQ.addToQueue(msg.data.eventName, msg.data.data);
    }

    /**
     * Handle notification from slave about a context update.
     * @param e
     */
    _onUpdateMasterContext(e) {
        Log.debug('SlaveListener:_onUpdateMasterContext');
        const msg = e.data;

        this._contextMgr.setContext(msg.data);
    }

    /**
     * Handle notification from slave about a reset session detection.
     * @param e
     */
    _onResetSessionTriggerFromSlave(e) {
        Log.debug('SlaveListener:_onResetSessionTriggerFromSlave');
        const msg = e.data;

        this.onResetSessionTrigger.publish(msg.data);
    }

    /**
     * Handle notification from slave about a mouse challenge detection.
     * @param e
     */
    _onMouseChallengeTriggerFromSlave(e) {
        Log.debug('SlaveListener:_onMouseChallengeTriggerFromSlave');
        const msg = e.data;

        this.onMouseChallengeTrigger.publish(msg.data);
    }
}
