import {assert} from 'chai';
import WupServerSessionState from '../../../../src/worker/communication/WupServerSessionState';
import ServerCommunicator from '../../../../src/worker/communication/ServerCommunicator';
import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import ConfigurationRepository from '../../../../src/main/core/configuration/ConfigurationRepository';
import WupResponseProcessor from '../../../../src/worker/communication/WupResponseProcessor';
import {MessageBusEventType} from '../../../../src/main/events/MessageBusEventType';

describe('WupResponseProcessor tests:', function () {
    beforeEach(function () {
        this.sandbox = sinon.createSandbox();

        this._wupServerSessionStateStub = sinon.stub(new WupServerSessionState());
        this._serverCommunicatorStub = sinon.createStubInstance(ServerCommunicator);
        this._messageBusStub = sinon.stub(new MessageBus());
        this._configurationRepository = sinon.stub(new ConfigurationRepository());
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    describe('process tests:\n', function () {
        it('reset session is processed', function () {
            const wupResponseProcessor = new WupResponseProcessor(this._wupServerSessionStateStub, this._messageBusStub, this._configurationRepository);

            this._wupServerSessionStateStub.getSid.returns('abcdefg');

            wupResponseProcessor.process({'reset_session': true, 'new_sid': 'abcdefg'}, false);

            assert.isTrue(this._messageBusStub.publish.calledTwice, 'Message bus publish was not called once');
            assert.equal(this._messageBusStub.publish.firstCall.args[0], MessageBusEventType.ServerStateUpdatedEvent, 'Message bus argument was not as expected');
            assert.equal(this._messageBusStub.publish.secondCall.args[0], MessageBusEventType.NewSessionStartedEvent, 'Message bus argument was not as expected');
            assert.equal(this._messageBusStub.publish.secondCall.args[1], 'abcdefg', 'Message bus argument was not as expected');
        });

        it('receive a reset session flag with no new sid', function () {
            const wupResponseProcessor = new WupResponseProcessor(this._wupServerSessionStateStub, this._messageBusStub, this._configurationRepository);

            wupResponseProcessor.process({'reset_session': true}, false);

            assert.isTrue(this._messageBusStub.publish.calledOnce, 'Message bus publish was called');
            assert.equal(this._messageBusStub.publish.firstCall.args[0], MessageBusEventType.ServerStateUpdatedEvent, 'Message bus argument was not as expected');
        });

        it('nextWupInterval is processed', function () {
            const wupResponseProcessor = new WupResponseProcessor(this._wupServerSessionStateStub, this._messageBusStub, this._configurationRepository);

            this._wupServerSessionStateStub.getWupDispatchRate.onSecondCall().returns(5123);

            wupResponseProcessor.process({'nextWupInterval': 5123}, false);

            assert.isTrue(this._wupServerSessionStateStub.setWupDispatchRate.calledOnce);
            assert.equal(this._wupServerSessionStateStub.setWupDispatchRate.firstCall.args[0], 5123);
            assert.isTrue(this._messageBusStub.publish.calledTwice, 'Message bus publish was not called once');
            assert.equal(this._messageBusStub.publish.firstCall.args[0], MessageBusEventType.ServerStateUpdatedEvent, 'Message bus argument was not as expected');
            assert.equal(this._messageBusStub.publish.secondCall.args[0], MessageBusEventType.WupDispatchRateUpdatedEvent, 'Message bus argument was not as expected');
            assert.equal(this._messageBusStub.publish.secondCall.args[1], 5123, 'Message bus argument was not as expected');
        });

        it('in valid nextWupInterval is not processed', function () {
            const wupResponseProcessor = new WupResponseProcessor(this._wupServerSessionStateStub, this._messageBusStub, this._configurationRepository);

            wupResponseProcessor.process({'nextWupInterval': null}, false);

            assert.isTrue(this._wupServerSessionStateStub.setWupDispatchRate.notCalled);
            assert.isTrue(this._messageBusStub.publish.calledOnce, 'Message bus publish was called');
            assert.equal(this._messageBusStub.publish.firstCall.args[0], MessageBusEventType.ServerStateUpdatedEvent, 'Message bus argument was not as expected');
        });

        it('process response successfully', function () {
            const wupResponseProcessor = new WupResponseProcessor(this._wupServerSessionStateStub,
                this._messageBusStub, this._configurationRepository);

            this._wupServerSessionStateStub.getSid.returns('sid5');
            this._wupServerSessionStateStub.getSts.returns('sts6');
            this._wupServerSessionStateStub.getStd.returns('std7');
            this._wupServerSessionStateStub.getRequestId.returns('requestId8');

            wupResponseProcessor.process({
                'reset_session': true, 'new_sid': 'abcdefg', 'sts': 'lalala', 'std': 'tralalalala',
            }, false);

            assert.isTrue(this._wupServerSessionStateStub.setSid.calledOnce);
            assert.isTrue(this._wupServerSessionStateStub.setSts.calledOnce);
            assert.isTrue(this._wupServerSessionStateStub.setStd.calledOnce);

            assert.isTrue(this._messageBusStub.publish.calledTwice, 'Message bus publish was not called once');
            assert.equal(this._messageBusStub.publish.firstCall.args[0], MessageBusEventType.ServerStateUpdatedEvent, 'Message bus argument was not as expected');
            assert.deepEqual(this._messageBusStub.publish.firstCall.args[1], {
                requestId: 'requestId8', sts: 'sts6', std: 'std7', sid: 'sid5', ott: undefined,
            }, 'Message bus argument was not as expected');
            assert.equal(this._messageBusStub.publish.secondCall.args[0], MessageBusEventType.NewSessionStartedEvent, 'Message bus argument was not as expected');
            assert.equal(this._messageBusStub.publish.secondCall.args[1], 'abcdefg', 'Message bus argument was not as expected');
        });

        it('process response with only sts update successfully', function () {
            const wupResponseProcessor = new WupResponseProcessor(this._wupServerSessionStateStub, this._messageBusStub, this._configurationRepository);

            this._wupServerSessionStateStub.getSts.returns('sts6');
            this._wupServerSessionStateStub.getRequestId.returns('requestId8');

            wupResponseProcessor.process({'sts': 'lalala'}, false);

            assert.isTrue(this._wupServerSessionStateStub.setSid.notCalled);
            assert.isTrue(this._wupServerSessionStateStub.setSts.calledOnce);
            assert.isTrue(this._wupServerSessionStateStub.setStd.notCalled);

            assert.isTrue(this._messageBusStub.publish.calledOnce, 'Message bus publish was not called once');
            assert.equal(this._messageBusStub.publish.firstCall.args[0], MessageBusEventType.ServerStateUpdatedEvent, 'Message bus argument was not as expected');
            assert.deepEqual(this._messageBusStub.publish.firstCall.args[1], {
                requestId: 'requestId8', sts: 'sts6', std: undefined, sid: undefined, ott: undefined,
            }, 'Message bus argument was not as expected');
        });

        it('process response with only std update successfully', function () {
            const wupResponseProcessor = new WupResponseProcessor(this._wupServerSessionStateStub, this._messageBusStub, this._configurationRepository);

            this._wupServerSessionStateStub.getStd.returns('std7');
            this._wupServerSessionStateStub.getRequestId.returns('requestId8');

            wupResponseProcessor.process({'std': 'tralalalala'}, false);

            assert.isTrue(this._wupServerSessionStateStub.setSid.notCalled);
            assert.isTrue(this._wupServerSessionStateStub.setSts.notCalled);
            assert.isTrue(this._wupServerSessionStateStub.setStd.calledOnce);

            assert.isTrue(this._messageBusStub.publish.calledOnce, 'Message bus publish was not called once');
            assert.equal(this._messageBusStub.publish.firstCall.args[0], MessageBusEventType.ServerStateUpdatedEvent, 'Message bus argument was not as expected');
            assert.deepEqual(this._messageBusStub.publish.firstCall.args[1], {
                requestId: 'requestId8', sts: undefined, std: 'std7', sid: undefined, ott: undefined
            }, 'Message bus argument was not as expected');
        });

        it('process response with only sid update successfully', function () {
            const wupResponseProcessor = new WupResponseProcessor(this._wupServerSessionStateStub, this._messageBusStub, this._configurationRepository);

            this._wupServerSessionStateStub.getSid.returns('sid5');
            this._wupServerSessionStateStub.getRequestId.returns('requestId8');

            wupResponseProcessor.process({'reset_session': true, 'new_sid': 'abcdefg'}, false);

            assert.isTrue(this._wupServerSessionStateStub.setSid.calledOnce);
            assert.isTrue(this._wupServerSessionStateStub.setSts.notCalled);
            assert.isTrue(this._wupServerSessionStateStub.setStd.notCalled);

            assert.isTrue(this._messageBusStub.publish.calledTwice, 'Message bus publish was not called once');
            assert.equal(this._messageBusStub.publish.firstCall.args[0], MessageBusEventType.ServerStateUpdatedEvent, 'Message bus argument was not as expected');
            assert.deepEqual(this._messageBusStub.publish.firstCall.args[1], {
                requestId: 'requestId8', sts: undefined, std: undefined, sid: 'sid5', ott: undefined
            }, 'Message bus argument was not as expected');
            assert.equal(this._messageBusStub.publish.secondCall.args[0], MessageBusEventType.NewSessionStartedEvent, 'Message bus argument was not as expected');
            assert.equal(this._messageBusStub.publish.secondCall.args[1], 'abcdefg', 'Message bus argument was not as expected');
        });

        it('ignore a new sid if there is no reset_session flag', function () {
            const wupResponseProcessor = new WupResponseProcessor(this._wupServerSessionStateStub, this._messageBusStub, this._configurationRepository);

            this._wupServerSessionStateStub.getSid.returns('sid5');
            this._wupServerSessionStateStub.getSts.returns('sts6');
            this._wupServerSessionStateStub.getStd.returns('std7');
            this._wupServerSessionStateStub.getRequestId.returns('requestId8');

            wupResponseProcessor.process({'new_sid': 'abcdefg'}, false);

            assert.isTrue(this._wupServerSessionStateStub.setSid.notCalled);
            assert.isTrue(this._wupServerSessionStateStub.setSts.notCalled);
            assert.isTrue(this._wupServerSessionStateStub.setStd.notCalled);

            assert.isTrue(this._messageBusStub.publish.calledOnce, 'Message bus publish was not called once');
            assert.equal(this._messageBusStub.publish.firstCall.args[0], MessageBusEventType.ServerStateUpdatedEvent, 'Message bus argument was not as expected');
            assert.deepEqual(this._messageBusStub.publish.firstCall.args[1], {
                requestId: 'requestId8', sts: 'sts6', std: 'std7', sid: 'sid5', ott: undefined
            }, 'Message bus argument was not as expected');
        });

        it('process configurations successfully', function () {
            const wupResponseProcessor = new WupResponseProcessor(this._wupServerSessionStateStub, this._messageBusStub, this._configurationRepository);

            this._wupServerSessionStateStub.getSid.returns('abcdefg');

            wupResponseProcessor.process({}, true);

            assert.isTrue(this._wupServerSessionStateStub.markConfigurationReceived.calledOnce);
            assert.isTrue(this._messageBusStub.publish.calledTwice, 'Message bus publish was not called once');
            assert.equal(this._messageBusStub.publish.firstCall.args[0], MessageBusEventType.ServerStateUpdatedEvent, 'Message bus argument was not as expected');
            assert.equal(this._messageBusStub.publish.secondCall.args[0], MessageBusEventType.ConfigurationLoadedEvent, 'Message bus argument was not as expected');
        });

    });

    describe("restored muid response", function () {
        it("should set the restored muid + publish messageBus event", function () {
            const muid = "1666717589890-5871DDCB-E3DD-4838-B375-D7AC541AA46C";
            const wupResponseProcessor = new WupResponseProcessor(this._wupServerSessionStateStub, this._messageBusStub, this._configurationRepository);
            wupResponseProcessor.process({rmd: muid});

            assert.isTrue(this._wupServerSessionStateStub.setMuid.calledOnce, "expected setMuid to be called once");
            assert.isTrue(this._wupServerSessionStateStub.setMuid.calledWith(muid), `expected muid value to be ${muid}`);

            const args = this._messageBusStub.publish.getCall(0).args;
            assert.equal(args[0], MessageBusEventType.ServerRestoredMuidEvent, `expected ${MessageBusEventType.ServerRestoredMuidEvent} message type`);
            assert.equal(args[1], muid, `expected to be equal to ${muid}`);

        });
    });

    describe('ott processing', function () {
        it('should successfully process ott', function () {
            const wupResponseProcessor = new WupResponseProcessor(this._wupServerSessionStateStub, this._messageBusStub,
                this._configurationRepository);
            const ott = 'ott1';
            const requestId = 'requestId2';
            this._wupServerSessionStateStub.getRequestId.returns(requestId);
            this._wupServerSessionStateStub.getOtt.returns(ott);

            wupResponseProcessor.process({'ott': ott}, false);

            assert.isTrue(this._wupServerSessionStateStub.setOtt.calledOnce);
            assert.isTrue(this._wupServerSessionStateStub.setOtt.calledWith(ott));
            assert.isTrue(this._messageBusStub.publish.calledOnce, 'Message bus publish was not called once');
            assert.equal(this._messageBusStub.publish.firstCall.args[0], MessageBusEventType.ServerStateUpdatedEvent, 'Message bus argument was not as expected');
            assert.deepEqual(this._messageBusStub.publish.firstCall.args[1], {
                requestId: requestId, sts: undefined, std: undefined, sid: undefined, ott: ott
            }, 'Message bus argument was not as expected');

        });
    });
    describe("agentId response tests", function(){
        it("should set the agentId", function(){
            const wupResponseProcessor = new WupResponseProcessor(this._wupServerSessionStateStub,this._messageBusStub,this._configurationRepository);
            wupResponseProcessor.process({agent_id:'some_agent_id'});


            assert.equal(this._wupServerSessionStateStub.setAgentId.getCall(0).args[0], 'some_agent_id',
                'agentId was not set');
            assert.isTrue(this._wupServerSessionStateStub.setAgentId.calledOnce, 'setAgentId was not called once');
        });
    });
});
