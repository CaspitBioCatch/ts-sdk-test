import {DATA_SOURCE_TYPE} from './Constants';


export default class WupMessage {
    constructor() {
        this._messageStruct = { ds: DATA_SOURCE_TYPE };
    }

    getDataSource() {
        return this._messageStruct.ds;
    }

    getSid() {
        return this._messageStruct.cdsnum;
    }

    setSid(sid) {
        this._messageStruct.cdsnum = sid;
    }

    getCsid() {
        return this._messageStruct.csid;
    }

    setCsid(csid) {
        this._messageStruct.csid = csid;
    }

    getPsid() {
        return this._messageStruct.psid;
    }

    setPsid(psid) {
        this._messageStruct.psid = psid;
    }

    getMuid() {
        return this._messageStruct.muid;
    }

    setMuid(muid) {
        this._messageStruct.muid = muid;
    }

    getContextName() {
        return this._messageStruct.context_name;
    }

    setContextName(contextName) {
        this._messageStruct.context_name = contextName;
    }

    getRequestId() {
        return this._messageStruct.requestId;
    }

    setRequestId(requestId) {
        this._messageStruct.requestId = requestId;
    }

    getSts() {
        return this._messageStruct.sts;
    }

    setSts(sts) {
        this._messageStruct.sts = sts;
    }

    getStd() {
        return this._messageStruct.std;
    }

    setStd(std) {
        this._messageStruct.std = std;
    }

    setFlush(flushName) {
        this._messageStruct.f = flushName;
    }

    getConfigurationName() {
        return this._messageStruct.c;
    }

    setConfigurationName(configurationName) {
        this._messageStruct.c = configurationName;
    }

    getData() {
        return this._messageStruct.d;
    }

    setData(data) {
        this._messageStruct.d = data;
    }

    getInternalMessage() {
        return this._messageStruct;
    }

    setOtt(ott) {
        this._messageStruct.ott = ott;
    }

    getOtt() {
        return this._messageStruct.ott;
    }
    setAgentType(agentType) {
        this._messageStruct.agent_type = agentType;
    }
    getAgentType() {
        return this._messageStruct.agent_type;
    }
    setAgentId(agentId) {
        this._messageStruct.agent_id = agentId;
    }
    getAgentId() {
        return this._messageStruct.agent_id;
    }
}
