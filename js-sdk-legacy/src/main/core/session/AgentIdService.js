import {WorkerCommand} from "../../events/WorkerCommand";

export default class AgentIdService {
    constructor(agentIdCache, serverWorkerCommunicator) {
        this._agentIdCache = agentIdCache;
        this._serverWorkerCommunicator = serverWorkerCommunicator;
    }

    updateAgentIdWithServer() {
        const agentId = this._agentIdCache.get();
        this._serverWorkerCommunicator.sendAsync(WorkerCommand.updateAgentIdCommand, {agentId})

    }
    set(agentId) {
        if (!agentId) {
            throw new Error('Invalid agentId value of undefined');
        }
        this._agentIdCache.set(agentId);
    }

}