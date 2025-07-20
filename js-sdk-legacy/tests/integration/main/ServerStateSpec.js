import { assert } from 'chai';
import ConfigurationChanger from './ConfigurationChanger';
import { MessageBusEventType } from '../../../src/main/events/MessageBusEventType';
import { TestUtils } from '../../TestUtils';
import { WorkerCommand } from '../../../src/main/events/WorkerCommand';

describe('server state tests:', function () {
    it('when a new session starts new sts and std should be generated', async function () {
        // Change the threshold so reset will be called and not blocked...
        ConfigurationChanger.change(this.systemBootstrapper, {
            resetSessionApiThreshold: -1,
        });

        const originalSessionId = this.systemBootstrapper.getSessionService().sessionId;

        // Start a new session
        cdApi.startNewSession();

        // And wait for us to have the new session id
        await TestUtils.waitForNoAssertion(() => {
            // This verifies that session reset has started
            assert.notEqual(this.systemBootstrapper.getSessionService().sessionId, originalSessionId);
            // And this verifies that we have a new session id
            assert.exists(this.systemBootstrapper.getSessionService().sessionId);
        });

        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

        await TestUtils.waitForNoAssertion(() => {
            const firstState = this.systemBootstrapper.getServerStateMgr().getServerState(this.systemBootstrapper.getSessionService().sessionId);
            assert.isNotNull(firstState);
            assert.isDefined(firstState.sts, 'no sts in state');
            assert.isDefined(firstState.std, 'no std in state');
            assert.isDefined(firstState.ott, 'no ott in state');
        });

        cdApi.startNewSession();

        await TestUtils.waitForNoAssertion(() => {
            TestUtils.verifyMsgToWorker(serverWorkerSendAsync, WorkerCommand.startNewSessionCommand, function (data) {
                assert.notExists(data.cdsnum, 'cdsnum was included in a new session message');
                assert.equal(data.csid, null, 'csid was not with right value');
                assert.exists(data.muid, 'muid was not with right value');
                assert.exists(data.contextName, 'contextName was not with right value');
                assert.deepEqual(data.serverState, undefined, 'serverState was not with right value');
            });
        });
    });

    it('when a session is resumed, existing sts and std should be used', function (done) {
        // Change the threshold so reset will be called and not blocked...
        ConfigurationChanger.change(this.systemBootstrapper, {
            resetSessionApiThreshold: -1,
        });

        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
        const sessionService = this.systemBootstrapper.getSessionService();
        const messageBus = this.systemBootstrapper.getMessageBus();

        const onNewSessionStartedEventCallback = () => {
            // Make sure we receive the sid from the server
            assert.isNotNull(sessionService.sessionId, 'session id is null');

            const firstState = this.systemBootstrapper.getServerStateMgr().getServerState(sessionService.sessionId);
            const originalSessionId = sessionService.sessionId;

            assert.exists(firstState);
            assert.exists(firstState.sts, 'no sts in state');
            assert.exists(firstState.std, 'no std in state');
            assert.isDefined(firstState.ott, 'no ott in state');

            serverWorkerSendAsync.resetHistory();

            sessionService.resumeOrStartSession();

            TestUtils.verifyMsgToWorker(serverWorkerSendAsync, WorkerCommand.resumeSessionCommand, function (data) {
                assert.exists(data.cdsnum, 'cdsnum was not with right value');
                assert.equal(data.cdsnum, originalSessionId, 'sid has changed but shouldnt have');
                assert.isNull(data.csid, 'csid was not with right value');
                assert.exists(data.muid, 'muid was not with right value');
                assert.exists(data.contextName, 'contextName was not with right value');
                assert.exists(data.serverState);

                messageBus.unsubscribe(MessageBusEventType.NewSessionStartedEvent, onNewSessionStartedEventCallback);

                done();
            });
        };

        // Subscribe for the bus message which notifies on the start of a new session. This should occur because we call the reset session api
        messageBus.subscribe(MessageBusEventType.NewSessionStartedEvent, onNewSessionStartedEventCallback);

        // Trigger a reset session
        cdApi.startNewSession();
    });
});
