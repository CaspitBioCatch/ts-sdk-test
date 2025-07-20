import { assert } from 'chai';
import LogMessageBuilder from '../../../../src/worker/communication/LogMessageBuilder';
import DataPacker from '../../../../src/worker/wup/DataPacker';
import ConfigurationRepository from '../../../../src/main/core/configuration/ConfigurationRepository';
import { ConfigurationFields } from '../../../../src/main/core/configuration/ConfigurationFields';
import LogServerClient from '../../../../src/worker/communication/LogServerClient';
import ServerCommunicator from '../../../../src/worker/communication/ServerCommunicator';
import RetryMessage from "../../../../src/worker/communication/RetryMessage";
import sinon from 'sinon';

describe('LogServerClient tests:', function () {
    const DEFAULT_REQUEST_TIMEOUT = 11123;

    beforeEach(function () {

        this._retryMessage = sinon.createStubInstance(RetryMessage)
        this._serverCommunicatorStub = sinon.createStubInstance(ServerCommunicator);
        this._logMessageBuilder = new LogMessageBuilder(new DataPacker());
        this._configurationRepositoryStub = sinon.stub(new ConfigurationRepository());
        this._configurationRepositoryStub.get.withArgs(ConfigurationFields.logMessageRequestTimeout).returns(DEFAULT_REQUEST_TIMEOUT);
        this._retryMessage.getMessageNumToRetry.returns(5);
        this._serverCommunicatorStub.getRetryMessage.returns(this._retryMessage);

    });
    describe('setConfigurationLogMessage tests:\n', function () {
        it('ConfigurationLogMessage is set successfully', function () {

            const logServerClient = new LogServerClient(this._serverCommunicatorStub, this._logMessageBuilder,
                this._configurationRepositoryStub);

            logServerClient.setConfigurationLogMessage();
            logServerClient.sendData({ data: 'data' });

            assert.isTrue(this._retryMessage.updateSettings.calledOnce);

        });
    });

    describe('setServerUrl tests:\n', function () {
        it('server url is set successfully', function () {
            const logServerClient = new LogServerClient(this._serverCommunicatorStub, this._logMessageBuilder,
                this._configurationRepositoryStub);

            logServerClient.setServerUrl('addressaddressAdd');
            assert.equal(logServerClient._serverUrl, 'addressaddressAdd');
        });

        it('server url is updated successfully', function () {
            const logServerClient = new LogServerClient(this._serverCommunicatorStub, this._logMessageBuilder,
                this._configurationRepositoryStub);

            logServerClient.setServerUrl('addressaddressAdd');

            assert.equal(logServerClient._serverUrl, 'addressaddressAdd');

            logServerClient.setServerUrl('update222');

            assert.equal(logServerClient._serverUrl, 'update222');
        });
    });

    describe('sendData tests:\n', function () {
        it('data is sent successfully', function () {
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse, onMessageRetryFailure, onMessageFailure, serverUrl) {
                onSuccessResponse(null);
            };

            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const logServerClient = new LogServerClient(this._serverCommunicatorStub, this._logMessageBuilder,
                this._configurationRepositoryStub);

            const wupServerClientOnSendDataSuccessSpy = sinon.spy(logServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(logServerClient, '_onSendDataFailure');

            logServerClient.setServerUrl("sdfdfgdbgdgdg");

            const data = { data: 'log log log' };
            logServerClient.sendData(data);

            const expectedMessage = this._logMessageBuilder.build(data);

            assert.isTrue(serverCommunicatorSendMessageSpy.calledOnce);
            assert.deepEqual(serverCommunicatorSendMessageSpy.firstCall.args[0], expectedMessage);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[1], DEFAULT_REQUEST_TIMEOUT);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[2], logServerClient._MESSAGE_SEND_RETRIES);

            assert.isTrue(wupServerClientOnSendDataSuccessSpy.calledOnce);
            assert.equal(wupServerClientOnSendDataSuccessSpy.firstCall.args[0], null);

            assert.isTrue(wupServerClientOnSendDataFailureSpy.notCalled);
        });

        it('failure callback is called once data send fails', function () {
            this._serverCommunicatorStub.sendMessage = function (message, timeout, maxNumberOfSendAttempts, shouldFlush, onSuccessResponse, onMessageRetryFailure, onMessageFailure, serverUrl) {
                onMessageFailure('{"response": "response"}');
            };

            const serverCommunicatorSendMessageSpy = sinon.spy(this._serverCommunicatorStub, 'sendMessage');

            const wupServerClient = new LogServerClient(this._serverCommunicatorStub, this._logMessageBuilder,
                this._configurationRepositoryStub);
            const wupServerClientOnSendDataSuccessSpy = sinon.spy(wupServerClient, '_onSendDataSuccess');
            const wupServerClientOnSendDataFailureSpy = sinon.spy(wupServerClient, '_onSendDataFailure');

            wupServerClient.setServerUrl("sdsdsdsdsd");

            const data = { data: 'data' };
            wupServerClient.sendData(data);

            const expectedMessage = this._logMessageBuilder.build(data);

            assert.isTrue(serverCommunicatorSendMessageSpy.calledOnce);
            assert.deepEqual(serverCommunicatorSendMessageSpy.firstCall.args[0], expectedMessage);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[1], DEFAULT_REQUEST_TIMEOUT);
            assert.equal(serverCommunicatorSendMessageSpy.firstCall.args[2], wupServerClient._MESSAGE_SEND_RETRIES);

            assert.isTrue(wupServerClientOnSendDataFailureSpy.calledOnce);
            assert.equal(wupServerClientOnSendDataFailureSpy.firstCall.args[0], '{"response": "response"}');

            assert.isTrue(wupServerClientOnSendDataSuccessSpy.notCalled);
        });

        it('data is flushed when shouldFlush is true', function () {
            const wupServerClient = new LogServerClient(this._serverCommunicatorStub, this._logMessageBuilder,
                this._configurationRepositoryStub);

            wupServerClient.setServerUrl('addressaddressAdd');

            const data = { data: 'data' };
            wupServerClient.sendData(data, true);

            const expectedMessage = this._logMessageBuilder.build(data);

            assert.isTrue(this._serverCommunicatorStub.sendMessage.calledOnce);
            assert.deepEqual(this._serverCommunicatorStub.sendMessage.firstCall.args[0], expectedMessage);
            assert.equal(this._serverCommunicatorStub.sendMessage.firstCall.args[1], DEFAULT_REQUEST_TIMEOUT);
            assert.equal(this._serverCommunicatorStub.sendMessage.firstCall.args[2], wupServerClient._MESSAGE_SEND_RETRIES);
            assert.equal(this._serverCommunicatorStub.sendMessage.firstCall.args[3], true);
        });
    });

    describe('isReady tests:\n', function () {
        it('returns true is server communicator is ready', function () {
            const logServerClient = new LogServerClient(this._serverCommunicatorStub, this._logMessageBuilder,
                this._configurationRepositoryStub);

            this._serverCommunicatorStub.isReadyToSendData.returns(true);

            const isReady = logServerClient.isReady();

            assert.isTrue(isReady);
        });

        it('returns false is server communicator is not ready', function () {
            const logServerClient = new LogServerClient(this._serverCommunicatorStub, this._logMessageBuilder,
                this._configurationRepositoryStub);

            this._serverCommunicatorStub.isReadyToSendData.returns(false);

            const isReady = logServerClient.isReady();

            assert.isFalse(isReady);
        });
    });

    describe('setRequestTimeout tests:\n', function () {
        it('request timeout is set successfully', function () {
            const logServerClient = new LogServerClient(this._serverCommunicatorStub, this._logMessageBuilder,
                this._configurationRepositoryStub);

            logServerClient.setServerUrl('addressaddressAdd');

            logServerClient.setRequestTimeout(2223334);

            logServerClient.sendData({ data: 'data' });

            assert.isTrue(this._serverCommunicatorStub.sendMessage.calledOnce);
            assert.equal(this._serverCommunicatorStub.sendMessage.firstCall.args[1], 2223334);
            assert.equal(this._serverCommunicatorStub.sendMessage.firstCall.args[2], logServerClient._MESSAGE_SEND_RETRIES);
        });
    });

    describe('set isPaused tests:\n', function () {
        it('isPaused is set successfully', function () {
            const logServerClient = new LogServerClient(this._serverCommunicatorStub, this._logMessageBuilder,
                this._configurationRepositoryStub);

            logServerClient.setIsPaused(1);

            assert.isTrue(this._serverCommunicatorStub.setIsPaused.calledOnce);
        });
    });

});
