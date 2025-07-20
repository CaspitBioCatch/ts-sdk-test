import { assert } from 'chai';
import WupServerSessionState from '../../../src/worker/communication/WupServerSessionState';
import ConfigurationRepository from '../../../src/main/core/configuration/ConfigurationRepository';
import { WorkerCommand } from '../../../src/main/events/WorkerCommand';
import WorkerService from '../../../src/worker/WorkerService';
import WupServerClient from '../../../src/worker/communication/WupServerClient';
import WorkerCommunicator from '../../../src/main/technicalServices/WorkerCommunicator';
import LogServerClient from '../../../src/worker/communication/LogServerClient';
import MessageProcessor from '../../../src/worker/MessageProcessor';
import ServerCommunicator from "../../../src/worker/communication/ServerCommunicator";

describe('WorkerService tests:', function () {
    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
        this.mainComm = this.sandbox.createStubInstance(WorkerCommunicator);
        this.wupServerClientStub = this.sandbox.createStubInstance(WupServerClient);

        this.logServerClientStub = this.sandbox.createStubInstance(LogServerClient);
        this.configurationRepository = this.sandbox.createStubInstance(ConfigurationRepository);
        this.messageProcessor = this.sandbox.createStubInstance(MessageProcessor);
        this.logMessageProcessor = this.sandbox.createStubInstance(MessageProcessor);
        this.serverCommunicator = this.sandbox.createStubInstance(ServerCommunicator);
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    describe('start new session:', function () {
        it('should send a message with the new sid to the server', function () {
            const wupServerSessionState = new WupServerSessionState();
            wupServerSessionState.setCsid(0);
            wupServerSessionState.setRequestId(0);

            const data = {
                cid: "mock_cid",
                protocolType: "4",
                minifiedUri: true,
                serverAddress: 'wup.url',
                wupType: 'js',
                csid: '12387654',
                psid: '4444333',
                cdsnum: '132165',
                contextName : "mock_context",
                muid: 'AA-3423-423423',
            };

            // call the callback of to simulate message arrival
            this.mainComm.addMessageListener.withArgs(WorkerCommand.startNewSessionCommand).callsArgWith(1, data);

            const workerService = new WorkerService(this.mainComm, this.wupServerClientStub, this.logServerClientStub, this.configurationRepository,
                this.messageProcessor, this.logMessageProcessor, wupServerSessionState, this.serverCommunicator);

            workerService.start();

            assert.isTrue(this.mainComm.addMessageListener.callCount === 12, 'msg listener was not called 11 times');
            assert.isTrue(this.wupServerClientStub.startNewSession.calledOnce);
            assert.equal(this.wupServerClientStub.startNewSession.firstCall.args[0], data.cid);
            assert.equal(this.wupServerClientStub.startNewSession.firstCall.args[1], data.protocolType);
            assert.equal(this.wupServerClientStub.startNewSession.firstCall.args[2], data.minifiedUri);
            assert.equal(this.wupServerClientStub.startNewSession.firstCall.args[3], data.csid);
            assert.equal(this.wupServerClientStub.startNewSession.firstCall.args[4], data.psid);
            assert.equal(this.wupServerClientStub.startNewSession.firstCall.args[5], data.muid);
            assert.equal(this.wupServerClientStub.startNewSession.firstCall.args[6], data.contextName);
            assert.equal(this.wupServerClientStub.startNewSession.firstCall.args[7], data.serverAddress);
        });
    });

    describe('resume session:', function () {
        it('should send a message with the resumed sid to the server', function () {
            const wupServerSessionState = new WupServerSessionState();
            wupServerSessionState.setCsid(0);
            wupServerSessionState.setRequestId(0);

            const data = {
                serverAddress: 'wup.url',
                cid: "mock_cid",
                protocolType: "4",
                minifiedUri: true,
                wupType: 'js',
                csid: '12387654',
                psid: '44333',
                cdsnum: '132165',
                contextName : "mock_context",
                muid: 'AA-3423-423423',
            };

            // call the callback of to simulate message arrival
            this.mainComm.addMessageListener.withArgs(WorkerCommand.resumeSessionCommand).callsArgWith(1, data);

            const workerService = new WorkerService(this.mainComm, this.wupServerClientStub, this.logServerClientStub, this.configurationRepository,
                this.messageProcessor, this.logMessageProcessor, wupServerSessionState, this.serverCommunicator);
            workerService.start();

            assert.isTrue(this.mainComm.addMessageListener.callCount === 12, 'msg listener was not called 11 times');
            assert.isTrue(this.wupServerClientStub.resumeSession.calledOnce);
            assert.equal(this.wupServerClientStub.resumeSession.firstCall.args[0], data.cdsnum);
            assert.equal(this.wupServerClientStub.resumeSession.firstCall.args[1], data.cid);
            assert.equal(this.wupServerClientStub.resumeSession.firstCall.args[2], data.protocolType);
            assert.equal(this.wupServerClientStub.resumeSession.firstCall.args[3], data.minifiedUri);
            assert.equal(this.wupServerClientStub.resumeSession.firstCall.args[4], data.csid);
            assert.equal(this.wupServerClientStub.resumeSession.firstCall.args[5], data.psid);
            assert.equal(this.wupServerClientStub.resumeSession.firstCall.args[6], data.muid);
            assert.equal(this.wupServerClientStub.resumeSession.firstCall.args[7], data.contextName);
            assert.equal(this.wupServerClientStub.resumeSession.firstCall.args[8], data.serverAddress);
        });
    });

    describe('update session parameters: ', function () {
        it('should update context and send to server and succeed', function () {
            // call the callback of to simulate message arrival
            this.mainComm.addMessageListener.withArgs(WorkerCommand.changeContextCommand).callsArgWith(1, {
                msgType: WorkerCommand.changeContextCommand,
                contextName: 'login_1',
                updateParams: true,
            });
            const wupServerSessionState = new WupServerSessionState();
            wupServerSessionState.setCsid(1);
            const wupServerSessionStateSetContextNameSpy = this.sandbox.spy(wupServerSessionState, 'setContextName');
            const workerService = new WorkerService(this.mainComm, this.wupServerClientStub, this.logServerClientStub, this.configurationRepository, this.messageProcessor, this.logMessageProcessor,
                wupServerSessionState, this.serverCommunicator);
            workerService.start();

            assert.isTrue(this.mainComm.addMessageListener.callCount === 12, 'msg listener was not called 11 times');

            assert.equal('login_1', wupServerSessionStateSetContextNameSpy.firstCall.args[0], 'contextName is not as expected');
        });
    });

    describe('UpdateCsidCommand parameters: ', function () {
        it('should update csid and send to server and succeed', function () {
            // call the callback of to simulate message arrival
            this.mainComm.addMessageListener.withArgs(WorkerCommand.updateCsidCommand).callsArgWith(1, { csid: 'newCsid12' });
            const wupServerSessionState = new WupServerSessionState();
            wupServerSessionState.setCsid('newCsid12');
            const workerService = new WorkerService(this.mainComm, this.wupServerClientStub, this.logServerClientStub, this.configurationRepository, this.messageProcessor, this.logMessageProcessor,
                wupServerSessionState, this.serverCommunicator);
            workerService.start();

            assert.isTrue(this.mainComm.addMessageListener.callCount === 12, 'msg listener was not called 11 times');
            assert.equal('newCsid12', this.wupServerClientStub.updateCsid.getCall(0).args[0], 'csid isnt as expected');
        });
    });

    describe('UpdatePsidCommand parameters: ', function () {
        it('should update psid and send to server and succeed', function () {
            // call the callback of to simulate message arrival
            this.mainComm.addMessageListener.withArgs(WorkerCommand.updatePsidCommand).callsArgWith(1, { psid: 'newPsid12' });
            const wupServerSessionState = new WupServerSessionState();
            wupServerSessionState.setPsid('newPsid12');
            const workerService = new WorkerService(this.mainComm, this.wupServerClientStub, this.logServerClientStub, this.configurationRepository, this.messageProcessor, this.logMessageProcessor,
                wupServerSessionState, this.serverCommunicator);
            workerService.start();

            assert.isTrue(this.mainComm.addMessageListener.callCount === 12, 'msg listener was not called 11 times');

            assert.equal('newPsid12', this.wupServerClientStub.updatePsid.getCall(0).args[0], 'psid isnt as expected');
        });
    });

    describe('SendDataCommand:', function () {
        it('should send data to data processor', function () {
            const msgFromMain1 = {
                eventName: 'key_events',
                data: [1, 2, 3],
            };

            // call the callback of to simulate message arrival
            this.mainComm.addMessageListener.withArgs(WorkerCommand.sendDataCommand).callsArgWith(1, msgFromMain1);
            const wupServerSessionState = new WupServerSessionState();
            wupServerSessionState.setCsid('newCsid12');
            const workerService = new WorkerService(this.mainComm, this.wupServerClient, this.logServerClient, this.configurationRepository, this.messageProcessor, this.logMessageProcessor,
                wupServerSessionState, this.serverCommunicator);
            workerService.start();

            assert.isTrue(this.mainComm.addMessageListener.callCount === 12, 'msg listener was not called 11 times');

            assert.isTrue(this.messageProcessor.process.calledOnce, 'add not called');
            assert.deepEqual(this.messageProcessor.process.firstCall.args[0], msgFromMain1);
        });
    });

    describe('SendLogCommand:', function () {
        it('should send log to log processor', function () {
            const logFromMain = {
                data: {
                    msg: 'dummy message', url: 'tests', level: 'info', sn: 0,
                },
            };

            // call the callback of to simulate message arrival
            this.mainComm.addMessageListener.withArgs(WorkerCommand.sendLogCommand).callsArgWith(1, logFromMain);
            const wupServerSessionState = new WupServerSessionState();
            wupServerSessionState.setCsid('newCsid12');
            const workerService = new WorkerService(this.mainComm, this.wupServerClient, this.logServerClient, this.configurationRepository, this.messageProcessor, this.logMessageProcessor,
                wupServerSessionState, this.serverCommunicator);
            workerService.start();

            assert.isTrue(this.mainComm.addMessageListener.callCount === 12, 'msg listener was not called 11 times');

            assert.isTrue(this.logMessageProcessor.process.calledOnce, 'add not called');
            assert.deepEqual(this.logMessageProcessor.process.firstCall.args[0], logFromMain);
        });
    });

    describe('UpdateBrandCommand parameters: ', function () {
        it('should update brand', function () {
            this.mainComm.addMessageListener.withArgs(WorkerCommand.updateBrandCommand).callsArgWith(1, { brand: 'MyBrand123' });

            const wupServerSessionState = new WupServerSessionState();
            const workerService = new WorkerService(this.mainComm, this.wupServerClientStub, this.logServerClientStub, this.configurationRepository, this.messageProcessor, this.logMessageProcessor,
                wupServerSessionState, this.serverCommunicator);

            workerService.start();

            assert.isTrue(this.mainComm.addMessageListener.callCount === 12, 'msg listener was not called 11 times');

            assert.equal(this.wupServerClientStub.updateBrand.getCall(0).args[0], 'MyBrand123', 'brand is not as expected');
        });
    });

    describe('_setSessionStartupData: ', function () {
        let wupServerSessionState;
        let workerService;
        beforeEach(function(){
            wupServerSessionState = new WupServerSessionState();
            workerService = new WorkerService(this.mainComm, this.wupServerClientStub, this.logServerClientStub,
                this.configurationRepository, this.messageProcessor, this.logMessageProcessor,
                wupServerSessionState, this.serverCommunicator);
        });

        afterEach(function(){
            wupServerSessionState = null;
            workerService = null;
        });

        it('should set session agent type', function () {
            const agentType = 'primary';
            this.mainComm.addMessageListener.withArgs(WorkerCommand.setAgentTypeCommand).callsArgWith(1,
                { agentType });
            wupServerSessionState.setCsid('dummycsidfortesting');

            const wupServerSessionStateSetAgentTypeSpy = this.sandbox.spy(wupServerSessionState, 'setAgentType');
            workerService.start();

            assert.isTrue(this.mainComm.addMessageListener.callCount === 12, 'msg listener was not called 11 times');
            assert.equal(agentType, wupServerSessionStateSetAgentTypeSpy.firstCall.args[0], `expected agent type to be 'primary'`);
        });

        it('should set session agent id', function () {
            const agentId = 'stam-agent-id';
            this.mainComm.addMessageListener.withArgs(WorkerCommand.updateAgentIdCommand).callsArgWith(1,
                { agentId });

            const wupServerSessionStateSetAgentIdSpy = this.sandbox.spy(wupServerSessionState, 'setAgentId');
            workerService.start();

            assert.equal(agentId, wupServerSessionStateSetAgentIdSpy.firstCall.args[0], `expected agent id to be ${agentId}`);
        });
    });
});
