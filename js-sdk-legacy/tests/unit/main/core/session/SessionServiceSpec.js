import ConfigurationService from '../../../../../src/main/core/configuration/ConfigurationService';
import ConfigurationRepository from '../../../../../src/main/core/configuration/ConfigurationRepository';
import PsidCache from '../../../../../src/main/core/session/PsidCache';
import CsidCache from '../../../../../src/main/core/session/CsidCache';
import SessionService from '../../../../../src/main/core/session/SessionService';
import CsidService from '../../../../../src/main/core/session/CsidService';
import CDUtils from '../../../../../src/main/technicalServices/CDUtils';
import {MockObjects} from '../../../mocks/mockObjects';
import {WorkerCommand} from '../../../../../src/main/events/WorkerCommand';
import {WorkerEvent} from '../../../../../src/main/events/WorkerEvent';
import {MessageBusEventType} from '../../../../../src/main/events/MessageBusEventType';
import SidRepository from '../../../../../src/main/core/session/SidRepository';
import SiteMapper from '../../../../../src/main/technicalServices/SiteMapper';
import ServerStateMgr from '../../../../../src/main/core/state/ServerStateMgr';
import CustomerApiBridge from '../../../../../src/main/api/CustomerApiBridge';
import ContextMgr from '../../../../../src/main/core/context/ContextMgr';
import WorkerCommunicator from '../../../../../src/main/technicalServices/WorkerCommunicator';
import MessageBus from '../../../../../src/main/technicalServices/MessageBus';
import BrandService from '../../../../../src/main/core/branding/BrandService';
import AgentIdService from "../../../../../src/main/core/session/AgentIdService";
import {AgentType} from '../../../../../src/main/contract/AgentType';
import Log from "../../../../../src/main/technicalServices/log/Logger";
import sinon from 'sinon';
import CidCache from '../../../../../src/main/core/session/CidCache';
import ServerUrlCache from '../../../../../src/main/core/session/ServerUrlCache';
import ProtocolTypeCache from '../../../../../src/main/core/session/ProtocolTypeCache';

