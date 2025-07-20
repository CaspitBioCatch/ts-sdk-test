import {assert} from 'chai';
import WupServerSessionState from '../../../../src/worker/communication/WupServerSessionState';
import WupMessageBuilder from '../../../../src/worker/communication/WupMessageBuilder';
import ConfigurationRepository from '../../../../src/main/core/configuration/ConfigurationRepository';
import WupResponseProcessor from '../../../../src/worker/communication/WupResponseProcessor';
import {ConfigurationFields} from '../../../../src/main/core/configuration/ConfigurationFields';
import WupServerClient from '../../../../src/worker/communication/WupServerClient';
import WupMessage from '../../../../src/worker/communication/WupMessage';
import ServerCommunicator from '../../../../src/worker/communication/ServerCommunicator';
import DataPacker from '../../../../src/worker/wup/DataPacker';
import WupStatisticsService from '../../../../src/worker/wup/WupStatisticsService';
import {WorkerStatusCategoryType} from '../../../../src/worker/WorkerStatusCategoryType';
import HeartBeatEvent, {statusTypes} from '../../../../src/main/events/HeartBeatEvent';
import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import {MessageBusEventType} from '../../../../src/main/events/MessageBusEventType';
import RetryMessage from "../../../../src/worker/communication/RetryMessage";
import {DEFAULT_WUP_TYPE} from '../../../../src/worker/communication/Constants';
import Log from "../../../../src/main/technicalServices/log/Logger";
import sinon from "sinon";

const mockServerUrl = 'stam-server-url';
const mockCid = 'mock_cid';
const mockProtocolType = 4;

