/**
 * Class is responsible for building a wup message.
 */
import WupMessage from './WupMessage';
import {DATA_SOURCE_TYPE} from './Constants';

export default class WupMessageBuilder {
    constructor(wupServerSessionState, dataPacker) {
        this._wupServerSessionState = wupServerSessionState;
        this._dataPacker = dataPacker;
    }

    build(wupType, data) {
        const wupMessage = new WupMessage();

        this._updateDataWithBrand(data);

        // Set the SID property. This might be overridden before sending the message
        wupMessage.setSid(this._wupServerSessionState.getSid());
        wupMessage.setCsid(this._wupServerSessionState.getCsid());
        wupMessage.setPsid(this._wupServerSessionState.getPsid());
        wupMessage.setMuid(this._wupServerSessionState.getMuid());
        wupMessage.setContextName(this._wupServerSessionState.getContextName());
        wupMessage.setRequestId(this._wupServerSessionState.getRequestId());
        wupMessage.setAgentType(this._wupServerSessionState.getAgentType());
        wupMessage.setAgentId(this._wupServerSessionState.getAgentId());

        if (this._wupServerSessionState.getSts() && this._wupServerSessionState.getStd()) {
            // Set the STS, STD properties. These might be overridden before sending the message
            wupMessage.setSts(this._wupServerSessionState.getSts());
            wupMessage.setStd(this._wupServerSessionState.getStd());
        }

        const ott = this._wupServerSessionState.getOtt();

        if(ott){
            wupMessage.setOtt(ott);
        }

        if (wupType === DATA_SOURCE_TYPE) {
            wupMessage.setConfigurationName(wupType);
        } else {
            wupMessage.setData([this._dataPacker.pack(data)]);
        }

        return wupMessage;
    }

    _updateDataWithBrand(data) {
        const brand = this._wupServerSessionState.getBrand();
        if(brand) {
            if (!data.static_fields) {
                data['static_fields'] = [];
            }
            data.static_fields.push(['brand', brand]);
        }
    }
}