describe('SessionService tests:', function () {
    const assert = chai.assert;

    const mockBaseServerUrl = 'http://mock.server.url';
    const mockCid = 'mock_cid';
    const mockProtocolType = 'mock_protocol_type';
    const mockContextName = 'mock_contextname';

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();

        this.messageBus = this.sandbox.createStubInstance(MessageBus);

        this.configurationServiceStub = this.sandbox.stub(new ConfigurationService(CDUtils, null, this.messageBus, null));
        this.configurationRepository = this.sandbox.stub(new ConfigurationRepository());

        this.csidService = this.sandbox.createStubInstance(CsidService);
        this.csidCacheStub = this.sandbox.createStubInstance(CsidCache);
        this.csidCacheStub.get.returns('csid');
        this.psidCacheStub = this.sandbox.createStubInstance(PsidCache);
        this.psidCacheStub.get.returns('psid');
        this.agentIdServiceStub = this.sandbox.createStubInstance(AgentIdService);
        this.serverUrlCacheStub = this.sandbox.createStubInstance(ServerUrlCache);
        this.cidCacheStub = this.sandbox.createStubInstance(CidCache);
        this.cidCacheStub.get.returns(mockCid);
        this.protocolTypeCacheStub = this.sandbox.createStubInstance(ProtocolTypeCache);
        this.protocolTypeCacheStub.get.returns(mockProtocolType);

        this.workerComm = this.sandbox.createStubInstance(WorkerCommunicator);
        this.ctxtMgr = this.sandbox.createStubInstance(ContextMgr);
        this.ctxtMgr.getContextName.returns(mockContextName);
        this.serverStateMgr = this.sandbox.createStubInstance(ServerStateMgr);
        this.serverStateMgr.getServerState.returns({});

        this.brandServiceStub = this.sandbox.createStubInstance(BrandService);
        this.brandServiceStub.update.returns(null);

        this.siteMapper = this.sandbox.createStubInstance(SiteMapper);

        this.serverUrlCacheStub.get.returns(mockBaseServerUrl);
        this.configurationRepository.get.withArgs('resetSessionApiThreshold').returns(0.00001);
        this.configurationRepository.get.withArgs('enableStartupCustomerSessionId').returns(false);

        this.cdUtils = MockObjects.cdUtils;
        this.domUtils = MockObjects.domUtils;
        this.guid1 = this.cdUtils.generateUUID();
        this.guid2 = this.cdUtils.generateUUID();

        this.sidRepositoryStub = this.sandbox.createStubInstance(SidRepository);

        this.onDocumentBody = this.sandbox.stub(this.domUtils, 'onDocumentBody');
        this.onDocumentBody.callsArg(1);
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    describe('serverAddress is null', function () {
        let sidMgr
        beforeEach(function () {
            this.serverUrlCacheStub.get.returns(null);
            sidMgr = new SessionService(this.messageBus, this.configurationServiceStub, this.configurationRepository, this.cdUtils, this.domUtils,
                this.workerComm, this.ctxtMgr, {muid: 'AA-12'}, this.serverStateMgr, this.siteMapper, this.sidRepositoryStub,
              this.serverUrlCacheStub, this.cidCacheStub, this.protocolTypeCacheStub, false, this.csidService,
                this.csidCacheStub, this.psidCacheStub, this.brandServiceStub, this.agentIdServiceStub);
        });
        afterEach(function () {
            this.serverUrlCacheStub.get.returns(mockBaseServerUrl);
            sidMgr = null;
        });

        it('onResumedSession: should not send data to worker when serverAddress is null', function () {
            sidMgr._onResumedSession();

            assert.isTrue(this.configurationServiceStub.updateLogUrlToWorker.notCalled, 'updateLogUrlToWorker should not be called');
            assert.isTrue(this.serverStateMgr.getServerState.notCalled, 'getServerState should not be called');
        });

        it('sendCsidToServer: should not send csid to server when server address is null', function () {
            sidMgr._sendCsidToServer();
            assert.isTrue(this.configurationServiceStub.updateLogUrlToWorker.notCalled, 'updateLogUrlToWorker should not be called');
        });
        it('onStartedNewSession: should not send data to worker when serverAddress is null', function () {
            sidMgr._onStartedNewSession();
            assert.isTrue(this.configurationServiceStub.updateLogUrlToWorker.notCalled, 'updateLogUrlToWorker should not be called');
        });
    });


    it('should create a sessionService module', function () {
        const sidMgr = new SessionService(this.messageBus, this.configurationServiceStub, this.configurationRepository, this.cdUtils, this.domUtils,
            this.workerComm, this.ctxtMgr, {muid: 'AA-12'}, this.serverStateMgr, this.siteMapper, this.sidRepositoryStub,
          this.serverUrlCacheStub, this.cidCacheStub, this.protocolTypeCacheStub, false,
          this.csidService,
            this.csidCacheStub, this.psidCacheStub, this.brandServiceStub, this.agentIdServiceStub);

        assert.isTrue(typeof sidMgr !== 'undefined' && sidMgr != null);
        assert.isTrue(sidMgr.sessionId == null, 'sessionId should be null');
        assert.isTrue(this.siteMapper.updateObserver.calledOnce, 'siteMapper updateObserver was not called');
    });

    describe('resumeOrStartSession tests:', function () {
        it('should start a new session when all cookies are null (timeout)', function () {
            const sidMgr = new SessionService(this.messageBus, this.configurationServiceStub, this.configurationRepository, this.cdUtils, this.domUtils,
                this.workerComm, this.ctxtMgr, {muid: 'AA-12'}, this.serverStateMgr, this.siteMapper, this.sidRepositoryStub,
              this.serverUrlCacheStub, this.cidCacheStub, this.protocolTypeCacheStub, false,
              this.csidService,
                this.csidCacheStub, this.psidCacheStub, this.brandServiceStub, this.agentIdServiceStub);

            this.csidService.get.callsArgWith(0, this.guid2);
            sidMgr.resumeOrStartSession();

            assert.isNull(sidMgr.sessionId, 'sessionId should be null');

            const expectedNewSessionMessage = {
                serverAddress: mockBaseServerUrl,
                csid: 'csid',
                cid: mockCid,
                protocolType: mockProtocolType,
                minifiedUri: false,
                psid: 'psid',
                muid: 'AA-12',
                contextName: mockContextName,
            };

            assert.isTrue(this.csidCacheStub.get.called, 'csidCache was not called');
            assert.isTrue(this.psidCacheStub.get.called, 'psidCache was not called');
            assert.isTrue(this.workerComm.sendAsync.calledTwice, 'WorkerCommunicator was not called once');
            assert.equal(this.workerComm.sendAsync.secondCall.args[0], WorkerCommand.startNewSessionCommand, 'WorkerCommunicator sendAsync first call args are invalid');
            assert.deepEqual(this.workerComm.sendAsync.secondCall.args[1], expectedNewSessionMessage, 'WorkerCommunicator sendAsync first call args are invalid');
        });

        it('should resume session with existing sessionId when all cookies exist', async function () {
            const sidMgr = new SessionService(this.messageBus, this.configurationServiceStub, this.configurationRepository, this.cdUtils, this.domUtils,
                this.workerComm, this.ctxtMgr, {muid: 'AA-12'}, this.serverStateMgr, this.siteMapper, this.sidRepositoryStub,
              this.serverUrlCacheStub, this.cidCacheStub, this.protocolTypeCacheStub, false,this.csidService,
                this.csidCacheStub, this.psidCacheStub, this.brandServiceStub, this.agentIdServiceStub);
            sidMgr._agentType = AgentType.PRIMARY;
            Log.debug = this.sandbox.spy();
            const temp = Date.now() + '-' + this.guid1;
            this.sidRepositoryStub.get.returns(temp);
            this.csidService.get.callsArgWith(0, temp);

            sidMgr.resumeOrStartSession();

            assert.isTrue(sidMgr.sessionId.indexOf(this.guid1) >= 0, 'sessionId has changed');
            assert.isTrue(this.sidRepositoryStub.set.getCall(0).args[0].indexOf(this.guid1) >= 0, 'cdSNum data should not be different');
            assert.isTrue(Log.debug.called, 'Log.debug was not called');

            const expectedNewSessionMessage = {

                serverAddress: mockBaseServerUrl,
                csid: 'csid',
                cid: mockCid,
                protocolType: mockProtocolType,
                minifiedUri: false,
                psid: 'psid',
                cdsnum: sidMgr.sessionId,
                muid: 'AA-12',
                contextName: this.ctxtMgr.getContextName(),
                // notify the server for change by customer
                serverState: this.serverStateMgr.getServerState(sidMgr.sessionId),
            };

            assert.isTrue(this.csidCacheStub.get.called, 'csidCache was not called');
            assert.isTrue(this.psidCacheStub.get.called, 'psidCache was not called');
            assert.isTrue(this.workerComm.sendAsync.calledThrice, 'WorkerCommunicator was not called twice');
            assert.equal(this.workerComm.sendAsync.secondCall.args[0], WorkerCommand.resumeSessionCommand, 'WorkerCommunicator sendAsync first call args are invalid');
            assert.deepEqual(this.workerComm.sendAsync.secondCall.args[1], expectedNewSessionMessage, 'WorkerCommunicator sendAsync first call args are invalid');
            assert.equal(this.workerComm.sendAsync.getCalls()[2].args[0], WorkerCommand.updateCsidCommand, 'WorkerCommunicator sendAsync second call args are invalid');
        });


        it('should resume brand with existing brand when all cookies exist', function () {
            const sidMgr = new SessionService(this.messageBus, this.configurationServiceStub, this.configurationRepository, this.cdUtils, this.domUtils,
                this.workerComm, this.ctxtMgr, {muid: 'AA-12'}, this.serverStateMgr, this.siteMapper, this.sidRepositoryStub,
              this.serverUrlCacheStub, this.cidCacheStub, this.protocolTypeCacheStub, false,
              this.csidService,
                this.csidCacheStub, this.psidCacheStub, this.brandServiceStub, this.agentIdServiceStub);
            const temp = Date.now() + '-' + this.guid1;
            this.sidRepositoryStub.get.returns(temp);

            sidMgr.resumeOrStartSession();
            assert.isTrue(sidMgr.sessionId.indexOf(this.guid1) >= 0, 'sessionId has changed');
            assert.isTrue(this.brandServiceStub.update.called, 'BrandService update was not called');
        });

        it('should resume session, csid gets value after time', function () {
            this.custApi = this.sandbox.createStubInstance(CustomerApiBridge);
            this.custApi.getCustomerSessionID.callsArgWith(0, '');
            this.custApi.isApiAvailable.returns(true);

            const sidMgr = new SessionService(this.messageBus, this.configurationServiceStub, this.configurationRepository, this.cdUtils, this.domUtils,
                this.workerComm, this.ctxtMgr, {muid: 'AA-12'}, this.serverStateMgr, this.siteMapper, this.sidRepositoryStub,
              this.serverUrlCacheStub, this.cidCacheStub, this.protocolTypeCacheStub, false,
                new CsidService(this.custApi, this.csidCacheStub, this.workerComm),
                this.csidCacheStub, this.psidCacheStub, this.brandServiceStub, this.agentIdServiceStub);
            this.clock = this.sandbox.useFakeTimers();
            this.sidRepositoryStub.get.returns(Date.now() + '-' + this.guid1);

            sidMgr.resumeOrStartSession();

            this.custApi.getCustomerSessionID.callsArgWith(0, this.guid2);

            this.clock.tick(250);
            assert.isTrue(sidMgr.sessionId.indexOf(this.guid1) >= 0, 'sessionId should not changed');

            assert.isTrue(this.csidCacheStub.get.called, 'csidCache was not called');
            assert.isTrue(this.psidCacheStub.get.called, 'psidCache was not called');
            assert.isTrue(this.workerComm.sendAsync.calledThrice, 'sendAsync was not called thrice');
            assert.isTrue(this.sidRepositoryStub.set.calledWith(this.sandbox.match(this.guid1)), 'cdSNum data should be the same');
            this.clock.restore();
        });

        it('should resume session, csid gets value only in the next page', function () {
            const sidMgr = new SessionService(this.messageBus, this.configurationServiceStub, this.configurationRepository, this.cdUtils, this.domUtils,
                this.workerComm, this.ctxtMgr, {muid: 'AA-12'}, this.serverStateMgr, this.siteMapper, this.sidRepositoryStub,
              this.serverUrlCacheStub, this.cidCacheStub, this.protocolTypeCacheStub, false,
              this.csidService,
                this.csidCacheStub, this.psidCacheStub, this.brandServiceStub, this.agentIdServiceStub);
            this.sidRepositoryStub.get.returns(Date.now() + '-' + this.guid1);

            sidMgr.resumeOrStartSession();
            // simulate pass to new page by updating the csid and creating a new SessionService instance
            this.csidService.get.callsArgWith(0, this.guid2);
            const nextPageSidMgr = new SessionService(this.messageBus, this.configurationServiceStub, this.configurationRepository, this.cdUtils, this.domUtils,
                this.workerComm, this.ctxtMgr, {muid: 'AA-12'}, this.serverStateMgr, this.siteMapper, this.sidRepositoryStub,
              this.serverUrlCacheStub, this.cidCacheStub, this.protocolTypeCacheStub, false,
              this.csidService,
                this.csidCacheStub, this.psidCacheStub, this.brandServiceStub, this.agentIdServiceStub);

            nextPageSidMgr.resumeOrStartSession();
            assert.isTrue(nextPageSidMgr.sessionId.indexOf(this.guid1) >= 0, 'sessionId should not changed');

            assert.isTrue(this.csidCacheStub.get.called, 'csidCache was not called');
            assert.isTrue(this.psidCacheStub.get.called, 'psidCache was not called');
            // in the first page there was no csid so it was called only once
            assert.isTrue(this.sidRepositoryStub.set.calledWith(this.sandbox.match(this.guid1)), 'cdSNum data should be the same');
        });

        it('should reset customer session id if session is started', function () {
            this.configurationRepository.get.withArgs('resetSessionApiThreshold').returns(20000);

            const sidMgr = new SessionService(this.messageBus, this.configurationServiceStub, this.configurationRepository, this.cdUtils, this.domUtils,
                this.workerComm, this.ctxtMgr, {muid: 'AA-13'}, this.serverStateMgr, this.siteMapper, this.sidRepositoryStub,
              this.serverUrlCacheStub, this.cidCacheStub, this.protocolTypeCacheStub, false,
              this.csidService,
                this.csidCacheStub, this.psidCacheStub, this.brandServiceStub, this.agentIdServiceStub);
            this.sidRepositoryStub.get.returns(null);

            sidMgr.resumeOrStartSession();

            // Check that we reset the csid and psid when the session is reset
            assert.isTrue(this.csidCacheStub.set.calledOnce, 'csidCache set was not called once');
            assert.equal(this.csidCacheStub.set.firstCall.args[0], null);
            assert.isTrue(this.psidCacheStub.set.calledOnce, 'psidCache set was not called once');
            assert.equal(this.psidCacheStub.set.firstCall.args[0], null);

            assert.isTrue(this.csidCacheStub.get.called, 'csidCache was not called');
            assert.isTrue(this.psidCacheStub.get.called, 'psidCache was not called');
            assert.equal(this.workerComm.sendAsync.secondCall.args[1].csid, this.csidCacheStub.get());
            assert.isNull(sidMgr.sessionId, 'sessionId should be null');
        });

        it('should not reset customer session id if session is resumed', function () {
            this.configurationRepository.get.withArgs('resetSessionApiThreshold').returns(20000);

            const sidMgr = new SessionService(this.messageBus, this.configurationServiceStub, this.configurationRepository, this.cdUtils, this.domUtils,
                this.workerComm, this.ctxtMgr, {muid: 'AA-13'}, this.serverStateMgr, this.siteMapper, this.sidRepositoryStub,
              this.serverUrlCacheStub, this.cidCacheStub, this.protocolTypeCacheStub, false,
              this.csidService,
                this.csidCacheStub, this.psidCacheStub, this.brandServiceStub, this.agentIdServiceStub);
            const currSid = Date.now() + '-' + this.guid1;
            this.sidRepositoryStub.get.returns(currSid);
            sidMgr.sessionId = currSid;

            sidMgr.resumeOrStartSession();

            assert.equal(this.workerComm.sendAsync.secondCall.args[1].csid, this.csidCacheStub.get());
            assert.isNotNull(sidMgr.sessionId, 'sessionId should not be null');
            assert.isNotNull(this.sidRepositoryStub.set.getCall(0).args[0], 'setSid arg should not be null');
        });

        it('should reset server state if a new session is started', function () {
            this.configurationRepository.get.withArgs('resetSessionApiThreshold').returns(20000);

            const sidMgr = new SessionService(this.messageBus, this.configurationServiceStub, this.configurationRepository, this.cdUtils, this.domUtils,
                this.workerComm, this.ctxtMgr, {muid: 'AA-13'}, this.serverStateMgr, this.siteMapper, this.sidRepositoryStub,
              this.serverUrlCacheStub, this.cidCacheStub, this.protocolTypeCacheStub, false,
              this.csidService,
                this.csidCacheStub, this.psidCacheStub, this.brandServiceStub, this.agentIdServiceStub);
            this.sidRepositoryStub.get.returns(null);

            sidMgr.resumeOrStartSession();

            assert.isTrue(this.serverStateMgr.onSessionIdChange.calledOnce, 'Server state was not reset');
            assert.isNull(sidMgr.sessionId, 'sessionId should be null');
        });
    });

    describe('_onNewSessionStartedEvent tests', function () {
        it('should update sessionId once a new session started is received from server', function () {
            const sidMgr = new SessionService(this.messageBus, this.configurationServiceStub, this.configurationRepository, this.cdUtils, this.domUtils,
              this.workerComm, this.ctxtMgr, {muid: 'AA-13'}, this.serverStateMgr, this.siteMapper, this.sidRepositoryStub,
              this.serverUrlCacheStub, this.cidCacheStub, this.protocolTypeCacheStub, false,
              this.csidService,
              this.csidCacheStub, this.psidCacheStub, this.brandServiceStub, this.agentIdServiceStub);

            this.workerComm.sendAsync(WorkerEvent.NewSessionStartedEvent, 'newSID_FRom_SeRver');

            sidMgr._onNewSessionStartedEvent('newSID_FRom_SeRver');
            assert.equal(sidMgr.sessionId, 'newSID_FRom_SeRver');
            assert.isTrue(this.messageBus.publish.calledOnce, 'message bus publish was not called once');
            assert.equal(this.messageBus.publish.firstCall.args[0], MessageBusEventType.NewSessionStartedEvent, 'message bus publish first arg is invalid');
        });

        it('when starting a new session, csid is updated only once a new session id is received from server', function () {
            const sidMgr = new SessionService(this.messageBus, this.configurationServiceStub, this.configurationRepository, this.cdUtils, this.domUtils,
              this.workerComm, this.ctxtMgr, {muid: 'AA-12'}, this.serverStateMgr, this.siteMapper, this.sidRepositoryStub,
              this.serverUrlCacheStub, this.cidCacheStub, this.protocolTypeCacheStub, false,
              this.csidService,
              this.csidCacheStub, this.psidCacheStub, this.brandServiceStub, this.agentIdServiceStub);

            this.csidService.get.callsArgWith(0, this.guid2);
            sidMgr.resumeOrStartSession();

            assert.isNull(sidMgr.sessionId, 'sessionId should be null');

            const expectedNewSessionMessage = {
                serverAddress: mockBaseServerUrl,
                csid: 'csid',
                cid: mockCid,
                protocolType: mockProtocolType,
                minifiedUri: false,
                psid: 'psid',
                muid: 'AA-12',
                contextName: mockContextName,
            };

            assert.isTrue(this.csidCacheStub.get.called, 'csidCache was not called');
            assert.isTrue(this.psidCacheStub.get.called, 'psidCache was not called');
            assert.isTrue(this.workerComm.sendAsync.calledTwice, 'WorkerCommunicator was not called once');
            assert.equal(this.workerComm.sendAsync.secondCall.args[0], WorkerCommand.startNewSessionCommand, 'WorkerCommunicator sendAsync first call args are invalid');
            assert.deepEqual(this.workerComm.sendAsync.secondCall.args[1], expectedNewSessionMessage, 'WorkerCommunicator sendAsync first call args are invalid');

            this.workerComm.sendAsync.resetHistory();

            // Received a message from worker that a new session has started
            sidMgr._onNewSessionStartedEvent('NEW_SID');

            //assert.isTrue(this.workerComm.sendAsync.calledOnce, `WorkerCommunicator was not called once. It was called ${this.workerComm.sendAsync.callCount}`);
            //assert.equal(this.workerComm.sendAsync.firstCall.args[0], WorkerCommand.updateCsidCommand, 'WorkerCommunicator sendAsync first call args are invalid');
        });
    });

    describe('onResetSession tests:', function () {
        it('should start a new session, customer reset page event, csid not changed', function () {
            const sidMgr = new SessionService(this.messageBus, this.configurationServiceStub, this.configurationRepository, this.cdUtils, this.domUtils,
              this.workerComm, this.ctxtMgr, {muid: 'AA-12'}, this.serverStateMgr, this.siteMapper, this.sidRepositoryStub,
              this.serverUrlCacheStub, this.cidCacheStub, this.protocolTypeCacheStub, false,
              this.csidService,
              this.csidCacheStub, this.psidCacheStub, this.brandServiceStub, this.agentIdServiceStub);

            const temp = (Date.now() - 30000) + '-' + this.guid1;
            sidMgr.sessionId = temp;

            this.sidRepositoryStub.get.returns(temp);
            this.csidService.get.callsArgWith(0, temp);

            sidMgr.onResetSession({type: 'ResetSession', resetReason: 'MyTest'});

            assert.isTrue(this.csidCacheStub.get.called, 'csidCache was not called');
            assert.isTrue(this.psidCacheStub.get.called, 'psidCache was not called');
            assert.isNull(sidMgr.sessionId, 'sessionId is not null');
            assert.isTrue(this.workerComm.sendAsync.calledTwice);
            assert.isTrue(this.workerComm.sendAsync.calledWith(WorkerCommand.startNewSessionCommand));
        });

        it('should start a new session when customer requests a reset', function () {
            this.configurationRepository.get.withArgs('resetSessionApiThreshold').returns(20000);

            this.clock = this.sandbox.useFakeTimers();

            const sidMgr = new SessionService(this.messageBus, this.configurationServiceStub, this.configurationRepository, this.cdUtils, this.domUtils,
              this.workerComm, this.ctxtMgr, {muid: 'AA-12'}, this.serverStateMgr, this.siteMapper, this.sidRepositoryStub,
              this.serverUrlCacheStub, this.cidCacheStub, this.protocolTypeCacheStub, false,
              this.csidService,
              this.csidCacheStub, this.psidCacheStub, this.brandServiceStub, this.agentIdServiceStub);

            const currSid = Date.now() + '-' + this.guid1;
            this.sidRepositoryStub.get.returns(currSid);
            sidMgr.sessionId = currSid;

            this.clock.tick(30000);
            sidMgr.onResetSession({type: 'ResetSession', resetReason: 'MyTest'});

            assert.isNull(sidMgr.sessionId, 'sessionId is not null');

            const expectedNewSessionMessage = {
                serverAddress: mockBaseServerUrl,
                csid: 'csid',
                cid: mockCid,
                protocolType: mockProtocolType,
                minifiedUri: false,
                psid: 'psid',
                muid: 'AA-12',
                contextName: mockContextName,
            };

            // Check that we reset the csid and psid when the session is reset
            assert.isTrue(this.csidCacheStub.set.calledOnce, 'csidCache set was not called once');
            assert.equal(this.csidCacheStub.set.firstCall.args[0], null);
            assert.isTrue(this.psidCacheStub.set.calledOnce, 'psidCache set was not called once');
            assert.equal(this.psidCacheStub.set.firstCall.args[0], null);

            assert.isTrue(this.csidCacheStub.get.called, 'csidCache get was not called');
            assert.isTrue(this.psidCacheStub.get.called, 'psidCache get was not called');
            assert.isTrue(this.workerComm.sendAsync.calledTwice, 'WorkerCommunicator was not called once');
            assert.equal(this.workerComm.sendAsync.secondCall.args[0], WorkerCommand.startNewSessionCommand, 'WorkerCommunicator sendAsync first call args are invalid');
            assert.deepEqual(this.workerComm.sendAsync.secondCall.args[1], expectedNewSessionMessage, 'WorkerCommunicator sendAsync first call args are invalid');

            this.clock.restore();
        });

        it('should not reset session when startNewSession called in less than "resetSessionApiThreshold" time', function () {
            this.configurationRepository.get.withArgs('resetSessionApiThreshold').returns(20000);
            this.csidService.get.callsArgWith(0, this.guid2);

            const sidMgr = new SessionService(this.messageBus, this.configurationServiceStub, this.configurationRepository, this.cdUtils, this.domUtils,
              this.workerComm, this.ctxtMgr, {muid: 'AA-12'}, this.serverStateMgr, this.siteMapper, this.sidRepositoryStub,
              this.serverUrlCacheStub, this.cidCacheStub, this.protocolTypeCacheStub, false,
              this.csidService,
              this.csidCacheStub, this.psidCacheStub, this.brandServiceStub, this.agentIdServiceStub);

            const currSid = Date.now() + '-' + this.guid1;
            this.sidRepositoryStub.get.returns(currSid);
            sidMgr.sessionId = currSid;

            sidMgr.resumeOrStartSession();

            this.workerComm.sendAsync.resetHistory();
            sidMgr.onResetSession({type: 'ResetSession', resetReason: 'MyTest'});
            assert.isTrue(this.csidCacheStub.set.calledOnce, 'csidCache set was not called once');
            assert.equal(this.csidCacheStub.set.firstCall.args[0], null);
            assert.isTrue(this.workerComm.sendAsync.calledOnce, 'WorkerCommunicator was not called once');
            assert.equal(this.workerComm.sendAsync.firstCall.args[0], WorkerCommand.startNewSessionCommand, 'WorkerCommunicator first call is invalid');

            sidMgr._onNewSessionStartedEvent('NEW_SID_LALA');
            this.workerComm.sendAsync.resetHistory();
            this.csidCacheStub.set.resetHistory();
            sidMgr.onResetSession({type: 'ResetSession', resetReason: 'MyTest'});

            assert.isTrue(this.csidCacheStub.set.notCalled, 'csidCache set was called');
            assert.equal(sidMgr.sessionId, 'NEW_SID_LALA', 'sessionId changed when it should not');
            //assert.isTrue(this.workerComm.sendAsync.notCalled, 'WorkerCommunicator was not called once');
        });
    });

    describe('onSiteMapperMatch test:', function () {
        it('should resetSession', function () {
            this.configurationRepository.get.withArgs('resetSessionApiThreshold').returns(20000);

            this.clock = this.sandbox.useFakeTimers();

            const sidMgr = new SessionService(this.messageBus, this.configurationServiceStub, this.configurationRepository, this.cdUtils, this.domUtils,
              this.workerComm, this.ctxtMgr, {muid: 'AA-12'}, this.serverStateMgr, this.siteMapper, this.sidRepositoryStub,
              this.serverUrlCacheStub, this.cidCacheStub, this.protocolTypeCacheStub, false,
              this.csidService,
              this.csidCacheStub, this.psidCacheStub, this.brandServiceStub, this.agentIdServiceStub);

            const currSid = Date.now() + '-' + this.guid1;
            this.sidRepositoryStub.get.returns(currSid);
            sidMgr.sessionId = currSid;

            this.clock.tick(30000);
            sidMgr._onSiteMapperMatch();

            assert.isNull(sidMgr.sessionId, 'sessionId should be null');

            this.clock.restore();
        });
    });

    describe('onConfigUpdate test', function () {
        it('should call onConfigUpdate function of resetSessionSiteMapper', function () {
            const sidMgr = new SessionService(this.messageBus, this.configurationServiceStub, this.configurationRepository, this.cdUtils, this.domUtils,
                this.workerComm, this.ctxtMgr, {muid: 'AA-12'}, this.serverStateMgr, this.siteMapper, this.sidRepositoryStub,
              this.serverUrlCacheStub, this.cidCacheStub, this.protocolTypeCacheStub, false,
              this.csidService,
                this.csidCacheStub, this.psidCacheStub, this.brandServiceStub, this.agentIdServiceStub);

            sidMgr._resetSessionSiteMapper.onConfigUpdate = this.sandbox.spy();

            const configurationMock = {
                cdsNumExpirationTime: 60,
            }

            sidMgr.onConfigUpdate(configurationMock);

            const resetSessionArgs = sidMgr._resetSessionSiteMapper.onConfigUpdate.getCall(0).args[0];

            assert.deepEqual(configurationMock, resetSessionArgs, 'expected for the configurationMock instance');
            this.sandbox.restore();
        });
    });

    describe('setSessionAgentType test', function () {
        it('should send to worker the nature of the agent type', function () {
            new SessionService(this.messageBus, this.configurationServiceStub, this.configurationRepository, this.cdUtils, this.domUtils,
                this.workerComm, this.ctxtMgr, {muid: 'AA-12'}, this.serverStateMgr, this.siteMapper, this.sidRepositoryStub,
              this.serverUrlCacheStub, this.cidCacheStub, this.protocolTypeCacheStub, false,
                new CsidService(this.custApi, this.csidCacheStub, this.workerComm),
                this.csidCacheStub, this.psidCacheStub, this.brandServiceStub, this.agentIdServiceStub);

            assert.equal(this.workerComm.sendAsync.getCall(0).args[0], WorkerCommand.setAgentTypeCommand,
                'WorkerCommunicator sendAsync first call args are invalid');
            assert.isTrue(this.workerComm.sendAsync.calledOnce, 'sendAsync was not called once');
            assert.isTrue(this.agentIdServiceStub.updateAgentIdWithServer.calledOnce, 'updateAgentIdWithServer was not called once');
        })
    });

    describe('muidService when agentType is secondary', function () {
        let sidMgr;
        beforeEach(function () {
            sidMgr = new SessionService(this.messageBus, this.configurationServiceStub, this.configurationRepository, this.cdUtils, this.domUtils,
              this.workerComm, this.ctxtMgr, null, this.serverStateMgr, this.siteMapper, this.sidRepositoryStub,
              this.serverUrlCacheStub, this.cidCacheStub, this.protocolTypeCacheStub, false,
              this.csidService,
              this.csidCacheStub, this.psidCacheStub, this.brandServiceStub, this.agentIdServiceStub);
        });
        afterEach(function () {
            sidMgr = null;
        });

        it('muid should be undefined when calling _onStartedNewSession', function () {
            sidMgr._workerComm.sendAsync = this.sandbox.spy();
            sidMgr._onStartedNewSession();

            const args = sidMgr._workerComm.sendAsync.getCall(0).args[1];
            assert.isUndefined(args.muid, 'muid should be undefined');
        });

        it('muid should be undefined when calling _onResumedSession', function () {
            sidMgr._workerComm.sendAsync = this.sandbox.spy();
            sidMgr._onResumedSession();

            const args = sidMgr._workerComm.sendAsync.getCall(0).args[1];
            assert.isUndefined(args.muid, 'muid should be undefined');
        });
    });

    describe('enableStartupCustomerSessionId logic', function () {
        let sandbox;
        let sessionService;
        let csidServiceGetStub;

        beforeEach(function () {
            sandbox = sinon.createSandbox();

            sessionService =  new SessionService(this.messageBus, this.configurationServiceStub, this.configurationRepository, this.cdUtils, this.domUtils,
              this.workerComm, this.ctxtMgr, null, this.serverStateMgr, this.siteMapper, this.sidRepositoryStub,
              this.serverUrlCacheStub, this.cidCacheStub, this.protocolTypeCacheStub, false,
              this.csidService,
              this.csidCacheStub, this.psidCacheStub, this.brandServiceStub, this.agentIdServiceStub);

            sessionService._configurationRepository = this.configurationRepository;
            sessionService._csidService = this.csidService;
            sessionService._domUtils = this.domUtils;
            sessionService._csidCache = this.csidCacheStub;
            sessionService._sendCsidToServer = this.sandbox.spy();
            csidServiceGetStub = this.csidService.get;
            csidServiceGetStub.callsFake(function (callback) {
                callback();
            });

        });
        afterEach(function () {
            sandbox.restore();
            sessionService = null;
            csidServiceGetStub = null;
        })

        it('csid should not be null when enableStartupCustomerSessionId is true ', function () {
            const expectedCsid = 'AA-12';
            sessionService._enableStartupCustomerSessionId = true;
            this.csidService.get.returns('AA-12');
            this.csidCacheStub.get.returns('AA-12');
            sessionService._startNewSession();

            const args = this.workerComm.sendAsync.getCall(1).args[1].csid;

            assert.isTrue(this.csidService.get.calledOnce, 'csidServiceGetStub was not called once');
            assert.isTrue(this.csidCacheStub.set.notCalled, 'csidCacheStub was called');
            assert.isTrue(this.workerComm.sendAsync.called, 'workerComm.sendAsync was not called');
            assert.equal(args, expectedCsid, 'csid is not equal to expectedCsid');
        });

        it('csid should be `csid` when enableStartupCustomerSessionId is false ', function () {
            const expectedCsid = 'csid';
            sessionService._enableStartupCustomerSessionId = false;
            sessionService._startNewSession();

            const args = this.workerComm.sendAsync.getCall(1).args[1].csid;

            assert.isTrue(this.csidService.get.notCalled, 'csidServiceGetStub was called');
            assert.isTrue(this.csidCacheStub.set.called, 'csidCacheStub was not called');
            assert.equal(args, expectedCsid, 'csid is not csid');
        });

        it('should call _csidService.get directly if enableStartupCustomerSessionId is true', async function () {
            const logInfoSpy = sandbox.spy(Log, 'info');

            sessionService._enableStartupCustomerSessionId = true;
            sessionService._handleCsid();


            assert.isTrue(sessionService._csidService.get.calledOnce, 'csidServiceGetStub was not called once');
            assert.isTrue(csidServiceGetStub.calledOnce, 'csidServiceGetStub was not called once');
            assert.isTrue(sessionService._sendCsidToServer.calledOnce, 'sendCsidToServer was not called once');
            assert.isTrue(logInfoSpy.calledOnce, 'logInfoSpy was not called once');
        });

        it('should call _domUtils.onDocumentBody if enableStartupCustomerSessionId is false', function () {
            const logInfoSpy = sandbox.stub(Log, 'info');
            sessionService._enableStartupCustomerSessionId = false;

            sessionService._handleCsid();

            assert.isTrue(this.onDocumentBody.calledOnce);
            assert.isTrue(sessionService._csidService.get.calledOnce);
            assert.isTrue(sessionService._sendCsidToServer.called);
            assert.isTrue(logInfoSpy.calledOnce, 'logInfoSpy was not called once');
        });
    });

    describe('setOrFetch csid', function () {
        let sidMgr = null;

        beforeEach(function () {
            sidMgr = new SessionService(this.messageBus, this.configurationServiceStub, this.configurationRepository, this.cdUtils, this.domUtils,
                this.workerComm, this.ctxtMgr, null, this.serverStateMgr, this.siteMapper, this.sidRepositoryStub,
              this.serverUrlCacheStub, this.cidCacheStub, this.protocolTypeCacheStub, false,
              this.csidService,
                this.csidCacheStub, this.psidCacheStub, this.brandServiceStub, this.agentIdServiceStub);
        });

        afterEach(function () {
            if(this.sandbox){
                this.sandbox.restore();
            }
            sidMgr = null;
        });

        it('should call set function of the csidCache class', function () {
            const csid = 'AA-12';
            sidMgr = new SessionService(this.messageBus, this.configurationServiceStub, this.configurationRepository, this.cdUtils, this.domUtils,
                this.workerComm, this.ctxtMgr, {muid: 'AA-12'}, this.serverStateMgr, this.siteMapper, this.sidRepositoryStub,
              this.serverUrlCacheStub, this.cidCacheStub, this.protocolTypeCacheStub, false,
              this.csidService,
                this.csidCacheStub, this.psidCacheStub, this.brandServiceStub, this.agentIdServiceStub);
            sidMgr._csidCache.set = this.sandbox.spy();
            sidMgr._csidService.get = this.sandbox.spy();
            sidMgr._setOrFetchCsid(csid);
            const args = sidMgr._csidCache.set.getCall(0).args[0];
            assert.isTrue(sidMgr._csidCache.set.calledOnce, 'csidCache.set was not called once');
            assert.isTrue(sidMgr._csidService.get.notCalled, 'csidServiceGetStub was called');
            assert.equal(args, csid, 'csid is not equal to expectedCsid');
        });

        it('should call setOrFetchCsid when csid is passed to _startNewSession function', function () {
            sidMgr._enableStartupCustomerSessionId = true;
            sidMgr._setOrFetchCsid = this.sandbox.spy();
            sidMgr._startNewSession('AA-12');
            const args = sidMgr._setOrFetchCsid.getCall(0).args[0];
            assert.isTrue(sidMgr._setOrFetchCsid.calledOnce, 'setOrFetchCsid was not called once');
            assert.equal(args, 'AA-12', 'csid is not equal to expectedCsid');
        });

        it('should call _csidCache.set', function () {
            sidMgr._enableStartupCustomerSessionId = false;
            sidMgr._csidCache.set = this.sandbox.spy();
            sidMgr._startNewSession('AA-12');
            const args = sidMgr._csidCache.set.getCall(0).args[0];
            assert.isTrue(sidMgr._csidCache.set.calledOnce, 'setOrFetchCsid was not called once');
            assert.equal(args, 'AA-12', 'csid is not equal to expectedCsid');
        });

        it('should call _csidCache.set with csid null', function () {
            sidMgr._enableStartupCustomerSessionId = false;
            sidMgr._csidCache.set = this.sandbox.spy();
            sidMgr._startNewSession();
            const args = sidMgr._csidCache.set.getCall(0).args[0];
            assert.isTrue(sidMgr._csidCache.set.calledOnce, 'setOrFetchCsid was not called once');
            assert.equal(args, null, 'csid is not equal to expectedCsid');
        });

        it('should  call on _startNewSession with csid', function () {
            const msg = {csid: 'AA-12'};
            sidMgr._startNewSession = this.sandbox.spy();
            sidMgr.onResetSession(msg);
            const args = sidMgr._startNewSession.getCall(0).args[0];
            assert.isTrue(sidMgr._startNewSession.calledOnce, 'setOrFetchCsid was not called once');
            assert.isTrue(sidMgr._startNewSession.calledWith('AA-12'), 'setOrFetchCsid was not called with csid');
            assert.equal(args, 'AA-12', 'csid is not equal to expectedCsid');
        });

        it('should  call on _startNewSession with csid null', function () {
            const msg = {csid: undefined};
            sidMgr._startNewSession = this.sandbox.spy();
            sidMgr.onResetSession(msg);
            const args = sidMgr._startNewSession.getCall(0).args[0];
            assert.isTrue(sidMgr._startNewSession.calledOnce, 'setOrFetchCsid was not called once');
            assert.isTrue(sidMgr._startNewSession.calledWith(undefined), 'setOrFetchCsid was not called with csid');
            assert.equal(args, undefined, 'csid is not equal to expectedCsid');
        });

        it('should call _startNewSession', function () {
            sidMgr._startNewSession = this.sandbox.spy();
            sidMgr.resetSession = this.sandbox.spy();
            sidMgr.startNewSession();
            sidMgr.resetSession();
            assert.isTrue(sidMgr._startNewSession.calledOnce, 'startNewSession was not called once');
            assert.isTrue(sidMgr.resetSession.calledOnce, 'resetSession was not called once');
        });
    });
});
