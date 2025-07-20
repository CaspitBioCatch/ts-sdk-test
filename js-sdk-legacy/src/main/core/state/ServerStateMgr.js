import { WorkerEvent } from '../../events/WorkerEvent';
import {WorkerCommand} from "../../events/WorkerCommand";

/**
 * structure of the state:
 * requestId: int
 * sid: _me.messageStruct.cdsnum
 * sts: _me.messageStruct.sts,
 * std: _me.messageStruct.std,
 */
export default class ServerStateMgr {
    constructor(workerCommunicator, utils, agentIdService) {
        this._workerComm = workerCommunicator;
        this._utils = utils;
        this._currState = null;
        this._agentIdService = agentIdService;

        workerCommunicator.addMessageListener(WorkerEvent.ServerStateUpdatedEvent, this._onStateUpdateFromWorker.bind(this));
        workerCommunicator.addMessageListener(WorkerEvent.ServerNewAgentIdEvent, this._onNewAgentIdFromWorker.bind(this));
        // listen to changes in storage in case other tabs changed the data
        utils.addEventListener(window, 'storage', this._onStateUpdateFromStorage.bind(this), true);
    }

    /**
     * Get the server state we have cached. The state will be returned only if the expected sid param is equal to the cached state sid
     * @param expectedStateSid - The expected sid of the state
     * @returns {*}
     */
    getServerState(expectedStateSid) {
        // We require an expected sid so we can compare it to the sid of the state
        if (this._utils.isUndefinedNull(expectedStateSid)) {
            throw new Error(`Invalid sid param of ${expectedStateSid}`);
        }

        this._currState = this._currState || this._utils.StorageUtils.getFromLocalStorage('cdSrvrState');

        // Make sure the state we have is of the sid we expect
        if (this._currState && this._currState.sid !== expectedStateSid) {
            return null;
        }

        return this._currState;
    }

    onSessionIdChange() {
        this._utils.StorageUtils.removeFromLocalStorage('cdSrvrState');
        this._currState = null;
    }

    _onStateUpdateFromWorker(state) {
        this._updateServerState(state);
    }

    _updateServerState(state) {
        this._currState = state;
        this._utils.StorageUtils.saveToLocalStorage('cdSrvrState', state);
    }

    /**
     * This method is called when we get a storage event from another tab
     * we update the storage of this tab with the new state
     * @param e
     * @private
     */
    _onStateUpdateFromStorage(e) {
        if (e && e.storageArea && e.storageArea.cdSrvrState) {
            const serverState = JSON.parse(e.storageArea.cdSrvrState);
            this._workerComm.sendAsync(WorkerCommand.stateUpdateFromStorage, {
                requestId: serverState.val.requestId,
                sts: serverState.val.sts,
                std: serverState.val.std,
                ott: serverState.val.ott
            });
        }
    }
    _onNewAgentIdFromWorker(agentId) {
        this._agentIdService.set(agentId);
    }

}
