import CDEvent from '../../main/infrastructure/CDEvent';
import Log from '../../main/technicalServices/log/Logger';

const DEFAULT_DISPATCH_RATE = 5000;

export default class WupServerSessionState {
    constructor() {
        this.onServerStateUpdated = new CDEvent();

        this.reset();
    }

    getSts() {
        return this._sts;
    }

    getStd() {
        return this._std;
    }

    getSid() {
        return this._sid;
    }

    setCid(cid) {
        this._cid = cid;
    }

    getCid() {
        return this._cid;
    }

    getCsid() {
        return this._csid;
    }

    getPsid() {
        return this._psid;
    }

    getMuid() {
        return this._muid;
    }

    getContextName() {
        return this._contextName;
    }

    getRequestId() {
        return this._requestId;
    }

    getWupDispatchRate() {
        return this._wupDispatchRate;
    }

    getBrand() {
        return this._brand;
    }

    setSts(sts) {
        this._sts = sts;
    }

    setStd(std) {
        this._std = std;
    }

    setSid(sid) {
        this._sid = sid;
    }

    setCsid(csid) {
        this._csid = csid;
    }

    setPsid(psid) {
        this._psid = psid;
    }

    setMuid(muid) {
        this._muid = muid || null;
    }

    setOtt(ott) {
        this._ott = ott;
    }

    getOtt() {
        return this._ott;
    }

    setContextName(contextName) {
        this._contextName = contextName;
    }

    setRequestId(requestId, publishChange = true) {
        this._requestId = requestId;

        if (publishChange) {
            this._publish();
        }

        return this._requestId;
    }

    setWupDispatchRate(wupDispatchRate) {
        if (!wupDispatchRate) {
            Log.warn(`Wup dispatch rate of ${wupDispatchRate} is invalid. Ignoring update`);
            return;
        }

        this._wupDispatchRate = wupDispatchRate;
    }

    setBrand(brand) {
        this._brand = brand;
    }

    setAgentType(agentType) {
        this._agent_type = agentType;
    }

    getAgentType() {
        return this._agent_type;
    }
    setAgentId(agentId) {
        this._agent_id = agentId;
    }
    getAgentId() {
        return this._agent_id;
    }

    markConfigurationRequested() {
        if (this._hasConfiguration) {
            Log.warn('We already have configuration. Ignoring the attempt to mark a pending configuration request.');
            return
        }

        this._hasPendingConfigurationRequest = true
    }

    markConfigurationReceived() {
        if(this._hasConfiguration) {
            Log.warn('Marking that we received configuration although we already received configuration from the server. We shouldn\'t have received it again.');
        } else if(!this._hasPendingConfigurationRequest) {
            Log.warn('Marking that we received configurations although we didn\'t have a pending request for configurations.');
        }

        this._hasPendingConfigurationRequest = false;
        this._hasConfiguration = true;
    }

    getHasConfiguration() {
        return this._hasConfiguration;
    }

    getHasPendingConfigurationRequest() {
        return this._hasPendingConfigurationRequest;
    }

    incrementRequestId() {
        this._requestId++;

        this._publish();

        return this._requestId;
    }

    resetRequestId() {
        this._requestId = 0;
    }

    reset() {
        this._ott = null;
        this._sts = null;
        this._std = null;
        this._sid = null;
        this._cid = null;
        this._csid = null;
        this._muid = null;
        this._contextName = null;
        this._requestId = 0;
        this._wupDispatchRate = DEFAULT_DISPATCH_RATE;
        this._hasConfiguration = false;
        this._hasPendingConfigurationRequest = false;
        this._brand = null;
        this._agent_type = null;
        this._agent_id = null;
        this._baseServerUrl = null;
        this._protocolType = null;
        this._shouldMinifyUri = false;
    }

    setBaseServerUrl(url) {
        this._baseServerUrl = url;
    }

    getBaseServerUrl() {
        return this._baseServerUrl;
    }

    setProtocolType(protocolType) {
        this._protocolType = protocolType;
    }

    setShouldMinifyUri(shouldMinifyUri) {
        this._shouldMinifyUri = shouldMinifyUri;
    }

    getShouldMinifyUri() {
        return this._shouldMinifyUri;
    }

    getProtocolType() {
        return this._protocolType;
    }

    _publish() {
        this.onServerStateUpdated.publish({
            requestId: this._requestId,
            sid: this._sid,
            sts: this._sts,
            std: this._std,
            ott: this._ott,
        });
    }
}
