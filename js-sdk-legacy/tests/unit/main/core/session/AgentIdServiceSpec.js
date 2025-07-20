import AgentIdCache from "../../../../../src/main/core/session/AgentIdCache";
import { assert } from 'chai';
import sinon from "sinon";
import WorkerCommunicator from "../../../../../src/main/technicalServices/WorkerCommunicator";
import {WorkerCommand} from "../../../../../src/main/events/WorkerCommand";
import AgentIdService from "../../../../../src/main/core/session/AgentIdService";

describe('AgentIdService tests:', function () {
    let sandbox = null;
    let workerCommunicator = null;
    let agentIdCache = null;
    let agentIdService = null;

    beforeEach(function () {
        sandbox = sinon.createSandbox();
        workerCommunicator = sandbox.createStubInstance(WorkerCommunicator);
        agentIdCache = sandbox.createStubInstance(AgentIdCache);
        agentIdService = new AgentIdService(agentIdCache, workerCommunicator);
    });

    afterEach(function () {
        sandbox.restore();
        workerCommunicator = null;
        agentIdCache = null;
        agentIdService = null;
    });

    describe('updateAgentIdWithServer', () => {
        it('should retrieve agentId from cache and send to server', function () {
            const mockAgentId = 'mockId';
            agentIdCache.get.returns(mockAgentId);

            agentIdService.updateAgentIdWithServer();

            sinon.assert.calledWith(agentIdCache.get);
            sinon.assert.calledWith(workerCommunicator.sendAsync, WorkerCommand.updateAgentIdCommand, { agentId: mockAgentId });
        });
    });

    describe('set', () => {
        it('should set agentId in cache', function () {
            const mockAgentId = 'mockId2';
            agentIdService.set(mockAgentId);

            sinon.assert.calledWith(agentIdCache.set, mockAgentId);
        });

        it('should throw error if agentId is not provided', function () {
            assert.throws(() => {
                return agentIdService.set()
            }, 'Invalid agentId value of undefined');
        });
    });
});
