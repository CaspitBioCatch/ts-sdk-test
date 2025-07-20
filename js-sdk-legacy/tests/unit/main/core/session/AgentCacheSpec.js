import AgentIdCache from "../../../../../src/main/core/session/AgentIdCache";
import { assert } from 'chai';
import sinon from "sinon";
import StorageUtilsWrapper from "../../../../../src/main/technicalServices/StorageUtilsWrapper";

describe('AgentIdCache tests:', function () {
    let sandbox = null;
    let storageUtilsWrapper = null;
    let agentIdCache = null;

    beforeEach(function () {
        sandbox = sinon.createSandbox();
        storageUtilsWrapper = sandbox.createStubInstance(StorageUtilsWrapper);
        agentIdCache = new AgentIdCache(storageUtilsWrapper);
    });

    afterEach(function () {
        sandbox.restore();
        storageUtilsWrapper = null;
        agentIdCache = null;
    });

    it('should load agentId from storage during construction', function () {
        const mockAgentId = '123456';
        storageUtilsWrapper.getFromLocalStorage.returns(mockAgentId);
        const cache = new AgentIdCache(storageUtilsWrapper);
        assert.equal(cache.get(), mockAgentId);
    });

    it('should save agentId to storage when set', function () {
        const mockAgentId = 'abcdef';
        agentIdCache.set(mockAgentId);
        assert.equal(agentIdCache.get(), mockAgentId);

    });

    it('should call _loadAgentIdFromStorage during construction', function () {
        const cacheSpy = sandbox.spy(AgentIdCache.prototype, '_loadAgentIdFromStorage');
        new AgentIdCache(storageUtilsWrapper);
        assert.isTrue(cacheSpy.calledOnce, 'loadAgentIdFromStorage was not called');
    });

    it('should throw error for invalid agentId in set', function () {
        assert.throws(() => {return agentIdCache.set()}, /Invalid agentId value/);
        assert.throws(() => {return agentIdCache.set(null)}, /Invalid agentId value/);
        assert.throws(() => {return agentIdCache.set(123)}, /Invalid agentId value/);
    });
});