describe('WupServerClient tests:', function () {
    const DEFAULT_REQUEST_TIMEOUT = 3245;

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
        this._retryMessageStub = this.sandbox.createStubInstance(RetryMessage);
        this._serverCommunicatorStub = this.sandbox.createStubInstance(ServerCommunicator);
        this._wupServerSessionState = this.sandbox.createStubInstance(WupServerSessionState);
        this._dataPackerStub = this.sandbox.createStubInstance(DataPacker);
        this._wupMessageBuilderStub = this.sandbox.createStubInstance(WupMessageBuilder);
        this._wupStatisticsServiceStub = this.sandbox.createStubInstance(WupStatisticsService);
        this._wupResponseProcessorStub = this.sandbox.createStubInstance(WupResponseProcessor);
        this._configurationRepositoryStub = this.sandbox.createStubInstance(ConfigurationRepository);
        this._msgBusStub = this.sandbox.createStubInstance(MessageBus);
        this._configurationRepositoryStub.get.withArgs(ConfigurationFields.wupMessageRequestTimeout).returns(DEFAULT_REQUEST_TIMEOUT);
        this._serverCommunicatorStub.getRetryMessage.returns(this._retryMessageStub);
        this._retryMessageStub.getMessageNumToRetry.returns(10)
        this._wupServerSessionState.getBaseServerUrl.returns(mockServerUrl);
        this._wupServerSessionState.getCid.returns(mockCid);
        this._wupServerSessionState.getProtocolType.returns(mockProtocolType);
        this._wupServerSessionState.getShouldMinifyUri.returns(false);
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    describe('_initSession tests:\n', function () {
        it('session data is init successfully', function () {
            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            wupServerClient._initSession('1212121415655123',mockCid, mockProtocolType,false, 'ccccccssssssiiiiiiidddddd', 'psidd',
                'mu-id', 'cd_dd', 'address', {
                    sts: 'stsamamamama',
                    std: 'sdddddddddddd',
                    ott: 'ottt'
                }, 12);

            assert.isTrue(this._wupServerSessionState.setBaseServerUrl.calledOnce);
            assert.equal(this._wupServerSessionState.setBaseServerUrl.firstCall.args[0], 'address');
            assert.isTrue(this._wupServerSessionState.setSid.calledOnce);
            assert.equal(this._wupServerSessionState.setSid.firstCall.args[0], '1212121415655123');
            assert.isTrue(this._wupServerSessionState.setCid.calledOnce);
            assert.equal(this._wupServerSessionState.setCid.firstCall.args[0], mockCid);
            assert.isTrue(this._wupServerSessionState.setCsid.calledOnce);
            assert.equal(this._wupServerSessionState.setCsid.firstCall.args[0], 'ccccccssssssiiiiiiidddddd');
            assert.isTrue(this._wupServerSessionState.setPsid.calledOnce);
            assert.equal(this._wupServerSessionState.setPsid.firstCall.args[0], 'psidd');
            assert.isTrue(this._wupServerSessionState.setMuid.calledOnce);
            assert.equal(this._wupServerSessionState.setMuid.firstCall.args[0], 'mu-id');
            assert.isTrue(this._wupServerSessionState.setProtocolType.calledOnce);
            assert.equal(this._wupServerSessionState.setProtocolType.firstCall.args[0], mockProtocolType);
            assert.isTrue(this._wupServerSessionState.setShouldMinifyUri.calledOnce);
            assert.equal(this._wupServerSessionState.setShouldMinifyUri.firstCall.args[0], false);
            assert.isTrue(this._wupServerSessionState.setContextName.calledOnce);
            assert.equal(this._wupServerSessionState.setContextName.firstCall.args[0], 'cd_dd');
            assert.isTrue(this._wupServerSessionState.setRequestId.calledOnce);
            assert.equal(this._wupServerSessionState.setRequestId.firstCall.args[0], 12);
            assert.equal(this._wupServerSessionState.setRequestId.firstCall.args[1], false);
            assert.isTrue(this._wupServerSessionState.setSts.calledOnce);
            assert.equal(this._wupServerSessionState.setSts.firstCall.args[0], 'stsamamamama');
            assert.isTrue(this._wupServerSessionState.setStd.calledOnce);
            assert.equal(this._wupServerSessionState.setStd.firstCall.args[0], 'sdddddddddddd');
            assert.isTrue(this._wupServerSessionState.setOtt.calledOnce);
            assert.equal(this._wupServerSessionState.setOtt.firstCall.args[0], 'ottt');
        });

        it('sts and std are deleted if serverState is null', function () {
            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            wupServerClient._initSession('1212121415655123',mockCid, mockProtocolType, false, 'ccccccssssssiiiiiiidddddd', 'psidd', 'mu-id', 'cd_dd', 'address', null, 12);

            assert.isTrue(this._wupServerSessionState.setBaseServerUrl.calledOnce);
            assert.equal(this._wupServerSessionState.setBaseServerUrl.firstCall.args[0], 'address');

            assert.isTrue(this._wupStatisticsServiceStub.resetCounters.calledOnce);

            assert.isTrue(this._wupServerSessionState.setSid.calledOnce);
            assert.equal(this._wupServerSessionState.setSid.firstCall.args[0], '1212121415655123');
            assert.isTrue(this._wupServerSessionState.setCsid.calledOnce);
            assert.equal(this._wupServerSessionState.setCsid.firstCall.args[0], 'ccccccssssssiiiiiiidddddd');
            assert.isTrue(this._wupServerSessionState.setPsid.calledOnce);
            assert.equal(this._wupServerSessionState.setPsid.firstCall.args[0], 'psidd');
            assert.isTrue(this._wupServerSessionState.setMuid.calledOnce);
            assert.equal(this._wupServerSessionState.setMuid.firstCall.args[0], 'mu-id');
            assert.isTrue(this._wupServerSessionState.setContextName.calledOnce);
            assert.equal(this._wupServerSessionState.setContextName.firstCall.args[0], 'cd_dd');
            assert.isTrue(this._wupServerSessionState.setRequestId.calledOnce);
            assert.equal(this._wupServerSessionState.setRequestId.firstCall.args[0], 12);
            assert.equal(this._wupServerSessionState.setRequestId.firstCall.args[1], false);
            assert.isTrue(this._wupServerSessionState.setSts.calledOnce);
            assert.equal(this._wupServerSessionState.setSts.firstCall.args[0], null);
            assert.isTrue(this._wupServerSessionState.setStd.calledOnce);
            assert.equal(this._wupServerSessionState.setStd.firstCall.args[0], null);
        });
    });

    describe('sendData tests:\n', function () {
        beforeEach(function () {
            this._expectedWupMessage = new WupMessage();
            this._expectedWupMessage.data = 'dataDUDE';

            this._wupMessageBuilderStub.build.returns(this._expectedWupMessage);
        });

        it('data is sent successfully', function () {
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse) {
                onSuccessResponse('{"response": "response"}');
            };

            this._wupServerSessionState.getSts.returns('stam-sts');
            this._wupServerSessionState.getStd.returns('stam-std');
            this._wupServerSessionState.getBaseServerUrl.returns(mockServerUrl);
            this._wupServerSessionState.getProtocolType.returns(3);

            const expectedHeartbeatEvent = sinon.match.instanceOf(HeartBeatEvent)
                .and(sinon.match.has('category', WorkerStatusCategoryType.WupServerResponse))
                .and(sinon.match.has('status', statusTypes.Ok));

            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(wupServerClient, '_onSendDataFailure');

            wupServerClient.sendData({data: 'data'});

            assert.isTrue(this._wupMessageBuilderStub.build.calledOnce);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[0], DEFAULT_WUP_TYPE);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[1], {data: 'data'});

            assert.isTrue(serverCommunicatorSendMessageSpy.calledOnce);
            assert.deepEqual(serverCommunicatorSendMessageSpy.firstCall.args[0], this._expectedWupMessage);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[1], DEFAULT_REQUEST_TIMEOUT);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[2], wupServerClient._MESSAGE_SEND_RETRIES);

            assert.isTrue(wupServerClientOnSendDataSuccessSpy.calledOnce);
            assert.equal(wupServerClientOnSendDataSuccessSpy.firstCall.args[0], '{"response": "response"}');

            assert.isTrue(wupServerClientOnSendDataFailureSpy.notCalled);

            assert.isTrue(this._wupResponseProcessorStub.process.calledOnce);
            assert.deepEqual(this._wupResponseProcessorStub.process.firstCall.args[0], {'response': 'response'});
            assert.isTrue(this._msgBusStub.publish.called, 'publish was not called');
            assert.isTrue(this._msgBusStub.publish.calledWith(MessageBusEventType.WorkerSystemStatusEvent, sinon.match(expectedHeartbeatEvent)), 'publish was called with wrong args');
        });

        it('failure callback is called once data send fails', function () {
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse, onMessageRetryFailure, onMessageFailure) {
                onMessageFailure('{"response": "response"}');
            };

            this._wupServerSessionState.getSts.returns('stam-sts');
            this._wupServerSessionState.getStd.returns('stam-std');
            this._wupServerSessionState.getBaseServerUrl.returns(mockServerUrl);
            this._wupServerSessionState.getProtocolType.returns(3);

            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(wupServerClient, '_onSendDataFailure');

            wupServerClient.sendData({data: 'data'});

            assert.isTrue(this._wupMessageBuilderStub.build.calledOnce);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[0], DEFAULT_WUP_TYPE);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[1], {data: 'data'});

            assert.isTrue(serverCommunicatorSendMessageSpy.calledOnce);
            assert.deepEqual(serverCommunicatorSendMessageSpy.firstCall.args[0], this._expectedWupMessage);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[1], DEFAULT_REQUEST_TIMEOUT);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[2], wupServerClient._MESSAGE_SEND_RETRIES);

            assert.isTrue(wupServerClientOnSendDataFailureSpy.calledOnce);
            assert.equal(wupServerClientOnSendDataFailureSpy.firstCall.args[0], '{"response": "response"}');

            assert.isTrue(wupServerClientOnSendDataSuccessSpy.notCalled);
        });

        it('data is not sent once there is no sts', function () {
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse) {
                onSuccessResponse('{"response": "response"}');
            };

            this._wupServerSessionState.getStd.returns('stam-std');
            this._wupServerSessionState.getBaseServerUrl.returns(mockServerUrl);
            this._wupServerSessionState.getProtocolType.returns(3);

            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(wupServerClient, '_onSendDataFailure');

            wupServerClient.sendData({data: 'data'});

            assert.isTrue(this._wupMessageBuilderStub.build.notCalled);
            assert.isTrue(serverCommunicatorSendMessageSpy.notCalled);
            assert.isTrue(wupServerClientOnSendDataSuccessSpy.notCalled);
            assert.isTrue(wupServerClientOnSendDataFailureSpy.notCalled);
        });

        it('data is not sent once there is no std', function () {
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse) {
                onSuccessResponse('{"response": "response"}');
            };

            this._wupServerSessionState.getSts.returns('stam-sts');
            this._wupServerSessionState.getBaseServerUrl.returns(mockServerUrl);
            this._wupServerSessionState.getProtocolType.returns(3);

            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(wupServerClient, '_onSendDataFailure');

            wupServerClient.sendData({data: 'data'});

            assert.isTrue(this._wupMessageBuilderStub.build.notCalled);
            assert.isTrue(serverCommunicatorSendMessageSpy.notCalled);
            assert.isTrue(wupServerClientOnSendDataSuccessSpy.notCalled);
            assert.isTrue(wupServerClientOnSendDataFailureSpy.notCalled);
        });

        it('data is flushed when shouldFlush is true', function () {
            this._wupServerSessionState.getSts.returns('stam-sts');
            this._wupServerSessionState.getStd.returns('stam-std');
            this._wupServerSessionState.getBaseServerUrl.returns(mockServerUrl);
            this._wupServerSessionState.getProtocolType.returns(3);

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            wupServerClient.sendData({data: 'data'}, true);

            assert.isTrue(this._wupMessageBuilderStub.build.calledOnce);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[0], DEFAULT_WUP_TYPE);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[1], {data: 'data'});

            assert.isTrue(this._serverCommunicatorStub.sendMessage.calledOnce);
            assert.deepEqual(this._serverCommunicatorStub.sendMessage.firstCall.args[0], this._expectedWupMessage);
            assert.equal(this._serverCommunicatorStub.sendMessage.firstCall.args[1], DEFAULT_REQUEST_TIMEOUT);
            assert.equal(this._serverCommunicatorStub.sendMessage.firstCall.args[2], wupServerClient._MESSAGE_SEND_RETRIES);
            assert.equal(this._serverCommunicatorStub.sendMessage.firstCall.args[3], true);
        });

        it('response is processed in data response', function () {
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse) {
                onSuccessResponse('{"wupResponseTimeout": 1112111}');
            };

            this._wupServerSessionState.getSts.returns('stam-sts');
            this._wupServerSessionState.getStd.returns('stam-std');
            this._wupServerSessionState.getBaseServerUrl.returns(mockServerUrl);
            this._wupServerSessionState.getProtocolType.returns(3);
            this._dataPackerStub.pack.returns({PACKED: 'PACKED'});

            const expectedHeartbeatEvent = sinon.match.instanceOf(HeartBeatEvent)
                .and(sinon.match.has('category', WorkerStatusCategoryType.WupServerResponse))
                .and(sinon.match.has('status', statusTypes.Ok));

            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(wupServerClient, '_onSendDataFailure');

            wupServerClient.sendData({data: 'data'});

            assert.isTrue(this._wupMessageBuilderStub.build.calledOnce);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[0], DEFAULT_WUP_TYPE);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[1], {data: 'data'});

            assert.isTrue(serverCommunicatorSendMessageSpy.calledOnce);
            assert.deepEqual(serverCommunicatorSendMessageSpy.firstCall.args[0], this._expectedWupMessage);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[1], DEFAULT_REQUEST_TIMEOUT);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[2], wupServerClient._MESSAGE_SEND_RETRIES);

            assert.isTrue(wupServerClientOnSendDataSuccessSpy.calledOnce);
            assert.equal(wupServerClientOnSendDataSuccessSpy.firstCall.args[0], '{"wupResponseTimeout": 1112111}');

            assert.isTrue(wupServerClientOnSendDataFailureSpy.notCalled);

            assert.isTrue(this._wupResponseProcessorStub.process.calledOnce);
            assert.deepEqual(this._wupResponseProcessorStub.process.firstCall.args[0], {'wupResponseTimeout': 1112111});
            assert.isTrue(this._msgBusStub.publish.called, 'publish was not called');
            assert.isTrue(this._msgBusStub.publish.calledWith(MessageBusEventType.WorkerSystemStatusEvent,
                sinon.match(expectedHeartbeatEvent)), 'publish was called with wrong args');
        });

        it('sts and std are updated from config response successfully', function () {
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse) {
                onSuccessResponse('{"sts": "1233234sts", "std": "443333332224std"}');
            };

            this._wupServerSessionState.getSts.returns('stam-sts');
            this._wupServerSessionState.getStd.returns('stam-std');
            this._wupServerSessionState.getBaseServerUrl.returns(mockServerUrl);
            this._wupServerSessionState.getProtocolType.returns(3);
            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(wupServerClient, '_onSendDataFailure');

            wupServerClient.sendData({data: 'data'});

            assert.isTrue(this._wupMessageBuilderStub.build.calledOnce);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[0], DEFAULT_WUP_TYPE);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[1], {data: 'data'});

            assert.isTrue(wupServerClientOnSendDataSuccessSpy.calledOnce);
            assert.equal(wupServerClientOnSendDataSuccessSpy.firstCall.args[0], '{"sts": "1233234sts", "std": "443333332224std"}');

            assert.isTrue(wupServerClientOnSendDataFailureSpy.notCalled);

            assert.isTrue(this._wupResponseProcessorStub.process.calledOnce);
            assert.deepEqual(this._wupResponseProcessorStub.process.firstCall.args[0], {
                'sts': '1233234sts',
                'std': '443333332224std',
            });
        });

        it('send data publish heart beat WupServerResponse with error status on invalid server response', function () {
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse) {
                onSuccessResponse('{"response": invalid');
            };

            this._wupServerSessionState.getSts.returns('stam-sts');
            this._wupServerSessionState.getStd.returns('stam-std');
            this._wupServerSessionState.getBaseServerUrl.returns(mockServerUrl);
            this._wupServerSessionState.getProtocolType.returns(3);

            const expectedHeartbeatEvent = sinon.match.instanceOf(HeartBeatEvent)
                .and(sinon.match.has('category', WorkerStatusCategoryType.WupServerResponse))
                .and(sinon.match.has('status', statusTypes.Error));

            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(wupServerClient, '_onSendDataFailure');

            wupServerClient.sendData({data: 'data'});

            assert.isTrue(this._wupMessageBuilderStub.build.called);
            assert.isTrue(serverCommunicatorSendMessageSpy.called);
            assert.isTrue(wupServerClientOnSendDataSuccessSpy.called);
            assert.isTrue(wupServerClientOnSendDataFailureSpy.notCalled);
            assert.isTrue(this._msgBusStub.publish.called, 'publish was not called');
            assert.isTrue(this._msgBusStub.publish.calledWith(MessageBusEventType.WorkerSystemStatusEvent,
                sinon.match(expectedHeartbeatEvent)), 'publish was called with wrong args');
        });

        it('retry failure callback is called when send fails', function () {
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse, onMessageRetryFailure) {
                onMessageRetryFailure();
            };

            this._wupServerSessionState.getSts.returns('stam-sts');
            this._wupServerSessionState.getStd.returns('stam-std');
            this._wupServerSessionState.getBaseServerUrl.returns(mockServerUrl);
            this._wupServerSessionState.getProtocolType.returns(3);

            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataRetryFailureSpy = sinon.spy(wupServerClient, '_onSendDataRetryFailure');

            wupServerClient.sendData({data: 'data'});

            assert.isTrue(this._wupMessageBuilderStub.build.calledOnce);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[0], DEFAULT_WUP_TYPE);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[1], {data: 'data'});

            assert.isTrue(serverCommunicatorSendMessageSpy.calledOnce);
            assert.deepEqual(serverCommunicatorSendMessageSpy.firstCall.args[0], this._expectedWupMessage);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[1], DEFAULT_REQUEST_TIMEOUT);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[2], wupServerClient._MESSAGE_SEND_RETRIES);

            assert.isTrue(wupServerClientOnSendDataRetryFailureSpy.calledOnce);
            assert.isTrue(wupServerClientOnSendDataSuccessSpy.notCalled);
        });
    });

    describe('startNewSession:\n', function () {
        const messageValues = {
            csid: 'lalalalala',
            context_name: 'bo',
            muid: 'muidiiiddid',
            serverAddress: 'https://lalala.com',
            requestId: 11,
            data: {static_fields: []},
        };

        beforeEach(function () {
            this._expectedWupMessage = new WupMessage();
            this._expectedWupMessage.data = 'resumeSessionWUssssssaPP';

            this._wupMessageBuilderStub.build.returns(this._expectedWupMessage);
        });

        it('start new session message is sent successfully', function () {
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse) {
                onSuccessResponse('{"response": "response"}');
            };

            this._wupServerSessionState.getRequestId.returns(0);
            this._wupServerSessionState.getHasConfiguration.returns(true);

            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(wupServerClient, '_onSendDataFailure');

            wupServerClient.startNewSession(mockCid, mockProtocolType, false, messageValues.csid, messageValues.psid, messageValues.muid, messageValues.context_name, messageValues.serverAddress);

            // Verify the wupServerSessionState values are correct
            assert.isTrue(this._wupServerSessionState.setSid.calledOnce, 'setSid was not called');
            assert.equal(this._wupServerSessionState.setSid.firstCall.args[0], null, 'setSid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setCsid.calledOnce, 'setCsid was not called');
            assert.equal(this._wupServerSessionState.setCsid.firstCall.args[0], messageValues.csid, 'setCsid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setPsid.calledOnce, 'setPsid was not called');
            assert.equal(this._wupServerSessionState.setPsid.firstCall.args[0], messageValues.psid, 'setPsid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setMuid.calledOnce, 'setMuid was not called');
            assert.equal(this._wupServerSessionState.setMuid.firstCall.args[0], messageValues.muid, 'setMuid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setContextName.calledOnce, 'setContextName was not called');
            assert.equal(this._wupServerSessionState.setContextName.firstCall.args[0], messageValues.context_name, 'setContextName param is not as expected');
            assert.isTrue(this._wupServerSessionState.setSts.calledOnce, 'setSts was not called');
            assert.equal(this._wupServerSessionState.setSts.firstCall.args[0], null, 'setSts param is not as expected');
            assert.isTrue(this._wupServerSessionState.setStd.calledOnce, 'setStd was not called');
            assert.equal(this._wupServerSessionState.setStd.firstCall.args[0], null, 'setStd param is not as expected');
            assert.isTrue(this._wupServerSessionState.setRequestId.calledTwice, 'setRequestId was not called');
            assert.equal(this._wupServerSessionState.setRequestId.firstCall.args[0], 0, 'setRequestId value is not as expected');
            assert.equal(this._wupServerSessionState.setRequestId.secondCall.args[0], 0, 'setRequestId value is not as expected');

            const expectedUnpackedData = wupServerClient._createStaticFieldsPart();
            assert.isTrue(this._wupMessageBuilderStub.build.calledOnce);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[0], DEFAULT_WUP_TYPE);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[1], expectedUnpackedData);

            assert.isTrue(serverCommunicatorSendMessageSpy.calledOnce);
            assert.deepEqual(serverCommunicatorSendMessageSpy.firstCall.args[0], this._expectedWupMessage);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[1], DEFAULT_REQUEST_TIMEOUT);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[2], wupServerClient._MESSAGE_SEND_RETRIES);

            assert.isTrue(wupServerClientOnSendDataSuccessSpy.calledOnce);
            assert.equal(wupServerClientOnSendDataSuccessSpy.firstCall.args[0], '{"response": "response"}');

            assert.isTrue(wupServerClientOnSendDataFailureSpy.notCalled);
        });

        it('start new session succeeds even when there is no csid', function () {
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse) {
                onSuccessResponse('{"response": "response"}');
            };

            this._wupServerSessionState.getRequestId.returns(0);
            this._wupServerSessionState.getHasConfiguration.returns(true);

            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(wupServerClient, '_onSendDataFailure');

            wupServerClient.startNewSession(mockCid, mockProtocolType, false, null, messageValues.psid, messageValues.muid, messageValues.context_name, messageValues.serverAddress);

            // Verify the wupServerSessionState values are correct
            assert.isTrue(this._wupServerSessionState.setSid.calledOnce, 'setSid was not called');
            assert.equal(this._wupServerSessionState.setSid.firstCall.args[0], null, 'setSid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setCsid.calledOnce, 'setCsid was not called');
            assert.equal(this._wupServerSessionState.setCsid.firstCall.args[0], null, 'setCsid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setPsid.calledOnce, 'setPsid was not called');
            assert.equal(this._wupServerSessionState.setPsid.firstCall.args[0], messageValues.psid, 'setPsid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setMuid.calledOnce, 'setMuid was not called');
            assert.equal(this._wupServerSessionState.setMuid.firstCall.args[0], messageValues.muid, 'setMuid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setContextName.calledOnce, 'setContextName was not called');
            assert.equal(this._wupServerSessionState.setContextName.firstCall.args[0], messageValues.context_name, 'setContextName param is not as expected');
            assert.isTrue(this._wupServerSessionState.setSts.calledOnce, 'setSts was not called');
            assert.equal(this._wupServerSessionState.setSts.firstCall.args[0], null, 'setSts param is not as expected');
            assert.isTrue(this._wupServerSessionState.setStd.calledOnce, 'setStd was not called');
            assert.equal(this._wupServerSessionState.setStd.firstCall.args[0], null, 'setStd param is not as expected');
            assert.isTrue(this._wupServerSessionState.setRequestId.calledTwice, 'setRequestId was not called');
            assert.equal(this._wupServerSessionState.setRequestId.firstCall.args[0], 0, 'setRequestId value is not as expected');
            assert.equal(this._wupServerSessionState.setRequestId.secondCall.args[0], 0, 'setRequestId value is not as expected');

            const expectedUnpackedData = wupServerClient._createStaticFieldsPart();
            assert.isTrue(this._wupMessageBuilderStub.build.calledOnce);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[0], DEFAULT_WUP_TYPE);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[1], expectedUnpackedData);

            assert.isTrue(serverCommunicatorSendMessageSpy.calledOnce);
            assert.deepEqual(serverCommunicatorSendMessageSpy.firstCall.args[0], this._expectedWupMessage);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[1], DEFAULT_REQUEST_TIMEOUT);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[2], wupServerClient._MESSAGE_SEND_RETRIES);

            assert.isTrue(wupServerClientOnSendDataSuccessSpy.calledOnce);
            assert.equal(wupServerClientOnSendDataSuccessSpy.firstCall.args[0], '{"response": "response"}');

            assert.isTrue(wupServerClientOnSendDataFailureSpy.notCalled);
        });

        it('start new session succeeds even when there is no psid', function () {
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse) {
                onSuccessResponse('{"response": "response"}');
            };

            this._wupServerSessionState.getRequestId.returns(0);
            this._wupServerSessionState.getHasConfiguration.returns(true);

            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(wupServerClient, '_onSendDataFailure');

            wupServerClient.startNewSession(mockCid, mockProtocolType, false, messageValues.csid, null, messageValues.muid, messageValues.context_name, messageValues.serverAddress);

            // Verify the wupServerSessionState values are correct
            assert.isTrue(this._wupServerSessionState.setSid.calledOnce, 'setSid was not called');
            assert.equal(this._wupServerSessionState.setSid.firstCall.args[0], null, 'setSid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setCsid.calledOnce, 'setCsid was not called');
            assert.equal(this._wupServerSessionState.setCsid.firstCall.args[0], messageValues.csid, 'setCsid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setPsid.calledOnce, 'setPsid was not called');
            assert.equal(this._wupServerSessionState.setPsid.firstCall.args[0], null, 'setPsid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setMuid.calledOnce, 'setMuid was not called');
            assert.equal(this._wupServerSessionState.setMuid.firstCall.args[0], messageValues.muid, 'setMuid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setContextName.calledOnce, 'setContextName was not called');
            assert.equal(this._wupServerSessionState.setContextName.firstCall.args[0], messageValues.context_name, 'setContextName param is not as expected');
            assert.isTrue(this._wupServerSessionState.setSts.calledOnce, 'setSts was not called');
            assert.equal(this._wupServerSessionState.setSts.firstCall.args[0], null, 'setSts param is not as expected');
            assert.isTrue(this._wupServerSessionState.setStd.calledOnce, 'setStd was not called');
            assert.equal(this._wupServerSessionState.setStd.firstCall.args[0], null, 'setStd param is not as expected');
            assert.isTrue(this._wupServerSessionState.setRequestId.calledTwice, 'setRequestId was not called');
            assert.equal(this._wupServerSessionState.setRequestId.firstCall.args[0], 0, 'setRequestId value is not as expected');
            assert.equal(this._wupServerSessionState.setRequestId.secondCall.args[0], 0, 'setRequestId value is not as expected');

            const expectedUnpackedData = wupServerClient._createStaticFieldsPart();
            assert.isTrue(this._wupMessageBuilderStub.build.calledOnce);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[0], DEFAULT_WUP_TYPE);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[1], expectedUnpackedData);

            assert.isTrue(serverCommunicatorSendMessageSpy.calledOnce);
            assert.deepEqual(serverCommunicatorSendMessageSpy.firstCall.args[0], this._expectedWupMessage);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[1], DEFAULT_REQUEST_TIMEOUT);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[2], wupServerClient._MESSAGE_SEND_RETRIES);

            assert.isTrue(wupServerClientOnSendDataSuccessSpy.calledOnce);
            assert.equal(wupServerClientOnSendDataSuccessSpy.firstCall.args[0], '{"response": "response"}');

            assert.isTrue(wupServerClientOnSendDataFailureSpy.notCalled);
        });

        it('start new session fails when an invalid muid is provided', function () {
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse) {
                onSuccessResponse('{"response": "response"}');
            };

            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(wupServerClient, '_onSendDataFailure');

            assert.throws(() => {
                    return wupServerClient.startNewSession(mockCid, mockProtocolType, false, messageValues.csid, messageValues.psid,
                      undefined, messageValues.context_name, messageValues.serverAddress);
                },
                Error, 'Invalid muid parameter');

            // Verify the wupServerSessionState values are correct
            assert.isTrue(this._wupServerSessionState.setSid.notCalled, 'setSid was not called');
            assert.isTrue(this._wupServerSessionState.setCsid.notCalled, 'setCsid was not called');
            assert.isTrue(this._wupServerSessionState.setPsid.notCalled, 'setPsid was not called');
            assert.isTrue(this._wupServerSessionState.setMuid.notCalled, 'setMuid was not called');
            assert.isTrue(this._wupServerSessionState.setContextName.notCalled, 'setContextName was not called');
            assert.isTrue(this._wupServerSessionState.setSts.notCalled, 'setSts was not called');
            assert.isTrue(this._wupServerSessionState.setStd.notCalled, 'setStd was not called');
            assert.isTrue(this._wupServerSessionState.setRequestId.notCalled, 'setRequestId was not called');

            assert.isTrue(this._wupMessageBuilderStub.build.notCalled, 'Message Builder build function was called');
            assert.isTrue(serverCommunicatorSendMessageSpy.notCalled, 'Server Communicator sendMessage function was called');
            assert.isTrue(wupServerClientOnSendDataSuccessSpy.notCalled);
            assert.isTrue(wupServerClientOnSendDataFailureSpy.notCalled);
        });

        it('start new session fails when an invalid serverAddress is provided', function () {
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse) {
                onSuccessResponse('{"response": "response"}');
            };

            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(wupServerClient, '_onSendDataFailure');

            assert.throws(() => {
                    return wupServerClient.startNewSession(mockCid, mockProtocolType, false, messageValues.csid, messageValues.psid, messageValues.muid, messageValues.context_name, undefined);
                },
                Error, 'Invalid serverAddress parameter');

            // Verify the wupServerSessionState values are correct
            assert.isTrue(this._wupServerSessionState.setSid.notCalled, 'setSid was not called');
            assert.isTrue(this._wupServerSessionState.setCsid.notCalled, 'setCsid was not called');
            assert.isTrue(this._wupServerSessionState.setPsid.notCalled, 'setPsid was not called');
            assert.isTrue(this._wupServerSessionState.setMuid.notCalled, 'setMuid was not called');
            assert.isTrue(this._wupServerSessionState.setContextName.notCalled, 'setContextName was not called');
            assert.isTrue(this._wupServerSessionState.setSts.notCalled, 'setSts was not called');
            assert.isTrue(this._wupServerSessionState.setStd.notCalled, 'setStd was not called');
            assert.isTrue(this._wupServerSessionState.setRequestId.notCalled, 'setRequestId was not called');

            assert.isTrue(this._wupMessageBuilderStub.build.notCalled, 'Message Builder build function was called');
            assert.isTrue(serverCommunicatorSendMessageSpy.notCalled, 'Server Communicator sendMessage function was called');
            assert.isTrue(wupServerClientOnSendDataSuccessSpy.notCalled);
            assert.isTrue(wupServerClientOnSendDataFailureSpy.notCalled);
        });

        it('start new session with configurations request', function () {
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse) {
                onSuccessResponse('{"response": "response"}');
            };

            this._wupServerSessionState.getRequestId.returns(0);
            // This should cause us to get configurations
            this._wupServerSessionState.getHasConfiguration.returns(false);

            const expectedHeartbeatEvent = sinon.match.instanceOf(HeartBeatEvent)
                .and(sinon.match.has('category', WorkerStatusCategoryType.ConfigurationReceived))
                .and(sinon.match.has('status', statusTypes.Ok));

            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(wupServerClient, '_onSendDataFailure');

            wupServerClient.startNewSession(mockCid, mockProtocolType, false, messageValues.csid, messageValues.psid, messageValues.muid, messageValues.context_name, messageValues.serverAddress);

            // Verify the wupServerSessionState values are correct
            assert.isTrue(this._wupServerSessionState.setSid.calledOnce, 'setSid was not called');
            assert.equal(this._wupServerSessionState.setSid.firstCall.args[0], null, 'setSid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setCsid.calledOnce, 'setCsid was not called');
            assert.equal(this._wupServerSessionState.setCsid.firstCall.args[0], messageValues.csid, 'setCsid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setPsid.calledOnce, 'setPsid was not called');
            assert.equal(this._wupServerSessionState.setPsid.firstCall.args[0], messageValues.psid, 'setPsid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setMuid.calledOnce, 'setMuid was not called');
            assert.equal(this._wupServerSessionState.setMuid.firstCall.args[0], messageValues.muid, 'setMuid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setContextName.calledOnce, 'setContextName was not called');
            assert.equal(this._wupServerSessionState.setContextName.firstCall.args[0], messageValues.context_name, 'setContextName param is not as expected');
            assert.isTrue(this._wupServerSessionState.setSts.calledOnce, 'setSts was not called');
            assert.equal(this._wupServerSessionState.setSts.firstCall.args[0], null, 'setSts param is not as expected');
            assert.isTrue(this._wupServerSessionState.setStd.calledOnce, 'setStd was not called');
            assert.equal(this._wupServerSessionState.setStd.firstCall.args[0], null, 'setStd param is not as expected');
            assert.isTrue(this._wupServerSessionState.setRequestId.calledTwice, 'setRequestId was not called');
            assert.equal(this._wupServerSessionState.setRequestId.firstCall.args[0], 0, 'setRequestId value is not as expected');
            assert.equal(this._wupServerSessionState.setRequestId.secondCall.args[0], 0, 'setRequestId value is not as expected');

            assert.isTrue(this._wupServerSessionState.getHasConfiguration.calledOnce);
            assert.isTrue(this._wupServerSessionState.getHasPendingConfigurationRequest.calledOnce);
            assert.isTrue(this._wupServerSessionState.markConfigurationRequested.calledOnce);

            const expectedUnpackedData = wupServerClient._createStaticFieldsPart();
            assert.isTrue(this._wupMessageBuilderStub.build.calledOnce);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[0], 'js');
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[1], expectedUnpackedData);

            assert.isTrue(serverCommunicatorSendMessageSpy.calledOnce);
            assert.deepEqual(serverCommunicatorSendMessageSpy.firstCall.args[0], this._expectedWupMessage);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[1], DEFAULT_REQUEST_TIMEOUT);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[2], wupServerClient._INFINITE_MESSAGE_SEND_RETRIES);

            assert.isTrue(wupServerClientOnSendDataSuccessSpy.calledOnce);
            assert.equal(wupServerClientOnSendDataSuccessSpy.firstCall.args[0], '{"response": "response"}');
            assert.isTrue(this._msgBusStub.publish.called, 'publish was not called');
            assert.isTrue(this._msgBusStub.publish.calledWith(MessageBusEventType.WorkerSystemStatusEvent,
                sinon.match(expectedHeartbeatEvent)), 'publish was called with wrong args');

            assert.isTrue(wupServerClientOnSendDataFailureSpy.notCalled);
        });

        it('start new session when configurations were already received', function () {
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse) {
                onSuccessResponse('{"response": "response"}');
            };

            this._wupServerSessionState.getRequestId.returns(0);
            // This should cause us to get configurations
            this._wupServerSessionState.getHasConfiguration.returns(true);

            const expectedHeartbeatEvent = sinon.match.instanceOf(HeartBeatEvent)
                .and(sinon.match.has('category', WorkerStatusCategoryType.WupServerResponse))
                .and(sinon.match.has('status', statusTypes.Ok));

            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(wupServerClient, '_onSendDataFailure');

            wupServerClient.startNewSession(mockCid, mockProtocolType, false, messageValues.csid, messageValues.psid, messageValues.muid, messageValues.context_name, messageValues.serverAddress);

            // Verify the wupServerSessionState values are correct
            assert.isTrue(this._wupServerSessionState.setSid.calledOnce, 'setSid was not called');
            assert.equal(this._wupServerSessionState.setSid.firstCall.args[0], null, 'setSid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setCsid.calledOnce, 'setCsid was not called');
            assert.equal(this._wupServerSessionState.setCsid.firstCall.args[0], messageValues.csid, 'setCsid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setPsid.calledOnce, 'setPsid was not called');
            assert.equal(this._wupServerSessionState.setPsid.firstCall.args[0], messageValues.psid, 'setPsid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setMuid.calledOnce, 'setMuid was not called');
            assert.equal(this._wupServerSessionState.setMuid.firstCall.args[0], messageValues.muid, 'setMuid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setContextName.calledOnce, 'setContextName was not called');
            assert.equal(this._wupServerSessionState.setContextName.firstCall.args[0], messageValues.context_name, 'setContextName param is not as expected');
            assert.isTrue(this._wupServerSessionState.setSts.calledOnce, 'setSts was not called');
            assert.equal(this._wupServerSessionState.setSts.firstCall.args[0], null, 'setSts param is not as expected');
            assert.isTrue(this._wupServerSessionState.setStd.calledOnce, 'setStd was not called');
            assert.equal(this._wupServerSessionState.setStd.firstCall.args[0], null, 'setStd param is not as expected');
            assert.isTrue(this._wupServerSessionState.setRequestId.calledTwice, 'setRequestId was not called');
            assert.equal(this._wupServerSessionState.setRequestId.firstCall.args[0], 0, 'setRequestId value is not as expected');
            assert.equal(this._wupServerSessionState.setRequestId.secondCall.args[0], 0, 'setRequestId value is not as expected');

            assert.isTrue(this._wupServerSessionState.getHasConfiguration.calledOnce);
            assert.isFalse(this._wupServerSessionState.getHasPendingConfigurationRequest.calledOnce);
            assert.isFalse(this._wupServerSessionState.markConfigurationRequested.calledOnce);

            const expectedUnpackedData = wupServerClient._createStaticFieldsPart();
            assert.isTrue(this._wupMessageBuilderStub.build.calledOnce);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[0], DEFAULT_WUP_TYPE);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[1], expectedUnpackedData);

            assert.isTrue(serverCommunicatorSendMessageSpy.calledOnce);
            assert.deepEqual(serverCommunicatorSendMessageSpy.firstCall.args[0], this._expectedWupMessage);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[1], DEFAULT_REQUEST_TIMEOUT);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[2], wupServerClient._MESSAGE_SEND_RETRIES);

            assert.isTrue(wupServerClientOnSendDataSuccessSpy.calledOnce);
            assert.equal(wupServerClientOnSendDataSuccessSpy.firstCall.args[0], '{"response": "response"}');
            assert.isTrue(this._msgBusStub.publish.called, 'publish was not called');
            assert.isTrue(this._msgBusStub.publish.calledWith(MessageBusEventType.WorkerSystemStatusEvent,
                sinon.match(expectedHeartbeatEvent)), 'publish was called with wrong args');

            assert.isTrue(wupServerClientOnSendDataFailureSpy.notCalled);
        });

        it('start new session when configurations were already requested', function () {
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse) {
                onSuccessResponse('{"response": "response"}');
            };

            this._wupServerSessionState.getRequestId.returns(0);
            // This should cause us to get configurations
            this._wupServerSessionState.getHasConfiguration.returns(false);
            this._wupServerSessionState.getHasPendingConfigurationRequest.returns(true);

            const expectedHeartbeatEvent = sinon.match.instanceOf(HeartBeatEvent)
                .and(sinon.match.has('category', WorkerStatusCategoryType.WupServerResponse))
                .and(sinon.match.has('status', statusTypes.Ok));

            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(wupServerClient, '_onSendDataFailure');

            wupServerClient.startNewSession(mockCid, mockProtocolType, false, messageValues.csid, messageValues.psid, messageValues.muid, messageValues.context_name, messageValues.serverAddress);

            // Verify the wupServerSessionState values are correct
            assert.isTrue(this._wupServerSessionState.setSid.calledOnce, 'setSid was not called');
            assert.equal(this._wupServerSessionState.setSid.firstCall.args[0], null, 'setSid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setCsid.calledOnce, 'setCsid was not called');
            assert.equal(this._wupServerSessionState.setCsid.firstCall.args[0], messageValues.csid, 'setCsid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setPsid.calledOnce, 'setPsid was not called');
            assert.equal(this._wupServerSessionState.setPsid.firstCall.args[0], messageValues.psid, 'setPsid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setMuid.calledOnce, 'setMuid was not called');
            assert.equal(this._wupServerSessionState.setMuid.firstCall.args[0], messageValues.muid, 'setMuid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setContextName.calledOnce, 'setContextName was not called');
            assert.equal(this._wupServerSessionState.setContextName.firstCall.args[0], messageValues.context_name, 'setContextName param is not as expected');
            assert.isTrue(this._wupServerSessionState.setSts.calledOnce, 'setSts was not called');
            assert.equal(this._wupServerSessionState.setSts.firstCall.args[0], null, 'setSts param is not as expected');
            assert.isTrue(this._wupServerSessionState.setStd.calledOnce, 'setStd was not called');
            assert.equal(this._wupServerSessionState.setStd.firstCall.args[0], null, 'setStd param is not as expected');
            assert.isTrue(this._wupServerSessionState.setRequestId.calledTwice, 'setRequestId was not called');
            assert.equal(this._wupServerSessionState.setRequestId.firstCall.args[0], 0, 'setRequestId value is not as expected');
            assert.equal(this._wupServerSessionState.setRequestId.secondCall.args[0], 0, 'setRequestId value is not as expected');

            assert.isTrue(this._wupServerSessionState.getHasConfiguration.calledOnce);
            assert.isTrue(this._wupServerSessionState.getHasPendingConfigurationRequest.calledOnce);
            assert.isFalse(this._wupServerSessionState.markConfigurationRequested.calledOnce);

            const expectedUnpackedData = wupServerClient._createStaticFieldsPart();
            assert.isTrue(this._wupMessageBuilderStub.build.calledOnce);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[0], DEFAULT_WUP_TYPE);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[1], expectedUnpackedData);

            assert.isTrue(serverCommunicatorSendMessageSpy.calledOnce);
            assert.deepEqual(serverCommunicatorSendMessageSpy.firstCall.args[0], this._expectedWupMessage);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[1], DEFAULT_REQUEST_TIMEOUT);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[2], wupServerClient._MESSAGE_SEND_RETRIES);

            assert.isTrue(wupServerClientOnSendDataSuccessSpy.calledOnce);
            assert.equal(wupServerClientOnSendDataSuccessSpy.firstCall.args[0], '{"response": "response"}');
            assert.isTrue(this._msgBusStub.publish.called, 'publish was not called');
            assert.isTrue(this._msgBusStub.publish.calledWith(MessageBusEventType.WorkerSystemStatusEvent,
                sinon.match(expectedHeartbeatEvent)), 'publish was called with wrong args');

            assert.isTrue(wupServerClientOnSendDataFailureSpy.notCalled);
        });

        it('start new session fails when an invalid server response is provided and heart beat error is sent to main', function () {
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse) {
                onSuccessResponse('{"response": invalid');
            };
            this._wupServerSessionState.getHasConfiguration.returns(false);

            const expectedHeartbeatEvent = sinon.match.instanceOf(HeartBeatEvent)
                .and(sinon.match.has('category', WorkerStatusCategoryType.ConfigurationReceived))
                .and(sinon.match.has('status', statusTypes.Error));

            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(wupServerClient, '_onSendDataFailure');

            wupServerClient.startNewSession(mockCid, mockProtocolType, false, messageValues.csid, messageValues.psid, messageValues.muid, messageValues.context_name, messageValues.serverAddress);

            assert.isTrue(serverCommunicatorSendMessageSpy.called, 'Server Communicator sendMessage function was not called');
            assert.isTrue(wupServerClientOnSendDataSuccessSpy.called);
            assert.isTrue(wupServerClientOnSendDataFailureSpy.notCalled);
            assert.isTrue(this._msgBusStub.publish.called, 'publish was not called');
            assert.isTrue(this._msgBusStub.publish.calledWith(MessageBusEventType.WorkerSystemStatusEvent,
                sinon.match(expectedHeartbeatEvent)), 'publish was called with wrong args');
        });

        it('start new session should reset brand', function () {
            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            wupServerClient.startNewSession(mockCid, mockProtocolType, false, null, messageValues.psid, messageValues.muid, messageValues.context_name, messageValues.serverAddress);
            // Verify the wupServerSessionState brand is reset
            assert.isTrue(this._wupServerSessionState.setBrand.calledOnce, 'setBrand was not called');
            assert.equal(this._wupServerSessionState.setBrand.firstCall.args[0], null);
        });
    });

    describe('resumeSession:\n', function () {
        const messageValues = {
            sid: 'resresres',
            cid: mockCid,
            protocolType: mockProtocolType,
            minifiedUriEnabled: false,
            csid: 'resumeSessionCSID',
            context_name: 'resumeContext',
            muid: 'ddddMuid',
            serverAddress: 'https://aaaa.com',
            requestId: 2,
            data: {static_fields: []},
        };

        beforeEach(function () {
            this._expectedWupMessage = new WupMessage();
            this._expectedWupMessage.data = 'resumeSessionWUPP';

            this._wupMessageBuilderStub.build.returns(this._expectedWupMessage);
        });

        it('resume session message is sent successfully', function () {
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse) {
                onSuccessResponse('{"response": "response"}');
            };

            this._wupServerSessionState.getRequestId.returns(0);
            this._wupServerSessionState.setRequestId.returns(0);
            this._wupServerSessionState.getHasConfiguration.returns(true);

            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(wupServerClient, '_onSendDataFailure');

            wupServerClient.resumeSession(messageValues.sid, messageValues.cid, messageValues.protocolType, messageValues.minifiedUriEnabled, messageValues.csid, messageValues.psid,
              messageValues.muid, messageValues.context_name, messageValues.serverAddress);

            // Verify the wupServerSessionState values are correct
            assert.isTrue(this._wupServerSessionState.setSid.calledOnce, 'setSid was not called');
            assert.equal(this._wupServerSessionState.setSid.firstCall.args[0], messageValues.sid, 'setSid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setCid.calledOnce, 'setCid was not called');
            assert.equal(this._wupServerSessionState.setCid.firstCall.args[0], messageValues.cid, 'setCid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setProtocolType.calledOnce, 'setProtocolType was not called');
            assert.equal(this._wupServerSessionState.setProtocolType.firstCall.args[0], messageValues.protocolType, 'setProtocolType param is not as expected');
            assert.isTrue(this._wupServerSessionState.setShouldMinifyUri.calledOnce, 'setShouldMinifyUri was not called');
            assert.equal(this._wupServerSessionState.setShouldMinifyUri.firstCall.args[0], messageValues.minifiedUriEnabled, 'setProtocolType param is not as expected');
            assert.isTrue(this._wupServerSessionState.setCsid.calledOnce, 'setCsid was not called');
            assert.equal(this._wupServerSessionState.setCsid.firstCall.args[0], messageValues.csid, 'setCsid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setPsid.calledOnce, 'setPsid was not called');
            assert.equal(this._wupServerSessionState.setPsid.firstCall.args[0], messageValues.psid, 'setPsid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setMuid.calledOnce, 'setMuid was not called');
            assert.equal(this._wupServerSessionState.setMuid.firstCall.args[0], messageValues.muid, 'setMuid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setContextName.calledOnce, 'setContextName was not called');
            assert.equal(this._wupServerSessionState.setContextName.firstCall.args[0], messageValues.context_name, 'setContextName param is not as expected');
            assert.isTrue(this._wupServerSessionState.setSts.calledOnce, 'setSts was not called');
            assert.equal(this._wupServerSessionState.setSts.firstCall.args[0], null, 'setSts param is not as expected');
            assert.isTrue(this._wupServerSessionState.setStd.calledOnce, 'setStd was not called');
            assert.equal(this._wupServerSessionState.setStd.firstCall.args[0], null, 'setStd param is not as expected');
            assert.isTrue(this._wupServerSessionState.setRequestId.calledTwice, 'setRequestId was not called');
            assert.equal(this._wupServerSessionState.setRequestId.firstCall.args[0], 0, 'setRequestId value is not as expected');
            assert.equal(this._wupServerSessionState.setRequestId.secondCall.args[0], 0, 'setRequestId value is not as expected');

            const expectedUnpackedData = wupServerClient._createStaticFieldsPart();
            assert.isTrue(this._wupMessageBuilderStub.build.calledOnce);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[0], DEFAULT_WUP_TYPE);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[1], expectedUnpackedData);

            assert.isTrue(serverCommunicatorSendMessageSpy.calledOnce);
            assert.deepEqual(serverCommunicatorSendMessageSpy.firstCall.args[0], this._expectedWupMessage);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[1], DEFAULT_REQUEST_TIMEOUT);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[2], wupServerClient._MESSAGE_SEND_RETRIES);

            assert.isTrue(wupServerClientOnSendDataSuccessSpy.calledOnce);
            assert.equal(wupServerClientOnSendDataSuccessSpy.firstCall.args[0], '{"response": "response"}');

            assert.isTrue(wupServerClientOnSendDataFailureSpy.notCalled);
        });

        it('resume session message is sent with non default requestId if serverState is provided', function () {
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse) {
                onSuccessResponse('{"response": "response"}');
            };

            this._wupServerSessionState.getRequestId.returns(56);
            this._wupServerSessionState.setRequestId.returns(56);
            this._wupServerSessionState.getHasConfiguration.returns(true);

            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(wupServerClient, '_onSendDataFailure');

            wupServerClient.resumeSession(messageValues.sid, messageValues.cid, messageValues.protocolType, messageValues.minifiedUriEnabled, messageValues.csid, messageValues.psid,
              messageValues.muid, messageValues.context_name, messageValues.serverAddress,
                {
                    requestId: 55,
                    sts: 'sts',
                    std: 'std',
                });

            // Verify the wupServerSessionState values are correct
            assert.isTrue(this._wupServerSessionState.setSid.calledOnce, 'setSid was not called');
            assert.equal(this._wupServerSessionState.setSid.firstCall.args[0], messageValues.sid, 'setSid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setCsid.calledOnce, 'setCsid was not called');
            assert.equal(this._wupServerSessionState.setCsid.firstCall.args[0], messageValues.csid, 'setCsid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setPsid.calledOnce, 'setPsid was not called');
            assert.equal(this._wupServerSessionState.setPsid.firstCall.args[0], messageValues.psid, 'setPsid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setMuid.calledOnce, 'setMuid was not called');
            assert.equal(this._wupServerSessionState.setMuid.firstCall.args[0], messageValues.muid, 'setMuid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setContextName.calledOnce, 'setContextName was not called');
            assert.equal(this._wupServerSessionState.setContextName.firstCall.args[0], messageValues.context_name, 'setContextName param is not as expected');
            assert.isTrue(this._wupServerSessionState.setSts.calledOnce, 'setSts was not called');
            assert.equal(this._wupServerSessionState.setSts.firstCall.args[0], 'sts', 'setSts param is not as expected');
            assert.isTrue(this._wupServerSessionState.setStd.calledOnce, 'setStd was not called');
            assert.equal(this._wupServerSessionState.setStd.firstCall.args[0], 'std', 'setStd param is not as expected');
            assert.isTrue(this._wupServerSessionState.setRequestId.calledTwice, 'setRequestId was not called');
            assert.equal(this._wupServerSessionState.setRequestId.firstCall.args[0], 56, 'setRequestId value is not as expected');
            assert.equal(this._wupServerSessionState.setRequestId.secondCall.args[0], 56, 'setRequestId value is not as expected');

            const expectedUnpackedData = wupServerClient._createStaticFieldsPart();
            assert.isTrue(this._wupMessageBuilderStub.build.calledOnce);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[0], DEFAULT_WUP_TYPE);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[1], expectedUnpackedData);

            assert.isTrue(serverCommunicatorSendMessageSpy.calledOnce);
            assert.deepEqual(serverCommunicatorSendMessageSpy.firstCall.args[0], this._expectedWupMessage);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[1], DEFAULT_REQUEST_TIMEOUT);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[2], wupServerClient._MESSAGE_SEND_RETRIES);

            assert.isTrue(wupServerClientOnSendDataSuccessSpy.calledOnce);
            assert.equal(wupServerClientOnSendDataSuccessSpy.firstCall.args[0], '{"response": "response"}');

            assert.isTrue(wupServerClientOnSendDataFailureSpy.notCalled);
        });

        it('resume session succeeds even when there is no csid', function () {
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse) {
                onSuccessResponse('{"response": "response"}');
            };

            this._wupServerSessionState.getRequestId.returns(0);
            this._wupServerSessionState.setRequestId.returns(0);
            this._wupServerSessionState.getHasConfiguration.returns(true);

            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(wupServerClient, '_onSendDataFailure');

            wupServerClient.resumeSession(messageValues.sid,messageValues.cid, messageValues.protocolType, messageValues.minifiedUriEnabled,
              null, messageValues.psid, messageValues.muid, messageValues.context_name, messageValues.serverAddress);

            // Verify the wupServerSessionState values are correct
            assert.isTrue(this._wupServerSessionState.setSid.calledOnce, 'setSid was not called');
            assert.equal(this._wupServerSessionState.setSid.firstCall.args[0], messageValues.sid, 'setSid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setCsid.calledOnce, 'setCsid was not called');
            assert.equal(this._wupServerSessionState.setCsid.firstCall.args[0], null, 'setCsid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setPsid.calledOnce, 'setPsid was not called');
            assert.equal(this._wupServerSessionState.setPsid.firstCall.args[0], messageValues.psid, 'setPsid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setMuid.calledOnce, 'setMuid was not called');
            assert.equal(this._wupServerSessionState.setMuid.firstCall.args[0], messageValues.muid, 'setMuid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setContextName.calledOnce, 'setContextName was not called');
            assert.equal(this._wupServerSessionState.setContextName.firstCall.args[0], messageValues.context_name, 'setContextName param is not as expected');
            assert.isTrue(this._wupServerSessionState.setSts.calledOnce, 'setSts was not called');
            assert.equal(this._wupServerSessionState.setSts.firstCall.args[0], null, 'setSts param is not as expected');
            assert.isTrue(this._wupServerSessionState.setStd.calledOnce, 'setStd was not called');
            assert.equal(this._wupServerSessionState.setStd.firstCall.args[0], null, 'setStd param is not as expected');
            assert.isTrue(this._wupServerSessionState.setRequestId.calledTwice, 'setRequestId was not called');
            assert.equal(this._wupServerSessionState.setRequestId.firstCall.args[0], 0, 'setRequestId value is not as expected');
            assert.equal(this._wupServerSessionState.setRequestId.secondCall.args[0], 0, 'setRequestId value is not as expected');

            const expectedUnpackedData = wupServerClient._createStaticFieldsPart();
            assert.isTrue(this._wupMessageBuilderStub.build.calledOnce);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[0], DEFAULT_WUP_TYPE);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[1], expectedUnpackedData);

            assert.isTrue(serverCommunicatorSendMessageSpy.calledOnce);
            assert.deepEqual(serverCommunicatorSendMessageSpy.firstCall.args[0], this._expectedWupMessage);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[1], DEFAULT_REQUEST_TIMEOUT);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[2], wupServerClient._MESSAGE_SEND_RETRIES);

            assert.isTrue(wupServerClientOnSendDataSuccessSpy.calledOnce);
            assert.equal(wupServerClientOnSendDataSuccessSpy.firstCall.args[0], '{"response": "response"}');

            assert.isTrue(wupServerClientOnSendDataFailureSpy.notCalled);
        });

        it('resume session succeeds even when there is no psid', function () {
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse) {
                onSuccessResponse('{"response": "response"}');
            };

            this._wupServerSessionState.getRequestId.returns(0);
            this._wupServerSessionState.setRequestId.returns(0);
            this._wupServerSessionState.getHasConfiguration.returns(true);

            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(wupServerClient, '_onSendDataFailure');

            wupServerClient.resumeSession(messageValues.sid, messageValues.cid, messageValues.protocolType, messageValues.minifiedUriEnabled,
              messageValues.csid, null, messageValues.muid, messageValues.context_name, messageValues.serverAddress);

            // Verify the wupServerSessionState values are correct
            assert.isTrue(this._wupServerSessionState.setSid.calledOnce, 'setSid was not called');
            assert.equal(this._wupServerSessionState.setSid.firstCall.args[0], messageValues.sid, 'setSid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setCsid.calledOnce, 'setCsid was not called');
            assert.equal(this._wupServerSessionState.setCsid.firstCall.args[0], messageValues.csid, 'setCsid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setPsid.calledOnce, 'setPsid was not called');
            assert.equal(this._wupServerSessionState.setPsid.firstCall.args[0], null, 'setPsid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setMuid.calledOnce, 'setMuid was not called');
            assert.equal(this._wupServerSessionState.setMuid.firstCall.args[0], messageValues.muid, 'setMuid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setContextName.calledOnce, 'setContextName was not called');
            assert.equal(this._wupServerSessionState.setContextName.firstCall.args[0], messageValues.context_name, 'setContextName param is not as expected');
            assert.isTrue(this._wupServerSessionState.setSts.calledOnce, 'setSts was not called');
            assert.equal(this._wupServerSessionState.setSts.firstCall.args[0], null, 'setSts param is not as expected');
            assert.isTrue(this._wupServerSessionState.setStd.calledOnce, 'setStd was not called');
            assert.equal(this._wupServerSessionState.setStd.firstCall.args[0], null, 'setStd param is not as expected');
            assert.isTrue(this._wupServerSessionState.setRequestId.calledTwice, 'setRequestId was not called');
            assert.equal(this._wupServerSessionState.setRequestId.firstCall.args[0], 0, 'setRequestId value is not as expected');
            assert.equal(this._wupServerSessionState.setRequestId.secondCall.args[0], 0, 'setRequestId value is not as expected');

            const expectedUnpackedData = wupServerClient._createStaticFieldsPart();
            assert.isTrue(this._wupMessageBuilderStub.build.calledOnce);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[0], DEFAULT_WUP_TYPE);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[1], expectedUnpackedData);

            assert.isTrue(serverCommunicatorSendMessageSpy.calledOnce);
            assert.deepEqual(serverCommunicatorSendMessageSpy.firstCall.args[0], this._expectedWupMessage);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[1], DEFAULT_REQUEST_TIMEOUT);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[2], wupServerClient._MESSAGE_SEND_RETRIES);

            assert.isTrue(wupServerClientOnSendDataSuccessSpy.calledOnce);
            assert.equal(wupServerClientOnSendDataSuccessSpy.firstCall.args[0], '{"response": "response"}');

            assert.isTrue(wupServerClientOnSendDataFailureSpy.notCalled);
        });

        it('resume session fails when an invalid sid is provided', function () {
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse) {
                onSuccessResponse('{"response": "response"}');
            };

            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(wupServerClient, '_onSendDataFailure');

            assert.throws(() => {
                    return wupServerClient.resumeSession(null,messageValues.cid, messageValues.protocolType, messageValues.minifiedUriEnabled,
                      messageValues.csid, messageValues.psid, messageValues.muid, messageValues.context_name, messageValues.serverAddress);
                },
                Error, 'Invalid sid parameter');

            // Verify the wupServerSessionState values are correct
            assert.isTrue(this._wupServerSessionState.setSid.notCalled, 'setSid was called');
            assert.isTrue(this._wupServerSessionState.setCsid.notCalled, 'setCsid was called');
            assert.isTrue(this._wupServerSessionState.setPsid.notCalled, 'setPsid was called');
            assert.isTrue(this._wupServerSessionState.setMuid.notCalled, 'setMuid was called');
            assert.isTrue(this._wupServerSessionState.setContextName.notCalled, 'setContextName was called');
            assert.isTrue(this._wupServerSessionState.setSts.notCalled, 'setSts was called');
            assert.isTrue(this._wupServerSessionState.setStd.notCalled, 'setStd was called');
            assert.isTrue(this._wupServerSessionState.setRequestId.notCalled, 'setRequestId was called');

            assert.isTrue(this._wupMessageBuilderStub.build.notCalled, 'Message Builder build function was called');
            assert.isTrue(serverCommunicatorSendMessageSpy.notCalled, 'Server Communicator sendMessage function was called');
            assert.isTrue(wupServerClientOnSendDataSuccessSpy.notCalled);
            assert.isTrue(wupServerClientOnSendDataFailureSpy.notCalled);
        });

        it('resume session fails when an invalid muid is provided', function () {
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse) {
                onSuccessResponse('{"response": "response"}');
            };

            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const wupServerClient = new WupServerClient(
                this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(wupServerClient, '_onSendDataFailure');

            assert.throws(() => {
                return wupServerClient.resumeSession(messageValues.sid, messageValues.cid, messageValues.protocolType, messageValues.minifiedUriEnabled,
                  messageValues.csid, messageValues.psid, undefined, messageValues.context_name,
                    messageValues.serverAddress);
            }, Error, 'Invalid muid parameter');

            // Verify the wupServerSessionState values are correct
            assert.isTrue(this._wupServerSessionState.setSid.notCalled, 'setSid was called');
            assert.isTrue(this._wupServerSessionState.setCsid.notCalled, 'setCsid was called');
            assert.isTrue(this._wupServerSessionState.setPsid.notCalled, 'setPsid was called');
            assert.isTrue(this._wupServerSessionState.setMuid.notCalled, 'setMuid was called');
            assert.isTrue(this._wupServerSessionState.setContextName.notCalled, 'setContextName was called');
            assert.isTrue(this._wupServerSessionState.setSts.notCalled, 'setSts was called');
            assert.isTrue(this._wupServerSessionState.setStd.notCalled, 'setStd was called');
            assert.isTrue(this._wupServerSessionState.setRequestId.notCalled, 'setRequestId was called');

            assert.isTrue(this._wupMessageBuilderStub.build.notCalled, 'Message Builder build function was called');
            assert.isTrue(serverCommunicatorSendMessageSpy.notCalled, 'Server Communicator sendMessage function was called');
            assert.isTrue(wupServerClientOnSendDataSuccessSpy.notCalled);
            assert.isTrue(wupServerClientOnSendDataFailureSpy.notCalled);
        });

        it('resume session fails when an invalid serverAddress is provided', function () {
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse) {
                onSuccessResponse('{"response": "response"}');
            };

            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(wupServerClient, '_onSendDataFailure');

            assert.throws(() => {
                    return wupServerClient.resumeSession(messageValues.sid, messageValues.cid, messageValues.protocolType, messageValues.minifiedUriEnabled,
                      messageValues.csid, messageValues.psid, messageValues.muid, messageValues.context_name, undefined);
                },
                Error, 'Invalid serverAddress parameter');

            // Verify the wupServerSessionState values are correct
            assert.isTrue(this._wupServerSessionState.setSid.notCalled, 'setSid was called');
            assert.isTrue(this._wupServerSessionState.setCsid.notCalled, 'setCsid was called');
            assert.isTrue(this._wupServerSessionState.setPsid.notCalled, 'setPsid was called');
            assert.isTrue(this._wupServerSessionState.setMuid.notCalled, 'setMuid was called');
            assert.isTrue(this._wupServerSessionState.setContextName.notCalled, 'setContextName was called');
            assert.isTrue(this._wupServerSessionState.setSts.notCalled, 'setSts was called');
            assert.isTrue(this._wupServerSessionState.setStd.notCalled, 'setStd was called');
            assert.isTrue(this._wupServerSessionState.setRequestId.notCalled, 'setRequestId was called');

            assert.isTrue(this._wupMessageBuilderStub.build.notCalled, 'Message Builder build function was called');
            assert.isTrue(serverCommunicatorSendMessageSpy.notCalled, 'Server Communicator sendMessage function was called');
            assert.isTrue(wupServerClientOnSendDataSuccessSpy.notCalled);
            assert.isTrue(wupServerClientOnSendDataFailureSpy.notCalled);
        });
    });

    describe('updateCsid tests:\n', function () {
        beforeEach(function () {
            this._expectedWupMessage = new WupMessage();
            this._expectedWupMessage.data = 'wuppyWup';

            this._wupMessageBuilderStub.build.returns(this._expectedWupMessage);
        });

        it('update csid message is sent successfully', function () {
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse) {
                onSuccessResponse('{"response": "response"}');
            };

            this._wupServerSessionState.getRequestId.returns(111);
            this._wupServerSessionState.incrementRequestId.returns(111);
            this._wupServerSessionState.getContextName.returns('namerCCCC');
            this._wupServerSessionState.getSid.returns('SID TADADA');
            this._wupServerSessionState.getCsid.returns('newCSID');
            this._wupServerSessionState.getPsid.returns('PsiD TADADA');
            this._wupServerSessionState.getMuid.returns('Muid TADADA');
            this._wupServerSessionState.getSts.returns('sts');
            this._wupServerSessionState.getStd.returns('std');

            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(wupServerClient, '_onSendDataFailure');

            wupServerClient.updateCsid('newCSID');

            const data = {static_fields: []};
            data.static_fields.push(
                ['requestId', this._wupServerSessionState.getRequestId()],
                ['contextId', this._wupServerSessionState.getContextName()],
                ['sessionId', this._wupServerSessionState.getSid()],
                ['customerSessionId', 'newCSID'],
                ['partnerSessionId', this._wupServerSessionState.getPsid()],
                ['muid', this._wupServerSessionState.getMuid()],
            );

            assert.isTrue(this._wupServerSessionState.incrementRequestId.calledOnce, 'incrementRequestId was not called');
            assert.isTrue(this._wupServerSessionState.setCsid.calledOnce, 'setCsid was not called');
            assert.equal(this._wupServerSessionState.setCsid.firstCall.args[0], 'newCSID', 'setCSID param is not as expected');
            assert.isTrue(this._wupMessageBuilderStub.build.calledOnce);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[0], DEFAULT_WUP_TYPE);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[1], data);

            assert.isTrue(serverCommunicatorSendMessageSpy.calledOnce);
            assert.deepEqual(serverCommunicatorSendMessageSpy.firstCall.args[0], this._expectedWupMessage);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[1], DEFAULT_REQUEST_TIMEOUT);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[2], wupServerClient._MESSAGE_SEND_RETRIES);

            assert.isTrue(wupServerClientOnSendDataSuccessSpy.calledOnce);
            assert.equal(wupServerClientOnSendDataSuccessSpy.firstCall.args[0], '{"response": "response"}');

            assert.isTrue(wupServerClientOnSendDataFailureSpy.notCalled);
        });

        it('csid update is sent even when there is no sts', function () {
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse) {
                onSuccessResponse('{"response": "response"}');
            };

            this._wupServerSessionState.getRequestId.returns(111);
            this._wupServerSessionState.incrementRequestId.returns(111);
            this._wupServerSessionState.getContextName.returns('namerCCCC');
            this._wupServerSessionState.getSid.returns('SID TADADA');
            this._wupServerSessionState.getCsid.returns('newerCSID');
            this._wupServerSessionState.getPsid.returns('PsiD TADADA');
            this._wupServerSessionState.getMuid.returns('Muid TADADA');
            this._wupServerSessionState.getStd.returns('std');

            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(wupServerClient, '_onSendDataFailure');

            wupServerClient.updateCsid('newerCSID');

            const data = {static_fields: []};
            data.static_fields.push(
                ['requestId', this._wupServerSessionState.getRequestId()],
                ['contextId', this._wupServerSessionState.getContextName()],
                ['sessionId', this._wupServerSessionState.getSid()],
                ['customerSessionId', 'newerCSID'],
                ['partnerSessionId', this._wupServerSessionState.getPsid()],
                ['muid', this._wupServerSessionState.getMuid()],
            );

            assert.isTrue(this._wupServerSessionState.incrementRequestId.calledOnce, 'incrementRequestId was not called');
            assert.isTrue(this._wupServerSessionState.setCsid.calledOnce, 'setCsid was not called');
            assert.equal(this._wupServerSessionState.setCsid.firstCall.args[0], 'newerCSID', 'setCSID param is not as expected');
            assert.isTrue(this._wupMessageBuilderStub.build.calledOnce);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[0], DEFAULT_WUP_TYPE);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[1], data);

            assert.isTrue(serverCommunicatorSendMessageSpy.calledOnce);
            assert.deepEqual(serverCommunicatorSendMessageSpy.firstCall.args[0], this._expectedWupMessage);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[1], DEFAULT_REQUEST_TIMEOUT);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[2], wupServerClient._MESSAGE_SEND_RETRIES);

            assert.isTrue(wupServerClientOnSendDataSuccessSpy.calledOnce);
            assert.equal(wupServerClientOnSendDataSuccessSpy.firstCall.args[0], '{"response": "response"}');

            assert.isTrue(wupServerClientOnSendDataFailureSpy.notCalled);
        });

        it('csid update is sent even when there is no std', function () {
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse) {
                onSuccessResponse('{"response": "response"}');
            };

            this._wupServerSessionState.getRequestId.returns(111);
            this._wupServerSessionState.incrementRequestId.returns(111);
            this._wupServerSessionState.getContextName.returns('namerCCCC');
            this._wupServerSessionState.getSid.returns('SID TADADA');
            this._wupServerSessionState.getCsid.returns('newNewNew');
            this._wupServerSessionState.getPsid.returns('PsiD TADADA');
            this._wupServerSessionState.getMuid.returns('Muid TADADA');
            this._wupServerSessionState.getSts.returns('sts');

            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(wupServerClient, '_onSendDataFailure');

            wupServerClient.updateCsid('newNewNew');

            const data = {static_fields: []};
            data.static_fields.push(
                ['requestId', this._wupServerSessionState.getRequestId()],
                ['contextId', this._wupServerSessionState.getContextName()],
                ['sessionId', this._wupServerSessionState.getSid()],
                ['customerSessionId', 'newNewNew'],
                ['partnerSessionId', this._wupServerSessionState.getPsid()],
                ['muid', this._wupServerSessionState.getMuid()],
            );

            assert.isTrue(this._wupServerSessionState.incrementRequestId.calledOnce, 'incrementRequestId was not called');
            assert.isTrue(this._wupServerSessionState.setCsid.calledOnce, 'setCsid was not called');
            assert.equal(this._wupServerSessionState.setCsid.firstCall.args[0], 'newNewNew', 'setCSID param is not as expected');
            assert.isTrue(this._wupMessageBuilderStub.build.calledOnce);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[0], DEFAULT_WUP_TYPE);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[1], data);

            assert.isTrue(serverCommunicatorSendMessageSpy.calledOnce);
            assert.deepEqual(serverCommunicatorSendMessageSpy.firstCall.args[0], this._expectedWupMessage);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[1], DEFAULT_REQUEST_TIMEOUT);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[2], wupServerClient._MESSAGE_SEND_RETRIES);

            assert.isTrue(wupServerClientOnSendDataSuccessSpy.calledOnce);
            assert.equal(wupServerClientOnSendDataSuccessSpy.firstCall.args[0], '{"response": "response"}');

            assert.isTrue(wupServerClientOnSendDataFailureSpy.notCalled);
        });
    });

    describe('updatePsid tests:\n', function () {
        beforeEach(function () {
            this._expectedWupMessage = new WupMessage();
            this._expectedWupMessage.data = 'wuppyWup';

            this._wupMessageBuilderStub.build.returns(this._expectedWupMessage);
        });

        it('update psid message is sent successfully', function () {
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse) {
                onSuccessResponse('{"response": "response"}');
            };

            this._wupServerSessionState.getRequestId.returns(111);
            this._wupServerSessionState.incrementRequestId.returns(111);
            this._wupServerSessionState.getContextName.returns('namerCCCC');
            this._wupServerSessionState.getSid.returns('SID TADADA');
            this._wupServerSessionState.getCsid.returns('newCSID');
            this._wupServerSessionState.getPsid.returns('newPSID');
            this._wupServerSessionState.getMuid.returns('Muid TADADA');
            this._wupServerSessionState.getSts.returns('sts');
            this._wupServerSessionState.getStd.returns('std');

            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(wupServerClient, '_onSendDataFailure');

            wupServerClient.updatePsid('newPSID');

            const data = {static_fields: []};
            data.static_fields.push(
                ['requestId', this._wupServerSessionState.getRequestId()],
                ['contextId', this._wupServerSessionState.getContextName()],
                ['sessionId', this._wupServerSessionState.getSid()],
                ['customerSessionId', this._wupServerSessionState.getCsid()],
                ['partnerSessionId', 'newPSID'],
                ['muid', this._wupServerSessionState.getMuid()],
            );

            assert.isTrue(this._wupServerSessionState.incrementRequestId.calledOnce, 'incrementRequestId was not called');
            assert.isTrue(this._wupServerSessionState.setPsid.calledOnce, 'setPsid was not called');
            assert.equal(this._wupServerSessionState.setPsid.firstCall.args[0], 'newPSID', 'setPsid param is not as expected');
            assert.isTrue(this._wupMessageBuilderStub.build.calledOnce);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[0], DEFAULT_WUP_TYPE);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[1], data);

            assert.isTrue(serverCommunicatorSendMessageSpy.calledOnce);
            assert.deepEqual(serverCommunicatorSendMessageSpy.firstCall.args[0], this._expectedWupMessage);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[1], DEFAULT_REQUEST_TIMEOUT);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[2], wupServerClient._MESSAGE_SEND_RETRIES);

            assert.isTrue(wupServerClientOnSendDataSuccessSpy.calledOnce);
            assert.equal(wupServerClientOnSendDataSuccessSpy.firstCall.args[0], '{"response": "response"}');

            assert.isTrue(wupServerClientOnSendDataFailureSpy.notCalled);
        });

        it('psid update is sent even when there is no sts', function () {
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse) {
                onSuccessResponse('{"response": "response"}');
            };

            this._wupServerSessionState.getRequestId.returns(111);
            this._wupServerSessionState.incrementRequestId.returns(111);
            this._wupServerSessionState.getContextName.returns('namerCCCC');
            this._wupServerSessionState.getSid.returns('SID TADADA');
            this._wupServerSessionState.getCsid.returns('newCSID');
            this._wupServerSessionState.getPsid.returns('newerPSID');
            this._wupServerSessionState.getMuid.returns('Muid TADADA');
            this._wupServerSessionState.getStd.returns('std');

            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(wupServerClient, '_onSendDataFailure');

            wupServerClient.updatePsid('newerPSID');

            const data = {static_fields: []};
            data.static_fields.push(
                ['requestId', this._wupServerSessionState.getRequestId()],
                ['contextId', this._wupServerSessionState.getContextName()],
                ['sessionId', this._wupServerSessionState.getSid()],
                ['customerSessionId', this._wupServerSessionState.getCsid()],
                ['partnerSessionId', 'newerPSID'],
                ['muid', this._wupServerSessionState.getMuid()],
            );

            assert.isTrue(this._wupServerSessionState.incrementRequestId.calledOnce, 'incrementRequestId was not called');
            assert.isTrue(this._wupServerSessionState.setPsid.calledOnce, 'setPsid was not called');
            assert.equal(this._wupServerSessionState.setPsid.firstCall.args[0], 'newerPSID', 'setPsid param is not as expected');
            assert.isTrue(this._wupMessageBuilderStub.build.calledOnce);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[0], DEFAULT_WUP_TYPE);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[1], data);

            assert.isTrue(serverCommunicatorSendMessageSpy.calledOnce);
            assert.deepEqual(serverCommunicatorSendMessageSpy.firstCall.args[0], this._expectedWupMessage);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[1], DEFAULT_REQUEST_TIMEOUT);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[2], wupServerClient._MESSAGE_SEND_RETRIES);

            assert.isTrue(wupServerClientOnSendDataSuccessSpy.calledOnce);
            assert.equal(wupServerClientOnSendDataSuccessSpy.firstCall.args[0], '{"response": "response"}');

            assert.isTrue(wupServerClientOnSendDataFailureSpy.notCalled);
        });

        it('psid update is sent even when there is no std', function () {
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse) {
                onSuccessResponse('{"response": "response"}');
            };
            this._wupServerSessionState.getRequestId.returns(111);
            this._wupServerSessionState.incrementRequestId.returns(111);
            this._wupServerSessionState.getContextName.returns('namerCCCC');
            this._wupServerSessionState.getSid.returns('SID TADADA');
            this._wupServerSessionState.getCsid.returns('newCSID');
            this._wupServerSessionState.getPsid.returns('newNewNew');
            this._wupServerSessionState.getMuid.returns('Muid TADADA');
            this._wupServerSessionState.getSts.returns('sts');

            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(wupServerClient, '_onSendDataFailure');

            wupServerClient.updatePsid('newNewNew');

            const data = {static_fields: []};
            data.static_fields.push(
                ['requestId', this._wupServerSessionState.getRequestId()],
                ['contextId', this._wupServerSessionState.getContextName()],
                ['sessionId', this._wupServerSessionState.getSid()],
                ['customerSessionId', this._wupServerSessionState.getCsid()],
                ['partnerSessionId', 'newNewNew'],
                ['muid', this._wupServerSessionState.getMuid()],
            );

            assert.isTrue(this._wupServerSessionState.incrementRequestId.calledOnce, 'incrementRequestId was not called');
            assert.isTrue(this._wupServerSessionState.setPsid.calledOnce, 'setPsid was not called');
            assert.equal(this._wupServerSessionState.setPsid.firstCall.args[0], 'newNewNew', 'setPsid param is not as expected');
            assert.isTrue(this._wupMessageBuilderStub.build.calledOnce);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[0], DEFAULT_WUP_TYPE);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[1], data);

            assert.isTrue(serverCommunicatorSendMessageSpy.calledOnce);
            assert.deepEqual(serverCommunicatorSendMessageSpy.firstCall.args[0], this._expectedWupMessage);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[1], DEFAULT_REQUEST_TIMEOUT);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[2], wupServerClient._MESSAGE_SEND_RETRIES);

            assert.isTrue(wupServerClientOnSendDataSuccessSpy.calledOnce);
            assert.equal(wupServerClientOnSendDataSuccessSpy.firstCall.args[0], '{"response": "response"}');

            assert.isTrue(wupServerClientOnSendDataFailureSpy.notCalled);
        });
    });

    describe('isReady tests:\n', function () {
        it('returns true if component is ready', function () {
            this._serverCommunicatorStub.isReadyToSendData.returns(true);

            this._wupServerSessionState.getSts.returns('stam-sts');
            this._wupServerSessionState.getStd.returns('stam-std');
            this._wupServerSessionState.getProtocolType.returns(3);

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const isReady = wupServerClient.isReady();

            assert.isTrue(isReady);
        });

        it('returns false if there is no sts', function () {
            this._serverCommunicatorStub.isReadyToSendData.returns(true);

            this._wupServerSessionState.setStd.returns('std');
            this._wupServerSessionState.getProtocolType.returns(3);

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const isReady = wupServerClient.isReady();

            assert.isFalse(isReady);
        });

        it('returns false if there is no std', function () {
            this._serverCommunicatorStub.isReadyToSendData.returns(true);

            this._wupServerSessionState.setSts.returns('sts');
            this._wupServerSessionState.getProtocolType.returns(3);

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const isReady = wupServerClient.isReady();

            assert.isFalse(isReady);
        });
    });

    describe('setRequestTimeout tests:\n', function () {
        it('request timeout is set successfully', function () {
            this._wupServerSessionState.getSts.returns('stam-sts');
            this._wupServerSessionState.getStd.returns('stam-std');
            this._wupServerSessionState.getBaseServerUrl.returns(mockServerUrl);
            this._wupServerSessionState.getProtocolType.returns(3);

            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            wupServerClient.setRequestTimeout(1231221111);

            wupServerClient.sendData({data: 'data'});

            assert.isTrue(this._serverCommunicatorStub.sendMessage.calledOnce);
            assert.deepEqual(this._serverCommunicatorStub.sendMessage.firstCall.args[0], this._expectedWupMessage);
            assert.equal(this._serverCommunicatorStub.sendMessage.firstCall.args[1], 1231221111);
            assert.equal(this._serverCommunicatorStub.sendMessage.firstCall.args[2], wupServerClient._MESSAGE_SEND_RETRIES);
        });
    });
    describe('setConfigurationWupMessage tests:\n', function () {
        it('ConfigurationWupMessage is set successfully', function () {
            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            wupServerClient.setConfigurationWupMessage();

            wupServerClient.sendData({data: 'data'});

            assert.isTrue(this._retryMessageStub.updateSettings.calledOnce);
        });
    });

    describe('updateBrand tests:\n', function () {
        it('should update brand in session state', function () {
            const wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            wupServerClient.updateBrand('brand123');

            assert.isTrue(this._wupServerSessionState.setBrand.calledOnce, 'WupServerSessionState setBrand was not called');
            assert.equal(this._wupServerSessionState.setBrand.firstCall.args[0], 'brand123', 'WupServerSessionState setBrand was not called with correct args');
        });
    });

    describe('WupServerClient new contract tests', function () {
        let wupServerClient;
        beforeEach(function () {
            wupServerClient = new WupServerClient(this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);
        });

        afterEach(function () {
            wupServerClient = null;
        });

        it('should return false if not ready', function () {
            this._wupServerSessionState.getOtt.returns(null);
            this._wupServerSessionState.getBaseServerUrl.returns(mockServerUrl);
            this._wupServerSessionState.getProtocolType.returns(4);

            const isReady = wupServerClient.isReady();
            assert.isFalse(isReady, 'isReady should return false');
        });
        it('should return true if ready', function () {
            this._wupServerSessionState.getOtt.returns('ott');
            this._wupServerSessionState.getBaseServerUrl.returns(mockServerUrl);
            this._wupServerSessionState.getProtocolType.returns(4);
            this._serverCommunicatorStub.isReadyToSendData.returns(true);

            const isReady = wupServerClient.isReady();
            assert.isTrue(isReady, 'isReady should return true');
        });

        it('should send data when ott is not null', function () {
            wupServerClient._sendMessage = this.sandbox.spy();
            this._wupServerSessionState.getOtt.returns('ott');
            this._wupServerSessionState.getBaseServerUrl.returns(mockServerUrl);
            this._wupServerSessionState.getProtocolType.returns(4);

            wupServerClient.sendData({data: 'data'});

            assert.isTrue(wupServerClient._sendMessage.calledOnce, 'sendMessage should be called once');
            assert.isTrue(wupServerClient._sendMessage.calledWith({data: 'data'}),
                'sendMessage should be called with correct args');
        });

        it('should not send data when ott is null', function () {
            wupServerClient._sendMessage = this.sandbox.spy();
            this._wupServerSessionState.getOtt.returns(null);
            this._wupServerSessionState.getBaseServerUrl.returns(mockServerUrl);
            this._wupServerSessionState.getProtocolType.returns(4);

            assert.isTrue(wupServerClient._sendMessage.notCalled, 'sendMessage should be called once');
        });
        it('should send error log when ott is null', function () {
            wupServerClient._sendMessage = this.sandbox.spy();
            this._wupServerSessionState.getBaseServerUrl.returns(mockServerUrl);
            this._wupServerSessionState.getProtocolType.returns(4);
            const logArgs = this.sandbox.stub(Log, 'error');

            wupServerClient.sendData({data: 'data'});

            assert.isTrue(logArgs.calledOnce, 'logArgs should be called once');
            assert.equal(logArgs.firstCall.args[0], 'Unable to send data. ott is undefined', 'logArgs should be called with correct args');
        });
        it('should send error log when std or sts is null', function () {
            wupServerClient._sendMessage = this.sandbox.spy();
            this._wupServerSessionState.getOtt.returns(null);
            this._wupServerSessionState.getStd.returns(null);
            this._wupServerSessionState.getBaseServerUrl.returns(mockServerUrl);
            this._wupServerSessionState.getProtocolType.returns(3);
            const logArgs = this.sandbox.stub(Log, 'error');

            wupServerClient.sendData({data: 'data'});

            assert.isTrue(logArgs.calledOnce, 'logArgs should be called once');
            assert.equal(logArgs.firstCall.args[0], 'Unable to send data. sts or std is undefined', 'logArgs should be called with correct args');
        });
    });

    describe('agentType secondary tests\n', function () {
        const messageValues = {
            sid: 'resresres',
            cid: mockCid,
            protocolType: mockProtocolType,
            minifiedUriEnabled: false,
            csid: 'resumeSessionCSID',
            context_name: 'resumeContext',
            muid: null,
            serverAddress: 'https://aaaa.com',
            requestId: 2,
            data: {static_fields: []},
        };

        beforeEach(function () {
            this._expectedWupMessage = new WupMessage();
            this._expectedWupMessage.data = 'resumeSessionWUPP';

            this._wupMessageBuilderStub.build.returns(this._expectedWupMessage);
            this._wupServerSessionState.getAgentType.returns('secondary')
            this._configurationRepositoryStub.get.returns(0);
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse) {
                onSuccessResponse('{"response": "response"}');
            };
        });

        it('should resume session when no muid is provided and agentType is secondary', function () {
            const serverState = {
                requestId: 2,
            }

            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const wupServerClient = new WupServerClient(
                this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(wupServerClient, '_onSendDataFailure');

            wupServerClient.resumeSession(messageValues.sid, messageValues.cid, messageValues.protocolType, messageValues.minifiedUriEnabled,messageValues.csid, messageValues.psid, messageValues.muid,
                messageValues.context_name, messageValues.serverAddress, serverState);

            // Verify the wupServerSessionState values are correct
            assert.isTrue(this._wupServerSessionState.setSid.calledOnce, 'setSid was not called');
            assert.equal(this._wupServerSessionState.setSid.firstCall.args[0], messageValues.sid, 'setSid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setCsid.calledOnce, 'setCsid was not called');
            assert.equal(this._wupServerSessionState.setCsid.firstCall.args[0], messageValues.csid, 'setCsid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setPsid.calledOnce, 'setPsid was not called');
            assert.equal(this._wupServerSessionState.setPsid.firstCall.args[0], messageValues.psid, 'setPsid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setMuid.calledOnce, 'setMuid was not called');
            assert.equal(this._wupServerSessionState.setMuid.firstCall.args[0], messageValues.muid, 'setMuid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setContextName.calledOnce, 'setContextName was not called');
            assert.equal(this._wupServerSessionState.setContextName.firstCall.args[0], messageValues.context_name, 'setContextName param is not as expected');
            assert.isTrue(this._wupServerSessionState.setSts.calledOnce, 'setSts was not called');
            assert.equal(this._wupServerSessionState.setSts.firstCall.args[0], null, 'setSts param is not as expected');
            assert.isTrue(this._wupServerSessionState.setStd.calledOnce, 'setStd was not called');
            assert.equal(this._wupServerSessionState.setStd.firstCall.args[0], null, 'setStd param is not as expected');
            assert.isTrue(this._wupServerSessionState.setRequestId.calledTwice, 'setRequestId was not called');
            assert.equal(this._wupServerSessionState.setRequestId.firstCall.args[0], messageValues.requestId + 1, 'setRequestId value is not as expected');

             const expectedUnpackedData = wupServerClient._createStaticFieldsPart();
             assert.isTrue(this._wupMessageBuilderStub.build.calledOnce);
             assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[0], 'js');
             assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[1], expectedUnpackedData);

             assert.isTrue(serverCommunicatorSendMessageSpy.calledOnce);
            assert.deepEqual(serverCommunicatorSendMessageSpy.firstCall.args[0], this._expectedWupMessage);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[1], DEFAULT_REQUEST_TIMEOUT);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[2], wupServerClient._MESSAGE_SEND_RETRIES);

            assert.isTrue(wupServerClientOnSendDataSuccessSpy.calledOnce);
            assert.equal(wupServerClientOnSendDataSuccessSpy.firstCall.args[0], '{"response": "response"}');

            assert.isTrue(wupServerClientOnSendDataFailureSpy.notCalled);
        });

        it('should start new session when muid is notprovided and agentType is secondary', function () {
            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const wupServerClient = new WupServerClient(
                this._serverCommunicatorStub,
                this._wupMessageBuilderStub,
                this._wupServerSessionState,
                this._wupStatisticsServiceStub,
                this._wupResponseProcessorStub,
                this._configurationRepositoryStub,
                this._msgBusStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(wupServerClient, '_onSendDataFailure');

            wupServerClient.startNewSession(mockCid, mockProtocolType, false, messageValues.csid, messageValues.psid, messageValues.muid,
                messageValues.context_name, messageValues.serverAddress);

            // Verify the wupServerSessionState values are correct
            assert.isTrue(this._wupServerSessionState.setSid.called, 'setSid was not called');
            assert.equal(this._wupServerSessionState.setSid.firstCall.args[0], null, 'setSid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setCsid.calledOnce, 'setCsid was not called');
            assert.equal(this._wupServerSessionState.setCsid.firstCall.args[0], messageValues.csid, 'setCsid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setPsid.calledOnce, 'setPsid was not called');
            assert.equal(this._wupServerSessionState.setPsid.firstCall.args[0], messageValues.psid, 'setPsid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setMuid.calledOnce, 'setMuid was not called');
            assert.equal(this._wupServerSessionState.setMuid.firstCall.args[0], messageValues.muid, 'setMuid param is not as expected');
            assert.isTrue(this._wupServerSessionState.setContextName.calledOnce, 'setContextName was not called');
            assert.equal(this._wupServerSessionState.setContextName.firstCall.args[0], messageValues.context_name, 'setContextName param is not as expected');
            assert.isTrue(this._wupServerSessionState.setSts.calledOnce, 'setSts was called');
            assert.equal(this._wupServerSessionState.setSts.firstCall.args[0], null, 'setSts param is not as expected');
            assert.isTrue(this._wupServerSessionState.setStd.calledOnce, 'setStd was not called');
            assert.equal(this._wupServerSessionState.setStd.firstCall.args[0], null, 'setStd param is not as expected');
            assert.isTrue(this._wupServerSessionState.setRequestId.calledTwice, 'setRequestId was not called');
            assert.equal(this._wupServerSessionState.setRequestId.firstCall.args[0], 0, 'setRequestId value is not as expected');

            const expectedUnpackedData = wupServerClient._createStaticFieldsPart();
            assert.isTrue(this._wupMessageBuilderStub.build.calledOnce);
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[0], 'js');
            assert.deepEqual(this._wupMessageBuilderStub.build.firstCall.args[1], expectedUnpackedData);

            assert.isTrue(serverCommunicatorSendMessageSpy.calledOnce);
            assert.deepEqual(serverCommunicatorSendMessageSpy.firstCall.args[0], this._expectedWupMessage);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[1], DEFAULT_REQUEST_TIMEOUT);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[2], wupServerClient._MESSAGE_SEND_RETRIES);

            assert.isTrue(wupServerClientOnSendDataSuccessSpy.calledOnce);
            assert.equal(wupServerClientOnSendDataSuccessSpy.firstCall.args[0], '{"response": "response"}');

            assert.isTrue(wupServerClientOnSendDataFailureSpy.notCalled);
        });
    });
});
