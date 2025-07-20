import { DATA_SOURCE_TYPE } from './Constants';

export default class WupRequestBodyBuilder {
    constructor(wupServerSessionState) {
        this._wupServerSessionState = wupServerSessionState;
    }

    build(wupMessage, shouldFlush = false) {
        wupMessage.setSid(this._wupServerSessionState.getSid());
        wupMessage.setSts(this._wupServerSessionState.getSts());
        wupMessage.setStd(this._wupServerSessionState.getStd());
        wupMessage.setOtt(this._wupServerSessionState.getOtt());

        if(shouldFlush) {
            wupMessage.setFlush(DATA_SOURCE_TYPE)
        }

        return JSON.stringify(wupMessage.getInternalMessage());
    }
}
