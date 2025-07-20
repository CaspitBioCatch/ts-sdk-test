import ServerStateMgr from '../../../../../src/main/core/state/ServerStateMgr';
import { WorkerEvent } from '../../../../../src/main/events/WorkerEvent';
import { MockObjects } from '../../../mocks/mockObjects';
import WorkerCommunicator from '../../../../../src/main/technicalServices/WorkerCommunicator';
import AgentIdService from "../../../../../src/main/core/session/AgentIdService";
import sinon from "sinon";

describe('ServerStateMgr tests:', function () {
    const assert = chai.assert;
    let sandbox;
    let workerComm;
    let cdUtils;
    let storageUtils;
    let agentIdService;

    beforeEach(function () {
        sandbox = sinon.createSandbox();
        workerComm = sinon.createStubInstance(WorkerCommunicator);
        cdUtils = sinon.stub(MockObjects.cdUtils);
        storageUtils = sinon.stub(cdUtils.StorageUtils);
        agentIdService = sinon.createStubInstance(AgentIdService);
    });

    afterEach(function () {
        sandbox.restore();
        workerComm = null;
        cdUtils = null;
        storageUtils = null;
        agentIdService = null;
    });

    describe('CTOR:', function () {
        it('should start will null server state', function () {
            const stateMgr = new ServerStateMgr(workerComm, cdUtils, agentIdService);

            assert.isNull(stateMgr._currState, 'server state is not null');
            assert.isTrue(workerComm.addMessageListener.calledWith(WorkerEvent.ServerStateUpdatedEvent), 'CTOR did not registered on updates from worker');
        });
    });

    describe('getServerState: ', function () {
        context('when does not exist in local storage', function () {
            context('and no previous state', function () {
                it('should return null or undefined', function () {
                    const stateMgr = new ServerStateMgr(workerComm, cdUtils, agentIdService);

                    storageUtils.getFromLocalStorage.returns(undefined);

                    const state = stateMgr.getServerState('dummy sid');

                    assert.isUndefined(state, 'state is not empty');
                });
            });
            context('and previous state exist', function () {
                it('should return previous state', function () {
                    const workerComm = sinon.createStubInstance(WorkerCommunicator);
                    const cdUtils = sinon.stub(MockObjects.cdUtils);
                    const storageUtils = sinon.stub(cdUtils.StorageUtils);

                    const stateMgr = new ServerStateMgr(workerComm, cdUtils);
                    stateMgr._currState = { sts: 'mySts', std: 'myStd', sid: 'mySid', ott: 'myOtt' };

                    storageUtils.getFromLocalStorage.returns(undefined);

                    const state = stateMgr.getServerState('mySid');

                    assert.isNotNull(state);
                    assert.equal('mySts', state.sts, 'Sts was changed');
                    assert.equal('myStd', state.std, 'Std was changed');
                    assert.equal('mySid', state.sid, 'Sid was changed');
                    assert.equal('myOtt', state.ott, 'Ott was changed');
                });
            });
        });

        it('when expected state sid is not equal to actual', function () {
            const stateMgr = new ServerStateMgr(workerComm, cdUtils, agentIdService);

            storageUtils.getFromLocalStorage.returns({ sts: 'sts', std: 'std', sid: 'theSid', ott: 'ott' });

            const state = stateMgr.getServerState('not the sid');

            assert.isNull(state, 'state is not empty');
        });

        it('when sid is invalid an error is thrown', function () {
            cdUtils.isUndefinedNull.returns(true);

            const stateMgr = new ServerStateMgr(workerComm, cdUtils, agentIdService);

            let thrownError = null;
            try {
                stateMgr.getServerState(undefined);
            } catch (e) {
                thrownError = e;
            }

            assert.exists(thrownError);
        });
    });

    describe('_updateServerState:', function () {
        it('should save the state to local storage and update current state', function () {

            const stateMgr = new ServerStateMgr(workerComm, cdUtils, agentIdService);

            stateMgr._updateServerState({ sts: 'mySts', std: 'myStd', sid: 'mySid', ott: 'myOtt' });

            const state = stateMgr.getServerState('mySid');

            assert.isNotNull(state);
            assert.equal('mySts', state.sts, 'sts was not updated');
            assert.equal('myStd', state.std, 'std was not updated');
            assert.equal('mySid', state.sid, 'sid was not updated');
            assert.equal('myOtt', state.ott, 'ott was not updated');
            assert.isTrue(storageUtils.saveToLocalStorage.calledWith('cdSrvrState', state), 'saveToLocalStorage was not called');
        });
    });

    describe('onSessionIdChange', function () {
        it('should clear the current state', function () {

            const stateMgr = new ServerStateMgr(workerComm, cdUtils, agentIdService);

            stateMgr.onSessionIdChange();

            assert.isUndefined(stateMgr.getServerState('stam-sid'));
            assert.isTrue(storageUtils.removeFromLocalStorage.calledWith('cdSrvrState'), 'saveToLocalStorage was not called');
        });
    });

    it('should call _onStateUpdateFromWorker when workerCommunication calls the event', function () {

        workerComm.addMessageListener.callsArgWith(1, { sts: 'mySts', std: 'myStd', sid: 'mySid', ott: 'myOtt' });

        const stateMgr = new ServerStateMgr(workerComm, cdUtils, agentIdService);

        assert.isNotNull(stateMgr.getServerState('mySid'));
    });

    it('should call AgentIdService set function', function () {
        agentIdService.set = sandbox.spy();
        const stateMgr = new ServerStateMgr(workerComm, cdUtils, agentIdService);
        stateMgr._onNewAgentIdFromWorker('stam-agent-id');

        assert.isTrue(agentIdService.set.calledOnce, 'AgentIdService set function was not called');
        assert.isTrue(agentIdService.set.calledWith('stam-agent-id'), 'AgentIdService set function was not called with the correct agent id');
    })


});
