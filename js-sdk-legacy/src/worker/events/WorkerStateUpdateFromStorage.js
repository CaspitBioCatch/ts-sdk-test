import {WorkerCommand} from "../../main/events/WorkerCommand";

export default class WorkerStateUpdateFromStorage{
    constructor(mainCommunicator, wupServerSessionState, logServerClient){
        this._mainCommunicator = mainCommunicator;
        this._wupServerSessionState = wupServerSessionState;
        this._logServerClient = logServerClient

        this._mainCommunicator.addMessageListener(WorkerCommand.stateUpdateFromStorage, this._handle.bind(this));
        this._mainCommunicator.addMessageListener(WorkerCommand.updateSDKStateCommand, this._handleStateChanged.bind(this));
    }

    _handle(msg){

        if(msg?.requestId  && (msg?.ott || msg?.sts)){
            this._wupServerSessionState.setRequestId(msg.requestId, false);
            this._wupServerSessionState.setOtt(msg.ott);
            this._wupServerSessionState.setSts(msg.sts);
            this._wupServerSessionState.setStd(msg.std);
        }
    }

    _handleStateChanged(newState) {
        this._logServerClient.setIsPaused(newState.SDK_state);
    }
}