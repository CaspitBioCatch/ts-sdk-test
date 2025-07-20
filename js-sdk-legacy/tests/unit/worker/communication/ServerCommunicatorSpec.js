import { assert } from 'chai';
import WupRequestBodyBuilder from '../../../../src/worker/communication/WupRequestBodyBuilder';
import ServerCommunicator from '../../../../src/worker/communication/ServerCommunicator';
import WorkerUtils from '../../../../src/worker/utils/WorkerUtils';
import WupServerSessionState from '../../../../src/worker/communication/WupServerSessionState';
import WupMessageBuilder from '../../../../src/worker/communication/WupMessageBuilder';
import DataPacker from '../../../../src/worker/wup/DataPacker';
import WupMessage from '../../../../src/worker/communication/WupMessage';
import TestFeatureSupport from '../../../TestFeatureSupport';
import RetryMessage from "../../../../src/worker/communication/RetryMessage";
import sinon from "sinon";
import ReMessageSettings from "../../../../src/worker/communication/ReMessageSettings";
import {DEFAULT_WUP_TYPE} from '../../../../src/worker/communication/Constants';
import {TestUtils} from "../../../TestUtils";
import DOMUtils from "../../../../src/main/technicalServices/DOMUtils";
import Log from '../../../../src/main/technicalServices/log/Logger';
import HashService from "../../../../src/worker/services/HashService";


describe('ServerCommunicator tests:', function () {

    let sandbox = null;
    let wupRequestBodyBuilderStub = null;
    let xhr = null;
    let clock = null;
    let retryMessageStub = null;
    const SERVER_COMMUNICATOR_SETTINGS = {
        queueLoadThreshold: 100,
    };

    let MAX_SEND_ATTEMPTS = 10;
    let SEND_TIMEOUT = 124350;




    beforeEach(function () {
        sandbox = sinon.createSandbox();

        wupRequestBodyBuilderStub = sandbox.createStubInstance(WupRequestBodyBuilder);
        retryMessageStub = sandbox.createStubInstance(RetryMessage);

        xhr = sandbox.useFakeServer();
        clock = sandbox.useFakeTimers();
    });

    afterEach(function () {
        sandbox.restore();
    });

    describe('initialization tests:', function () {

        it('message type is saved on initialization', function () {
            const comm = new ServerCommunicator(wupRequestBodyBuilderStub, SERVER_COMMUNICATOR_SETTINGS, WorkerUtils,retryMessageStub, false, 'test message type');

            assert.equal(comm._messageDescriptor, 'test message type');
        });

        it('retryMessage is saved on initialization', function () {
            const retryMessage = new RetryMessage(sandbox.createStubInstance(ReMessageSettings));
            const comm = new ServerCommunicator(wupRequestBodyBuilderStub, SERVER_COMMUNICATOR_SETTINGS, WorkerUtils,retryMessage, false, 'test message type');

            assert.equal(comm.retryMessage, retryMessage);
        });
    });

    describe('getter and setters tests:', function () {
        it('wupUrl and wupInterval getter and setter should return the parameter given in CTOR', function () {
            const retryMessage = new RetryMessage(sandbox.createStubInstance(ReMessageSettings));
            const comm = new ServerCommunicator(wupRequestBodyBuilderStub, SERVER_COMMUNICATOR_SETTINGS, WorkerUtils,retryMessage, false);
            const getRetryMessage = comm.getRetryMessage();

            assert.equal(getRetryMessage, comm.retryMessage);
        });

    });

    describe('sendMessage tests: ', function () {
        it('should succeed when json returned', function () {
            const url = 'http://www.test.com/';
            retryMessageStub.getMessageNumToRetry.returns(15);
            MAX_SEND_ATTEMPTS = retryMessageStub.getMessageNumToRetry();
            const comm = new ServerCommunicator(wupRequestBodyBuilderStub, SERVER_COMMUNICATOR_SETTINGS, WorkerUtils, retryMessageStub);

            const successSpy = sandbox.spy();
            const message = new WupMessage();
            message.data = { a: 'message' };
            comm.sendMessage(message, SEND_TIMEOUT, retryMessageStub.getMessageNumToRetry, false, successSpy, sandbox.spy(), sandbox.spy(), url);

            assert.equal(xhr.requests.length, 1);
            assert.equal(xhr.requests[0].method, 'POST');
            assert.equal(xhr.requests[0].url, url);

            xhr.requests[0].respond(200, { 'Content-Type': 'application/json' },
                '{ "id": 12, "comment": "Hey there" }');

            assert.isTrue(successSpy.calledOnce);
            assert.equal(successSpy.firstCall.args[0], '{ "id": 12, "comment": "Hey there" }');
        });

        it('should succeed with new message wrapper', function () {
            const url = 'http://www.test.com/';
            const comm = new ServerCommunicator(wupRequestBodyBuilderStub, SERVER_COMMUNICATOR_SETTINGS, WorkerUtils, retryMessageStub);

            const successSpy = sandbox.spy();

            const wupServerSessionState = new WupServerSessionState();
            const wupMessageBuilder = new WupMessageBuilder(wupServerSessionState, new DataPacker());

            wupServerSessionState.setCsid('aaa');
            wupServerSessionState.setSid('bbb111');
            wupServerSessionState.setMuid('mmm222');

            const message = wupMessageBuilder.build('js', false, 'xxx');
            wupRequestBodyBuilderStub.build.returns(JSON.stringify(message.getInternalMessage()));

            comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, false, successSpy, sandbox.spy(), sandbox.spy(), url);

            assert.equal(xhr.requests.length, 1);
            assert.equal(xhr.requests[0].method, 'POST', 'method is not post');
            assert.equal(xhr.requests[0].url, url, 'not the expected url');
            const data = JSON.parse(xhr.requests[0].requestBody);
            assert.equal('aaa', data.csid, 'csid not as expected');
            assert.equal('bbb111', data.cdsnum, 'cdsnum not as expected');
            assert.equal('mmm222', data.muid, 'muid not as expected');
            assert.equal('js', data.c, 'c not as expected');
            assert.equal('js', data.ds, 'c not as expected');

            xhr.requests[0].respond(200, { 'Content-Type': 'application/json' },
                '{ "id": 12, "comment": "Hey there" }');

            assert.isTrue(successSpy.calledOnce);
            assert(successSpy.calledWith('{ "id": 12, "comment": "Hey there" }'));
        });

        it('should use accept no response and not fail if param was specified on creation ', function () {
            const url = 'http://www.test.com/';
            const comm = new ServerCommunicator(wupRequestBodyBuilderStub, SERVER_COMMUNICATOR_SETTINGS, WorkerUtils,retryMessageStub, true);

            const errorSpy = sandbox.spy();
            const successSpy = sandbox.spy();
            const message = new WupMessage();
            message.data = 'bobo';
            comm.sendMessage(message, SEND_TIMEOUT, 1, false, successSpy, sandbox.spy(), errorSpy, url);

            assert.equal(xhr.requests.length, 1);
            assert.equal(xhr.requests[0].method, 'POST');
            assert.equal(xhr.requests[0].url, url);

            xhr.requests[0].respond(204, { 'Content-Type': 'application/json' });

            assert.isTrue(successSpy.calledOnce);
            assert.isTrue(errorSpy.notCalled);
        });

        it('should send next queued message once 200 status is received', function () {
            const url = 'http://www.test.com/';
            retryMessageStub.getMessageNumToRetry.returns(15);
            MAX_SEND_ATTEMPTS = retryMessageStub.getMessageNumToRetry();
            const comm = new ServerCommunicator(wupRequestBodyBuilderStub, SERVER_COMMUNICATOR_SETTINGS, WorkerUtils,retryMessageStub,false);

            const successSpy = sandbox.spy();
            const message = new WupMessage();
            message.data = { a: 'message' };
            comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, false, successSpy, sandbox.spy(), sandbox.spy(), url);
            comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, false, successSpy, sandbox.spy(), sandbox.spy(), url);
            comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, false, successSpy, sandbox.spy(), sandbox.spy(), url);

            assert.equal(xhr.requests.length, 1);
            assert.equal(xhr.requests[0].method, 'POST');
            assert.equal(xhr.requests[0].url, url);

            xhr.requests[0].respond(200, { 'Content-Type': 'application/json' },
                '{ "id": 12, "comment": "Hey there" }');

            assert.equal(xhr.requests.length, 2);
            assert.equal(xhr.requests[1].method, 'POST');
            assert.equal(xhr.requests[1].url, url);

            xhr.requests[1].respond(200, { 'Content-Type': 'application/json' },
                '{ "id": 13, "comment": "Hey there" }');

            assert.equal(xhr.requests.length, 3);
            assert.equal(xhr.requests[2].method, 'POST');
            assert.equal(xhr.requests[2].url, url);

            xhr.requests[2].respond(200, { 'Content-Type': 'application/json' },
                '{ "id": 14, "comment": "Hey there" }');

            assert.isTrue(successSpy.calledThrice);
            assert.equal(successSpy.firstCall.args[0], '{ "id": 12, "comment": "Hey there" }');
            assert.equal(successSpy.secondCall.args[0], '{ "id": 13, "comment": "Hey there" }');
            assert.equal(successSpy.thirdCall.args[0], '{ "id": 14, "comment": "Hey there" }');
        });

        it('should send next queued message once 204 status is received', function () {
            const url = 'http://www.test.com/';
            retryMessageStub.getMessageNumToRetry.returns(15);
            MAX_SEND_ATTEMPTS = retryMessageStub.getMessageNumToRetry();
            const comm = new ServerCommunicator(wupRequestBodyBuilderStub, SERVER_COMMUNICATOR_SETTINGS, WorkerUtils,retryMessageStub, true);

            const successSpy = sandbox.spy();
            const message = new WupMessage();
            message.data = { a: 'message' };
            comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, false, successSpy, sandbox.spy(), sandbox.spy(), url);
            comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, false, successSpy, sandbox.spy(), sandbox.spy(), url);
            comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, false, successSpy, sandbox.spy(), sandbox.spy(), url);

            assert.equal(xhr.requests.length, 1);
            assert.equal(xhr.requests[0].method, 'POST');
            assert.equal(xhr.requests[0].url, url);

            xhr.requests[0].respond(204, { 'Content-Type': 'application/json' });

            assert.equal(xhr.requests.length, 2);
            assert.equal(xhr.requests[1].method, 'POST');
            assert.equal(xhr.requests[1].url, url);

            xhr.requests[1].respond(204, { 'Content-Type': 'application/json' });

            assert.equal(xhr.requests.length, 3);
            assert.equal(xhr.requests[2].method, 'POST');
            assert.equal(xhr.requests[2].url, url);

            xhr.requests[2].respond(204, { 'Content-Type': 'application/json' });

            assert.isTrue(successSpy.calledThrice);
            assert.equal(successSpy.firstCall.args[0], '');
            assert.equal(successSpy.secondCall.args[0], '');
            assert.equal(successSpy.thirdCall.args[0], '');
        });

        it('should fail if acceptNoResponse param was false on creation', function () {
            const url = 'http://www.test.com/';
            retryMessageStub.getMessageNumToRetry.returns(15);
            MAX_SEND_ATTEMPTS = retryMessageStub.getMessageNumToRetry();
            const comm = new ServerCommunicator(wupRequestBodyBuilderStub, SERVER_COMMUNICATOR_SETTINGS, WorkerUtils, retryMessageStub,false);

            const errorSpy = sandbox.spy();
            const errorRetrySpy = sandbox.spy();
            const successSpy = sandbox.spy();
            const message = new WupMessage();
            message.data = 'bobo';
            comm.sendMessage(message, SEND_TIMEOUT, 1, false, successSpy, errorRetrySpy, errorSpy, url);

            assert.equal(xhr.requests.length, 1);
            assert.equal(xhr.requests[0].method, 'POST');
            assert.equal(xhr.requests[0].url, url);

            xhr.requests[0].respond(204, { 'Content-Type': 'application/json' });

            assert.isTrue(successSpy.notCalled);
            assert.isTrue(errorSpy.calledOnce);
        });

        it('new message should fail and resend', function () {
            retryMessageStub.shouldReMessage.returns(true);
            retryMessageStub.getMessageNumToRetry.returns(3);
            MAX_SEND_ATTEMPTS = retryMessageStub.getMessageNumToRetry();
            const url = 'http://www.test.com/';
            const comm = new ServerCommunicator(wupRequestBodyBuilderStub, SERVER_COMMUNICATOR_SETTINGS, WorkerUtils,retryMessageStub);

            const serverCommunicatorOnMessageSendSuccessSpy = sinon.spy(comm, '_onMessageSendSuccess');
            const serverCommunicatorOnMessageSendFailure = sinon.spy(comm, '_onMessageSendFailure');
            const serverCommunicatorEnqueueToStartOfQueue = sinon.spy(comm, '_prepareMessageForSendRetry');
            const serverCommunicatorProcessNextQueueItem = sinon.spy(comm, '_processNextQueueItem');

            const successSpy = sandbox.spy();
            const retryFailureSpy = sandbox.spy();

            const wupServerSessionState = new WupServerSessionState();
            const wupMessageBuilder = new WupMessageBuilder(wupServerSessionState, new DataPacker());

            wupServerSessionState.setCsid('aaa');
            wupServerSessionState.setSid('bbb111');
            wupServerSessionState.setMuid('mmm222');
            wupServerSessionState.setRequestId(2);

            let message = wupMessageBuilder.build('js', false, 'rereremes');
            wupRequestBodyBuilderStub.build.returns(JSON.stringify(message.getInternalMessage()));

            // first one returns sts/std
            comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, false, successSpy, sandbox.spy(), sandbox.spy(), url);
            xhr.requests[0].respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({
                sts: 'aaa111',
                std: 'bbb222',
            }));

            assert.isTrue(serverCommunicatorOnMessageSendSuccessSpy.calledOnce, '_onMessageSendSuccess was not called once');

            wupServerSessionState.setSts('sts');
            wupServerSessionState.setStd('std');
            message = wupMessageBuilder.build(DEFAULT_WUP_TYPE, 'xxx');
            wupRequestBodyBuilderStub.build.returns(JSON.stringify(message.getInternalMessage()));

            // second fails
            comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, false, successSpy, retryFailureSpy, sandbox.spy(), url);
            xhr.requests[1].respond(503, { 'Content-Type': 'application/json' },
                JSON.stringify({
                    csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx'],
                }));

            assert.isTrue(retryFailureSpy.calledOnce, 'Retry failure callback was not called once');
            assert.isTrue(serverCommunicatorOnMessageSendFailure.calledOnce, '_onMessageSendFailure was not called once');
            assert.isTrue(serverCommunicatorEnqueueToStartOfQueue.calledOnce, '_prepareMessageForSendRetry was not called once');



            message = wupMessageBuilder.build(DEFAULT_WUP_TYPE, 'yyy');
            wupRequestBodyBuilderStub.build.onCall(5).returns(JSON.stringify(message.getInternalMessage()));

           // third send an array with two data
            comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, false, successSpy);
            clock.tick(SEND_TIMEOUT);
            clock.tick(SEND_TIMEOUT);
            clock.tick(SEND_TIMEOUT);
            xhr.requests[4].respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({
                sts: 'aaa111',
                std: 'bbb222',
            }));
            xhr.requests[5].respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({
                sts: 'aaa111',
                std: 'bbb222',
            }));


            assert.equal(serverCommunicatorOnMessageSendSuccessSpy.callCount, 3,'_onMessageSendSuccess was not called 3 times');
            assert.equal(serverCommunicatorProcessNextQueueItem.callCount, 8);

            assert.equal(xhr.requests.length, 6);
            assert.equal(xhr.requests[2].method, 'POST');
            assert.equal(xhr.requests[2].url, url);

            const dataPacker = new DataPacker();

            // Failed request
            let data = JSON.parse(xhr.requests[1].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(dataPacker.pack('xxx'), data.d[0]);
            assert.equal(data.requestId, 2);

            // Retry request which succeeds
            data = JSON.parse(xhr.requests[2].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(dataPacker.pack('xxx'), data.d[0]);
            assert.equal(data.requestId, 2);

            data = JSON.parse(xhr.requests[3].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(dataPacker.pack('xxx'), data.d[0]);
            assert.equal(data.requestId, 2);

            data = JSON.parse(xhr.requests[4].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(dataPacker.pack('xxx'), data.d[0]);
            assert.equal(data.requestId, 2);

            // last message
            data = JSON.parse(xhr.requests[5].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(dataPacker.pack('yyy'), data.d[0]);
            assert.equal(data.requestId, 2);
        });

        it('new message failure should stop resend attempts after max attempts of message is exceeded', function () {
            const url = 'http://www.test.com/';
            retryMessageStub.getNextInterval.returns(SEND_TIMEOUT)

            const comm = new ServerCommunicator(wupRequestBodyBuilderStub, SERVER_COMMUNICATOR_SETTINGS, WorkerUtils,retryMessageStub);
            const serverCommunicatorEnqueueToStartOfQueue = sandbox.spy(comm, '_prepareMessageForSendRetry');

            const successSpy = sandbox.spy();
            const retryFailureSpy = sandbox.spy();
            const FailureSpy = sandbox.spy();

            const wupServerSessionState = new WupServerSessionState();
            const wupMessageBuilder = new WupMessageBuilder(wupServerSessionState, new DataPacker());

            wupServerSessionState.setCsid('aaa');
            wupServerSessionState.setSid('bbb111');
            wupServerSessionState.setMuid('mmm222');
            wupServerSessionState.setRequestId(2);

            let message = wupMessageBuilder.build('js', 'sdf');
            wupRequestBodyBuilderStub.build.returns(JSON.stringify(message.getInternalMessage()));

            // first one returns sts/std
            comm.sendMessage(message, SEND_TIMEOUT, 5, false, successSpy, sandbox.spy(), sandbox.spy(), url);
            xhr.requests[0].respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({
                sts: 'aaa111',
                std: 'bbb222',
            }));

            wupServerSessionState.setSts('sts');
            wupServerSessionState.setStd('std');
            message = wupMessageBuilder.build(DEFAULT_WUP_TYPE, 'xxx');
            wupRequestBodyBuilderStub.build.onSecondCall().returns(JSON.stringify(message.getInternalMessage()));
            wupRequestBodyBuilderStub.build.onThirdCall().returns(JSON.stringify(message.getInternalMessage()));
            wupRequestBodyBuilderStub.build.onCall(3).returns(JSON.stringify(message.getInternalMessage()));
            wupRequestBodyBuilderStub.build.onCall(4).returns(JSON.stringify(message.getInternalMessage()));
            wupRequestBodyBuilderStub.build.onCall(5).returns(JSON.stringify(message.getInternalMessage()));

            // second fails
            retryMessageStub.shouldReMessage.returns(true);
            comm.sendMessage(message, SEND_TIMEOUT, 5, false, successSpy, retryFailureSpy, FailureSpy, url);
            xhr.requests[1].respond(503, { 'Content-Type': 'application/json' },
                JSON.stringify({
                    csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx'],
                }));
            assert.isTrue(retryFailureSpy.calledOnce);
            assert.isTrue(serverCommunicatorEnqueueToStartOfQueue.calledOnce);
            assert.equal(serverCommunicatorEnqueueToStartOfQueue.firstCall.thisValue._currentSentItem.messageToSend, message);

            clock.tick(SEND_TIMEOUT);
            xhr.requests[2].respond(503, { 'Content-Type': 'application/json' },
                JSON.stringify({
                    csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx'],
                }));

            assert.isTrue(retryFailureSpy.calledTwice);
            assert.isTrue(serverCommunicatorEnqueueToStartOfQueue.calledTwice);
            assert.equal(serverCommunicatorEnqueueToStartOfQueue.secondCall.thisValue._currentSentItem.messageToSend, message);

            clock.tick(SEND_TIMEOUT);
            xhr.requests[3].respond(503, { 'Content-Type': 'application/json' },
                JSON.stringify({
                    csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx'],
                }));

            assert.isTrue(retryFailureSpy.calledThrice);
            assert.isTrue(serverCommunicatorEnqueueToStartOfQueue.calledThrice);
            assert.equal(serverCommunicatorEnqueueToStartOfQueue.thirdCall.thisValue._currentSentItem.messageToSend, message);

            clock.tick(SEND_TIMEOUT);
            xhr.requests[4].respond(503, { 'Content-Type': 'application/json' },
                JSON.stringify({
                    csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx'],
                }));

            assert.equal(retryFailureSpy.callCount, 4);
            assert.equal(serverCommunicatorEnqueueToStartOfQueue.callCount, 4);
            assert.equal(serverCommunicatorEnqueueToStartOfQueue.getCall(3).thisValue._currentSentItem.messageToSend, message);

            retryMessageStub.shouldReMessage.returns(false);
            clock.tick(SEND_TIMEOUT);
            xhr.requests[5].respond(503, { 'Content-Type': 'application/json' },
                JSON.stringify({
                    csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx'],
                }));
            assert.equal(retryFailureSpy.callCount, 5);
            assert.equal(serverCommunicatorEnqueueToStartOfQueue.callCount, 4);

            assert.isTrue(FailureSpy.calledOnce, 'Failure spy was not called once.');
            message = wupMessageBuilder.build(DEFAULT_WUP_TYPE, 'yyy');
            wupRequestBodyBuilderStub.build.returns(JSON.stringify(message.getInternalMessage()));

            // third fails again
            comm.sendMessage(message, SEND_TIMEOUT, 5, false, successSpy);
            xhr.requests[6].respond(200, { 'Content-Type': 'application/json' },
                JSON.stringify({
                    csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx', 'yyy'],
                }));

            assert.equal(xhr.requests.length, 7);
            assert.equal(xhr.requests[0].method, 'POST');
            assert.equal(xhr.requests[0].url, url);

            const dataPacker = new DataPacker();
            let data = JSON.parse(xhr.requests[1].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(data.d[0], dataPacker.pack('xxx'));
            assert.equal(xhr.requests[1].status, 503);

            data = JSON.parse(xhr.requests[2].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(data.d[0], dataPacker.pack('xxx'));
            assert.equal(xhr.requests[2].status, 503);

            data = JSON.parse(xhr.requests[3].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(data.d[0], dataPacker.pack('xxx'));
            assert.equal(xhr.requests[3].status, 503);

            data = JSON.parse(xhr.requests[4].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(data.d[0], dataPacker.pack('xxx'));
            assert.equal(xhr.requests[4].status, 503);

            data = JSON.parse(xhr.requests[5].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(data.d[0], dataPacker.pack('xxx'));
            assert.equal(xhr.requests[5].status, 503);

            data = JSON.parse(xhr.requests[6].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(data.d[0], dataPacker.pack('yyy'));
            assert.equal(xhr.requests[6].status, 200);
        });

        it('new message should fail and resend twice', function () {
            retryMessageStub.shouldReMessage.returns(true);
            retryMessageStub.getMessageNumToRetry.returns(15);
            retryMessageStub.getNextInterval.returns(SEND_TIMEOUT);
            MAX_SEND_ATTEMPTS = retryMessageStub.getMessageNumToRetry();

            const url = 'http://www.test.com/';
            const comm = new ServerCommunicator(wupRequestBodyBuilderStub, SERVER_COMMUNICATOR_SETTINGS, WorkerUtils,retryMessageStub);

            const serverCommunicatorOnMessageSendSuccessSpy = sandbox.spy(comm, '_onMessageSendSuccess');
            const serverCommunicatorOnMessageSendFailure = sandbox.spy(comm, '_onMessageSendFailure');

            const successSpy = sandbox.spy();
            const retryFailureSpy = sandbox.spy();

            const wupServerSessionState = new WupServerSessionState();
            const wupMessageBuilder = new WupMessageBuilder(wupServerSessionState, new DataPacker());

            wupServerSessionState.setCsid('aaa');
            wupServerSessionState.setSid('bbb111');
            wupServerSessionState.setMuid('mmm222');
            wupServerSessionState.setRequestId(2);

            let message = wupMessageBuilder.build('js', 'ffffff');
            wupRequestBodyBuilderStub.build.returns(JSON.stringify(message.getInternalMessage()));

            // first one returns sts/std
            comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, false, successSpy, sandbox.spy(), sandbox.spy(), url);
            xhr.requests[0].respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({
                sts: 'aaa111',
                std: 'bbb222',
            }));

            assert.isTrue(serverCommunicatorOnMessageSendSuccessSpy.calledOnce);

            wupServerSessionState.setSts('sts');
            wupServerSessionState.setStd('std');
            message = wupMessageBuilder.build(DEFAULT_WUP_TYPE, 'xxx');
            wupRequestBodyBuilderStub.build.onSecondCall().returns(JSON.stringify(message.getInternalMessage()));
            wupRequestBodyBuilderStub.build.onThirdCall().returns(JSON.stringify(message.getInternalMessage()));
            wupRequestBodyBuilderStub.build.onCall(3).returns(JSON.stringify(message.getInternalMessage()));

            // second fails
            comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, false, successSpy, retryFailureSpy, sandbox.spy(), url);

            message = wupMessageBuilder.build(DEFAULT_WUP_TYPE, 'yyy');
            wupRequestBodyBuilderStub.build.onCall(4).returns(JSON.stringify(message.getInternalMessage()));

            // third fails again
            comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, false, successSpy, retryFailureSpy, sandbox.spy(), url);

            // response for second failure should trigger a resend
            xhr.requests[1].respond(503, { 'Content-Type': 'application/json' },
                JSON.stringify({
                    csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx'],
                }));

            assert.isTrue(serverCommunicatorOnMessageSendFailure.calledOnce);
            assert.equal(serverCommunicatorOnMessageSendFailure.firstCall.args[0],
                JSON.stringify({
                    csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx'],
                }));

            // Move clock to trigger retry timeout
            clock.tick(SEND_TIMEOUT);

            // response for third failure should trigger a resend
            xhr.requests[2].respond(503, { 'Content-Type': 'application/json' },
                JSON.stringify({
                    csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx', 'yyy'],
                }));

            assert.isTrue(serverCommunicatorOnMessageSendFailure.calledTwice);
            assert.equal(serverCommunicatorOnMessageSendFailure.secondCall.args[0],
                JSON.stringify({
                    csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx', 'yyy'],
                }));

            message = wupMessageBuilder.build(DEFAULT_WUP_TYPE, 'zzz');
            wupRequestBodyBuilderStub.build.onCall(5).returns(JSON.stringify(message.getInternalMessage()));

            // forth sends an array with three data
            comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, false, successSpy, retryFailureSpy, sandbox.spy(), url);
            clock.tick(SEND_TIMEOUT);

            xhr.requests[3].respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({
                sts: 'aaa111',
                std: 'bbb222',
            }));

            assert.isTrue(serverCommunicatorOnMessageSendSuccessSpy.calledTwice);
            assert.equal(serverCommunicatorOnMessageSendSuccessSpy.secondCall.args[0], JSON.stringify({
                sts: 'aaa111',
                std: 'bbb222',
            }));

            // response for yyy
            xhr.requests[4].respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({
                sts: 'aaa111',
                std: 'bbb222',
            }));

            assert.isTrue(serverCommunicatorOnMessageSendSuccessSpy.calledThrice);
            assert.equal(serverCommunicatorOnMessageSendSuccessSpy.thirdCall.args[0], JSON.stringify({
                sts: 'aaa111',
                std: 'bbb222',
            }));

            // response for zzz
            xhr.requests[5].respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({
                sts: 'aaa111',
                std: 'bbb222',
            }));

            assert.equal(serverCommunicatorOnMessageSendSuccessSpy.callCount, 4);
            assert.equal(serverCommunicatorOnMessageSendSuccessSpy.getCall(3).args[0], JSON.stringify({
                sts: 'aaa111',
                std: 'bbb222',
            }));

            assert.equal(xhr.requests.length, 6);
            assert.equal(xhr.requests[3].method, 'POST');
            assert.equal(xhr.requests[3].url, url);

            const dataPacker = new DataPacker();

            let data = JSON.parse(xhr.requests[3].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(dataPacker.pack('xxx'), data.d[0]);

            data = JSON.parse(xhr.requests[4].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(dataPacker.pack('yyy'), data.d[0]);

            data = JSON.parse(xhr.requests[5].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(dataPacker.pack('zzz'), data.d[0]);
        });

        it('new message should fail and resend on xhr error', function () {
            retryMessageStub.shouldReMessage.returns(true);
            retryMessageStub.getMessageNumToRetry.returns(3);
            MAX_SEND_ATTEMPTS = retryMessageStub.getMessageNumToRetry();

            const url = 'http://www.test.com/';
            const comm = new ServerCommunicator(wupRequestBodyBuilderStub, SERVER_COMMUNICATOR_SETTINGS, WorkerUtils,retryMessageStub);

            const serverCommunicatorOnMessageSendSuccessSpy = sandbox.spy(comm, '_onMessageSendSuccess');
            const serverCommunicatorOnMessageSendFailure = sandbox.spy(comm, '_onMessageSendFailure');
            const serverCommunicatorEnqueueToStartOfQueue = sandbox.spy(comm, '_prepareMessageForSendRetry');
            const serverCommunicatorProcessNextQueueItem = sandbox.spy(comm, '_processNextQueueItem');

            const successSpy = sandbox.spy();
            const retryFailureSpy = sandbox.spy();

            const wupServerSessionState = new WupServerSessionState();
            const wupMessageBuilder = new WupMessageBuilder(wupServerSessionState, new DataPacker());

            wupServerSessionState.setCsid('aaa');
            wupServerSessionState.setSid('bbb111');
            wupServerSessionState.setMuid('mmm222');
            wupServerSessionState.setRequestId(2);

            let message = wupMessageBuilder.build('js', false, 'rereremes');
            wupRequestBodyBuilderStub.build.returns(JSON.stringify(message.getInternalMessage()));

            // first one returns sts/std
            comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, false, successSpy, sandbox.spy(), sandbox.spy(), url);
            xhr.requests[0].respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({
                sts: 'aaa111',
                std: 'bbb222',
            }));

            assert.isTrue(serverCommunicatorOnMessageSendSuccessSpy.calledOnce);

            wupServerSessionState.setSts('sts');
            wupServerSessionState.setStd('std');
            message = wupMessageBuilder.build(DEFAULT_WUP_TYPE, 'xxx');
            wupRequestBodyBuilderStub.build.onSecondCall().returns(JSON.stringify(message.getInternalMessage()));
            wupRequestBodyBuilderStub.build.onThirdCall().returns(JSON.stringify(message.getInternalMessage()));

            // second fails
            comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, false, successSpy, retryFailureSpy, sandbox.spy(), url);
            xhr.requests[1].error();

            assert.isTrue(serverCommunicatorOnMessageSendFailure.calledOnce);
            assert.isTrue(retryFailureSpy.calledOnce);
            assert.equal(serverCommunicatorOnMessageSendFailure.firstCall.args[0], '');
            assert.isTrue(serverCommunicatorEnqueueToStartOfQueue.calledOnce);


            clock.tick(SEND_TIMEOUT);

            message = wupMessageBuilder.build(DEFAULT_WUP_TYPE, 'yyy');
            wupRequestBodyBuilderStub.build.onCall(3).returns(JSON.stringify(message.getInternalMessage()));
           // third send an array with two data
           comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, false, successSpy, sandbox.spy(), sandbox.spy(), url);
           clock.tick(SEND_TIMEOUT);

            // This is the response for the yyy send
            xhr.requests[3].respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({
                sts: 'aaa111',
                std: 'bbb222',
            }));

            assert.equal(serverCommunicatorProcessNextQueueItem.callCount, 6);

            assert.equal(xhr.requests.length, 5);
            assert.equal(xhr.requests[2].method, 'POST');
            assert.equal(xhr.requests[2].url, url);

            const dataPacker = new DataPacker();

            // Failed request
            let data = JSON.parse(xhr.requests[1].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(dataPacker.pack('xxx'), data.d[0]);
            assert.equal(data.requestId, 2);

            // Retry request which succeeds
            data = JSON.parse(xhr.requests[2].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(dataPacker.pack('xxx'), data.d[0]);
            assert.equal(data.requestId, 2);

            // last message
            data = JSON.parse(xhr.requests[3].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(dataPacker.pack('yyy'), data.d[0]);
            assert.equal(data.requestId, 2);
        });

        it('new message should fail and resend on xhr abort', function () {
            retryMessageStub.getMessageNumToRetry.returns(15);
            MAX_SEND_ATTEMPTS = retryMessageStub.getMessageNumToRetry();
            retryMessageStub.shouldReMessage.returns(true);

            const url = 'http://www.test.com/';
            const comm = new ServerCommunicator(wupRequestBodyBuilderStub, SERVER_COMMUNICATOR_SETTINGS, WorkerUtils,retryMessageStub);

            const serverCommunicatorOnMessageSendSuccessSpy = sandbox.spy(comm, '_onMessageSendSuccess');
            const serverCommunicatorOnMessageSendFailure = sandbox.spy(comm, '_onMessageSendFailure');
            const serverCommunicatorEnqueueToStartOfQueue = sandbox.spy(comm, '_prepareMessageForSendRetry');
            const serverCommunicatorProcessNextQueueItem = sandbox.spy(comm, '_processNextQueueItem');

            const successSpy = sandbox.spy();
            const retryFailureSpy = sandbox.spy();

            const wupServerSessionState = new WupServerSessionState();
            const wupMessageBuilder = new WupMessageBuilder(wupServerSessionState, new DataPacker());

            wupServerSessionState.setCsid('aaa');
            wupServerSessionState.setSid('bbb111');
            wupServerSessionState.setMuid('mmm222');
            wupServerSessionState.setRequestId(2);

            let message = wupMessageBuilder.build('js', false, 'rereremes');
            wupRequestBodyBuilderStub.build.returns(JSON.stringify(message.getInternalMessage()));

            // first one returns sts/std
            comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, false, successSpy, sandbox.spy(), sandbox.spy(), url);
            xhr.requests[0].respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({
                sts: 'aaa111',
                std: 'bbb222',
            }));

            assert.isTrue(serverCommunicatorOnMessageSendSuccessSpy.calledOnce);

            wupServerSessionState.setSts('sts');
            wupServerSessionState.setStd('std');
            message = wupMessageBuilder.build(DEFAULT_WUP_TYPE, 'xxx');
            wupRequestBodyBuilderStub.build.onSecondCall().returns(JSON.stringify(message.getInternalMessage()));
            wupRequestBodyBuilderStub.build.onThirdCall().returns(JSON.stringify(message.getInternalMessage()));

            // second fails
            comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, false, successSpy, retryFailureSpy, sandbox.spy(), url);
            xhr.requests[1].abort();

            assert.isTrue(serverCommunicatorOnMessageSendFailure.calledOnce);
            assert.isTrue(retryFailureSpy.calledOnce);
            assert.equal(serverCommunicatorOnMessageSendFailure.firstCall.args[0], 'abort');
            assert.isTrue(serverCommunicatorEnqueueToStartOfQueue.calledOnce);

            message = wupMessageBuilder.build(DEFAULT_WUP_TYPE, 'yyy');
            wupRequestBodyBuilderStub.build.onCall(3).returns(JSON.stringify(message.getInternalMessage()));

            // third send an array with two data
            comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, false, successSpy, sandbox.spy(), sandbox.spy(), url);

            // retry xxx
            clock.tick(SEND_TIMEOUT);

            // This is the response for the yyy send
            clock.tick(SEND_TIMEOUT);
            xhr.requests[3].respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({
                sts: 'aaa111',
                std: 'bbb222',
            }));

            assert.isTrue(serverCommunicatorOnMessageSendSuccessSpy.calledTwice);
            assert.equal(serverCommunicatorProcessNextQueueItem.callCount, 6);

            assert.equal(xhr.requests.length, 5);
            assert.equal(xhr.requests[2].method, 'POST');
            assert.equal(xhr.requests[2].url, url);

            const dataPacker = new DataPacker();

            // Failed request
            let data = JSON.parse(xhr.requests[1].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(dataPacker.pack('xxx'), data.d[0]);
            assert.equal(data.requestId, 2);

            // Retry request which succeeds
            data = JSON.parse(xhr.requests[2].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(dataPacker.pack('xxx'), data.d[0]);
            assert.equal(data.requestId, 2);

            // last message
            data = JSON.parse(xhr.requests[3].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(dataPacker.pack('yyy'), data.d[0]);
            assert.equal(data.requestId, 2);
        });

        it('new message should fail and resend on xhr timeout', function () {
            retryMessageStub.getMessageNumToRetry.returns(15);
            MAX_SEND_ATTEMPTS = retryMessageStub.getMessageNumToRetry();
            if (!TestFeatureSupport.isXMLHttpRequestTimeoutSupported()) {
                return;
            }

            const url = 'http://www.test.com/';
            const comm = new ServerCommunicator(wupRequestBodyBuilderStub, SERVER_COMMUNICATOR_SETTINGS, WorkerUtils,retryMessageStub);

            const serverCommunicatorOnMessageSendSuccessSpy = sandbox.spy(comm, '_onMessageSendSuccess');
            const serverCommunicatorOnMessageSendFailure = sandbox.spy(comm, '_onMessageSendFailure');
            const serverCommunicatorEnqueueToStartOfQueue = sandbox.spy(comm, '_prepareMessageForSendRetry');
            const serverCommunicatorProcessNextQueueItem = sandbox.spy(comm, '_processNextQueueItem');

            const successSpy = sandbox.spy();
            const retryFailureSpy = sandbox.spy();

            const wupServerSessionState = new WupServerSessionState();
            const wupMessageBuilder = new WupMessageBuilder(wupServerSessionState, new DataPacker());

            wupServerSessionState.setCsid('aaa');
            wupServerSessionState.setSid('bbb111');
            wupServerSessionState.setMuid('mmm222');
            wupServerSessionState.setRequestId(2);

            let message = wupMessageBuilder.build('js', false, 'rereremes');

            // first one returns sts/std
            comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, false, successSpy, sandbox.spy(), sandbox.spy(), url);
            xhr.requests[0].respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({
                sts: 'aaa111',
                std: 'bbb222',
            }));

            assert.isTrue(serverCommunicatorOnMessageSendSuccessSpy.calledOnce, '_onMessageSendSuccess was not called once');

            wupServerSessionState.setSts('sts');
            wupServerSessionState.setStd('std');
            message = wupMessageBuilder.build(DEFAULT_WUP_TYPE, 'xxx');

            // second fails
            comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, false, successSpy, retryFailureSpy, sandbox.spy(), url);
            xhr.requests[1].triggerTimeout();

            assert.isTrue(serverCommunicatorOnMessageSendFailure.calledOnce, '_onMessageSendFailure was not called once');
            assert.isTrue(retryFailureSpy.calledOnce, 'onMessageRetryFailure was not called once');
            assert.equal(serverCommunicatorOnMessageSendFailure.firstCall.args[0], 'timeout');
            assert.isTrue(serverCommunicatorEnqueueToStartOfQueue.calledOnce, '_prepareMessageForSendRetry was not called once');

            message = wupMessageBuilder.build(DEFAULT_WUP_TYPE, 'yyy');

            // third send an array with two data
            comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, false, successSpy, sandbox.spy(), sandbox.spy(), url);

            // This is the response for the retry of xxx
            xhr.requests[2].respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({
                sts: 'aaa111',
                std: 'bbb222',
            }));
            // This is the response for the yyy send
            xhr.requests[3].respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({
                sts: 'aaa111',
                std: 'bbb222',
            }));

            assert.isTrue(serverCommunicatorOnMessageSendSuccessSpy.calledThrice, '_onMessageSendSuccess was not called thrice');
            assert.equal(serverCommunicatorProcessNextQueueItem.callCount, 6);

            assert.equal(xhr.requests.length, 4);
            assert.equal(xhr.requests[2].method, 'POST');
            assert.equal(xhr.requests[2].url, url);

            const dataPacker = new DataPacker();

            // Failed request
            let data = JSON.parse(xhr.requests[1].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(dataPacker.pack('xxx'), data.d[0]);
            assert.equal(data.requestId, 2);

            // Retry request which succeeds
            data = JSON.parse(xhr.requests[2].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(dataPacker.pack('xxx'), data.d[0]);
            assert.equal(data.requestId, 2);

            // last message
            data = JSON.parse(xhr.requests[3].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(dataPacker.pack('yyy'), data.d[0]);
            assert.equal(data.requestId, 2);
        });

        it('new message should fail and resend twice with custom send retry rate', function () {
            const url = 'http://www.test.com/';
            retryMessageStub.shouldReMessage.returns(true);
            retryMessageStub.getMessageNumToRetry.returns(200);
            MAX_SEND_ATTEMPTS = retryMessageStub.getMessageNumToRetry();
            const comm = new ServerCommunicator(wupRequestBodyBuilderStub,
                { queueLoadThreshold: 100}
            , WorkerUtils,retryMessageStub);

            const serverCommunicatorOnMessageSendSuccessSpy = sandbox.spy(comm, '_onMessageSendSuccess');
            const serverCommunicatorOnMessageSendFailure = sandbox.spy(comm, '_onMessageSendFailure');

            const successSpy = sandbox.spy();
            const retryFailureSpy = sandbox.spy();

            const wupServerSessionState = new WupServerSessionState();
            const wupMessageBuilder = new WupMessageBuilder(wupServerSessionState, new DataPacker());

            wupServerSessionState.setCsid('aaa');
            wupServerSessionState.setSid('bbb111');
            wupServerSessionState.setMuid('mmm222');
            wupServerSessionState.setRequestId(2);

            let message = wupMessageBuilder.build('js', 'msg');
            wupRequestBodyBuilderStub.build.returns(JSON.stringify(message.getInternalMessage()));

            // first one returns sts/std
            comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, false, successSpy, sandbox.spy(), sandbox.spy(), url);
            xhr.requests[0].respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({
                sts: 'aaa111',
                std: 'bbb222',
            }));

            assert.isTrue(serverCommunicatorOnMessageSendSuccessSpy.calledOnce);

            wupServerSessionState.setSts('sts');
            wupServerSessionState.setStd('std');
            message = wupMessageBuilder.build(DEFAULT_WUP_TYPE, 'xxx');
            wupRequestBodyBuilderStub.build.onSecondCall().returns(JSON.stringify(message.getInternalMessage()));
            wupRequestBodyBuilderStub.build.onThirdCall().returns(JSON.stringify(message.getInternalMessage()));
            wupRequestBodyBuilderStub.build.onCall(3).returns(JSON.stringify(message.getInternalMessage()));

            // second fails
            comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, false, successSpy, retryFailureSpy, sandbox.spy(), url);

            message = wupMessageBuilder.build(DEFAULT_WUP_TYPE, 'yyy');
            wupRequestBodyBuilderStub.build.onCall(4).returns(JSON.stringify(message.getInternalMessage()));

            // third fails again
            comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, false, successSpy, retryFailureSpy, sandbox.spy(), url);

            // response for second failure should trigger a resend
            xhr.requests[1].respond(503, { 'Content-Type': 'application/json' },
                JSON.stringify({
                    csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx'],
                }));

            assert.isTrue(serverCommunicatorOnMessageSendFailure.calledOnce);
            assert.equal(serverCommunicatorOnMessageSendFailure.firstCall.args[0],
                JSON.stringify({
                    csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx'],
                }));

            // Move clock to trigger retry timeout
            clock.tick(5123);

            // response for third failure should trigger a resend
            xhr.requests[2].respond(503, { 'Content-Type': 'application/json' },
                JSON.stringify({
                    csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx', 'yyy'],
                }));

            assert.isTrue(retryFailureSpy.calledTwice, 'onMessageRetryFailure was not called once');
            assert.isTrue(serverCommunicatorOnMessageSendFailure.calledTwice);
            assert.equal(serverCommunicatorOnMessageSendFailure.secondCall.args[0],
                JSON.stringify({
                    csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx', 'yyy'],
                }));

            message = wupMessageBuilder.build(DEFAULT_WUP_TYPE, 'zzz');
            wupRequestBodyBuilderStub.build.onCall(5).returns(JSON.stringify(message.getInternalMessage()));

            // forth sends an array with three data
            comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, false, successSpy, sandbox.spy(), sandbox.spy(), url);
            clock.tick(5123);
            xhr.requests[3].respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({
                sts: 'aaa111',
                std: 'bbb222',
            }));

            assert.isTrue(serverCommunicatorOnMessageSendSuccessSpy.calledTwice);
            assert.equal(serverCommunicatorOnMessageSendSuccessSpy.secondCall.args[0], JSON.stringify({
                sts: 'aaa111',
                std: 'bbb222',
            }));

            clock.tick(5123);
            xhr.requests[4].respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({
                sts: 'aaa111',
                std: 'bbb222',
            }));

            assert.isTrue(serverCommunicatorOnMessageSendSuccessSpy.calledThrice);
            assert.equal(serverCommunicatorOnMessageSendSuccessSpy.thirdCall.args[0], JSON.stringify({
                sts: 'aaa111',
                std: 'bbb222',
            }));
            clock.tick(5123);
            // response for zzz
            xhr.requests[5].respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({
                sts: 'aaa111',
                std: 'bbb222',
            }));

            assert.equal(serverCommunicatorOnMessageSendSuccessSpy.callCount, 4);
            assert.equal(serverCommunicatorOnMessageSendSuccessSpy.getCall(3).args[0], JSON.stringify({
                sts: 'aaa111',
                std: 'bbb222',
            }));

            assert.equal(xhr.requests.length, 6);
            assert.equal(xhr.requests[3].method, 'POST');
            assert.equal(xhr.requests[3].url, url);

            const dataPacker = new DataPacker();
            let data = JSON.parse(xhr.requests[3].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(dataPacker.pack('xxx'), data.d[0]);

            data = JSON.parse(xhr.requests[4].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(dataPacker.pack('yyy'), data.d[0]);

            data = JSON.parse(xhr.requests[5].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(dataPacker.pack('zzz'), data.d[0]);
        });

        it('new message send retry is done in defined rate', function () {
            const url = 'http://www.test.com/';

            const comm = new ServerCommunicator(wupRequestBodyBuilderStub, { queueLoadThreshold: 100}, WorkerUtils,retryMessageStub);


            const serverCommunicatorEnqueueToStartOfQueue = sandbox.spy(comm, '_prepareMessageForSendRetry');

            const successSpy = sandbox.spy();
            const retryFailureSpy = sandbox.spy();
            const failureSpy = sandbox.spy();

            const wupServerSessionState = new WupServerSessionState();
            const wupMessageBuilder = new WupMessageBuilder(wupServerSessionState, new DataPacker());

            wupServerSessionState.setCsid('aaa');
            wupServerSessionState.setSid('bbb111');
            wupServerSessionState.setMuid('mmm222');
            wupServerSessionState.setRequestId(2);

            let message = wupMessageBuilder.build('js', 'fff');
            wupRequestBodyBuilderStub.build.returns(JSON.stringify(message.getInternalMessage()));
            SEND_TIMEOUT = 200;
            retryMessageStub.getNextInterval.returns(SEND_TIMEOUT);

            // first one returns sts/std
            comm.sendMessage(message, SEND_TIMEOUT, 5, false, successSpy, sandbox.spy(), sandbox.spy(), url);
            xhr.requests[0].respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({
                sts: 'aaa111',
                std: 'bbb222',
            }));

            wupServerSessionState.setSts('sts');
            wupServerSessionState.setStd('std');
            message = wupMessageBuilder.build(DEFAULT_WUP_TYPE, 'xxx');
            wupRequestBodyBuilderStub.build.onSecondCall().returns(JSON.stringify(message.getInternalMessage()));
            wupRequestBodyBuilderStub.build.onThirdCall().returns(JSON.stringify(message.getInternalMessage()));
            wupRequestBodyBuilderStub.build.onCall(3).returns(JSON.stringify(message.getInternalMessage()));
            wupRequestBodyBuilderStub.build.onCall(4).returns(JSON.stringify(message.getInternalMessage()));
            wupRequestBodyBuilderStub.build.onCall(5).returns(JSON.stringify(message.getInternalMessage()));

            // second fails
            retryMessageStub.shouldReMessage.returns(true);
            comm.sendMessage(message, SEND_TIMEOUT, 5, false, successSpy, retryFailureSpy, failureSpy, url);
            xhr.requests[1].respond(503, { 'Content-Type': 'application/json' },
                JSON.stringify({
                    csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx'],
                }));
            assert.isTrue(serverCommunicatorEnqueueToStartOfQueue.calledOnce);
            assert.equal(serverCommunicatorEnqueueToStartOfQueue.firstCall.thisValue._currentSentItem.messageToSend, message);

            // Make sure we don't have a request before the retry attempt

            assert.isUndefined(xhr.requests[2]);
            // Move clock to trigger retry timeout
            clock.tick(1);

            // Make sure we don't have a request before the retry attempt and not a milli before
            assert.isUndefined(xhr.requests[2]);

            // Move clock to trigger retry timeout
            clock.tick(199);
            //increment the time between retry
            SEND_TIMEOUT = 300
            retryMessageStub.getNextInterval.returns(SEND_TIMEOUT);

            xhr.requests[2].respond(503, { 'Content-Type': 'application/json' },
                JSON.stringify({
                    csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx'],
                }));

            assert.isTrue(serverCommunicatorEnqueueToStartOfQueue.calledTwice);
            assert.equal(serverCommunicatorEnqueueToStartOfQueue.secondCall.thisValue._currentSentItem.messageToSend, message);

            // Make sure we don't have a request before the retry attempt
            assert.isUndefined(xhr.requests[3]);
            // Move clock to trigger retry timeout
            clock.tick(299);
            // Make sure we don't have a request before the retry attempt and not a milli before
            assert.isUndefined(xhr.requests[3]);

            // Move clock to trigger retry timeout
            clock.tick(1);

            //increment the time between retry
            SEND_TIMEOUT = 400
            retryMessageStub.getNextInterval.returns(SEND_TIMEOUT);
            xhr.requests[3].respond(503, { 'Content-Type': 'application/json' },
                JSON.stringify({
                    csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx'],
                }));

            assert.isTrue(serverCommunicatorEnqueueToStartOfQueue.calledThrice);
            assert.equal(serverCommunicatorEnqueueToStartOfQueue.thirdCall.thisValue._currentSentItem.messageToSend, message);

            // Make sure we don't have a request before the retry attempt
            assert.isUndefined(xhr.requests[4]);
            // Move clock to trigger retry timeout
            clock.tick(399);
            // Make sure we don't have a request before the retry attempt and not a milli before
            assert.isUndefined(xhr.requests[4]);

            // Move clock to trigger retry timeout
            clock.tick(1);

            //increment the time between retry
            SEND_TIMEOUT = 200;
            retryMessageStub.getNextInterval.returns(SEND_TIMEOUT);

            xhr.requests[4].respond(503, { 'Content-Type': 'application/json' },
                JSON.stringify({
                    csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx'],
                }));
            assert.equal(retryFailureSpy.callCount, 4);
            assert.equal(serverCommunicatorEnqueueToStartOfQueue.callCount, 4);
            assert.equal(serverCommunicatorEnqueueToStartOfQueue.getCall(3).thisValue._currentSentItem.messageToSend, message);

            // Make sure we don't have a request before the retry attempt
            assert.isUndefined(xhr.requests[5]);
            // Move clock to trigger retry timeout
            clock.tick(199);
            // Make sure we don't have a request before the retry attempt and not a milli before
            assert.isUndefined(xhr.requests[5]);

            // Move clock to trigger retry timeout
            clock.tick(1);
            retryMessageStub.shouldReMessage.returns(false);

            xhr.requests[5].respond(503, { 'Content-Type': 'application/json' },
                JSON.stringify({
                    csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx'],
                }));

            assert.equal(retryFailureSpy.callCount, 5);
            assert.isTrue(failureSpy.calledOnce, 'onError was not called once');
            assert.equal(serverCommunicatorEnqueueToStartOfQueue.callCount, 4);

            message = wupMessageBuilder.build(DEFAULT_WUP_TYPE, 'yyy');
            wupRequestBodyBuilderStub.build.onCall(6).returns(JSON.stringify(message.getInternalMessage()));

            // third fails again
            comm.sendMessage(message, SEND_TIMEOUT, 5, false, successSpy, sandbox.spy(), sandbox.spy(), url);
            xhr.requests[6].respond(200, { 'Content-Type': 'application/json' },
                JSON.stringify({
                    csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx', 'yyy'],
                }));

            assert.equal(xhr.requests.length, 7);
            assert.equal(xhr.requests[0].method, 'POST');
            assert.equal(xhr.requests[0].url, url);

            const dataPacker = new DataPacker();
            let data = JSON.parse(xhr.requests[1].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(data.d[0], dataPacker.pack('xxx'));
            assert.equal(xhr.requests[1].status, 503);

            data = JSON.parse(xhr.requests[2].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(data.d[0], dataPacker.pack('xxx'));
            assert.equal(xhr.requests[2].status, 503);

            data = JSON.parse(xhr.requests[3].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(data.d[0], dataPacker.pack('xxx'));
            assert.equal(xhr.requests[3].status, 503);

            data = JSON.parse(xhr.requests[4].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(data.d[0], dataPacker.pack('xxx'));
            assert.equal(xhr.requests[4].status, 503);

            data = JSON.parse(xhr.requests[5].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(data.d[0], dataPacker.pack('xxx'));
            assert.equal(xhr.requests[5].status, 503);

            data = JSON.parse(xhr.requests[6].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(data.d[0], dataPacker.pack('yyy'));
            assert.equal(xhr.requests[6].status, 200);
        });


        it('verify context name change', function () {
            const url = 'http://www.test.com/';
            retryMessageStub.getMessageNumToRetry.returns(15);
            MAX_SEND_ATTEMPTS = retryMessageStub.getMessageNumToRetry();
            const comm = new ServerCommunicator(wupRequestBodyBuilderStub, SERVER_COMMUNICATOR_SETTINGS, WorkerUtils,retryMessageStub);

            const successSpy = sandbox.spy();

            const wupServerSessionState = new WupServerSessionState();
            const wupMessageBuilder = new WupMessageBuilder(wupServerSessionState, new DataPacker());

            wupServerSessionState.setCsid('abc');
            wupServerSessionState.setSid('defr');
            wupServerSessionState.setMuid('w1e2r3');
            wupServerSessionState.setContextName('login_1');
            wupServerSessionState.setRequestId(2);

            // first one returns sts/std
            let message = wupMessageBuilder.build('js', 'bbbb');
            wupRequestBodyBuilderStub.build.returns(JSON.stringify(message.getInternalMessage()));

            comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, false, successSpy, sandbox.spy(), sandbox.spy(), url);
            xhr.requests[0].respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({
                sts: 'aaa111',
                std: 'bbb222',
            }));

            wupServerSessionState.setContextName('login_2');

            wupServerSessionState.setSts('sss');
            wupServerSessionState.setStd('dddd');
            message = wupMessageBuilder.build(DEFAULT_WUP_TYPE, 'ccccc');
            wupRequestBodyBuilderStub.build.returns(JSON.stringify(message.getInternalMessage()));

            comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, false, successSpy, sandbox.spy(), sandbox.spy(), url);

            assert.equal(xhr.requests.length, 2);
            assert.equal(xhr.requests[0].method, 'POST');
            assert.equal(xhr.requests[0].url, url);
            assert.isTrue(xhr.requests[0].requestBody.indexOf('context_name') > -1);
        });

        it('send message only once current sent message reply was received', function () {
            const url = 'http://www.test.com/';
            const comm = new ServerCommunicator(wupRequestBodyBuilderStub, SERVER_COMMUNICATOR_SETTINGS, WorkerUtils,retryMessageStub);

            const processNextQueueItemSpy = sandbox.spy(comm, '_processNextQueueItem');

            const successSpy = sandbox.spy();

            const wupServerSessionState = new WupServerSessionState();
            const wupMessageBuilder = new WupMessageBuilder(wupServerSessionState, new DataPacker());

            wupServerSessionState.setCsid('aaa');
            wupServerSessionState.setSid('bbb111');
            wupServerSessionState.setMuid('mmm222');
            wupServerSessionState.setRequestId(2);

            let message = wupMessageBuilder.build('js', 'asfgjsklhfasdf');
            wupRequestBodyBuilderStub.build.returns(JSON.stringify(message.getInternalMessage()));

            // first one returns sts/std
            comm.sendMessage(message, SEND_TIMEOUT, 5, false, successSpy, sandbox.spy(), sandbox.spy(), url);
            xhr.requests[0].respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({
                sts: 'aaa111',
                std: 'bbb222',
            }));

            wupServerSessionState.setSts('sts');
            wupServerSessionState.setStd('std');
            message = wupMessageBuilder.build(DEFAULT_WUP_TYPE, 'xxx');
            wupRequestBodyBuilderStub.build.returns(JSON.stringify(message.getInternalMessage()));

            processNextQueueItemSpy.resetHistory();

            assert.equal(comm._awaitingServerResponse, false);

            comm.sendMessage(message, SEND_TIMEOUT, 5, false, successSpy, sandbox.spy(), sandbox.spy(), url);

            assert.isTrue(processNextQueueItemSpy.calledOnce);
            assert.equal(comm._awaitingServerResponse, true);

            comm.sendMessage(message, SEND_TIMEOUT, 5, false, successSpy, sandbox.spy(), sandbox.spy(), url);

            // Not called again at this point since we didn't receive response for the first message
            assert.isTrue(processNextQueueItemSpy.calledOnce);
            assert.equal(comm._dataQueue.length(), 1);
            assert.equal(comm._awaitingServerResponse, true);

            xhr.requests[1].respond(200, { 'Content-Type': 'application/json' },
                JSON.stringify({
                    csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx'],
                }));

            assert.isTrue(processNextQueueItemSpy.calledTwice);
            assert.isFalse(comm._dataQueue.hasItems());
        });

        it('new message failure should resend infinitely when max retries are set to 0', function () {
            const url = 'http://www.test.com/';
            retryMessageStub.getMessageNumToRetry.returns(15);
            MAX_SEND_ATTEMPTS = retryMessageStub.getMessageNumToRetry();
            retryMessageStub.getNextInterval.returns(SEND_TIMEOUT)
            const comm = new ServerCommunicator(wupRequestBodyBuilderStub, SERVER_COMMUNICATOR_SETTINGS, WorkerUtils,retryMessageStub);

            const serverCommunicatorEnqueueToStartOfQueue = sandbox.spy(comm, '_prepareMessageForSendRetry');

            const successSpy = sandbox.spy();

            const wupServerSessionState = new WupServerSessionState();
            const wupMessageBuilder = new WupMessageBuilder(wupServerSessionState, new DataPacker());

            wupServerSessionState.setCsid('aaa');
            wupServerSessionState.setSid('bbb111');
            wupServerSessionState.setMuid('mmm222');
            wupServerSessionState.setRequestId(2);

            let message = wupMessageBuilder.build('js', 'sdf');
            wupRequestBodyBuilderStub.build.returns(JSON.stringify(message.getInternalMessage()));

            // first one returns sts/std
            comm.sendMessage(message, SEND_TIMEOUT, 0, false, successSpy, sandbox.spy(), sandbox.spy(), url);
            xhr.requests[0].respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({
                sts: 'aaa111',
                std: 'bbb222',
            }));

            wupServerSessionState.setSts('sts');
            wupServerSessionState.setStd('std');
            message = wupMessageBuilder.build(DEFAULT_WUP_TYPE, 'xxx');
            wupRequestBodyBuilderStub.build.onSecondCall().returns(JSON.stringify(message.getInternalMessage()));
            wupRequestBodyBuilderStub.build.onThirdCall().returns(JSON.stringify(message.getInternalMessage()));
            wupRequestBodyBuilderStub.build.onCall(3).returns(JSON.stringify(message.getInternalMessage()));
            wupRequestBodyBuilderStub.build.onCall(4).returns(JSON.stringify(message.getInternalMessage()));
            wupRequestBodyBuilderStub.build.onCall(5).returns(JSON.stringify(message.getInternalMessage()));
            wupRequestBodyBuilderStub.build.returns(JSON.stringify(message.getInternalMessage()));

            // second fails
            retryMessageStub.shouldReMessage.returns(true);
            comm.sendMessage(message, SEND_TIMEOUT, 0, false, successSpy, sandbox.spy(), sandbox.spy(), url);
            xhr.requests[1].respond(503, { 'Content-Type': 'application/json' },
                JSON.stringify({
                    csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx'],
                }));

            assert.isTrue(serverCommunicatorEnqueueToStartOfQueue.calledOnce);
            assert.equal(serverCommunicatorEnqueueToStartOfQueue.firstCall.thisValue._currentSentItem.messageToSend, message);

            // Move clock to trigger retry timeout
            clock.tick(SEND_TIMEOUT);

            xhr.requests[2].respond(503, { 'Content-Type': 'application/json' },
                JSON.stringify({
                    csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx'],
                }));

            assert.isTrue(serverCommunicatorEnqueueToStartOfQueue.calledTwice);
            assert.equal(serverCommunicatorEnqueueToStartOfQueue.secondCall.thisValue._currentSentItem.messageToSend, message);

            // Move clock to trigger retry timeout
            clock.tick(SEND_TIMEOUT);

            xhr.requests[3].respond(503, { 'Content-Type': 'application/json' },
                JSON.stringify({
                    csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx'],
                }));

            assert.isTrue(serverCommunicatorEnqueueToStartOfQueue.calledThrice);
            assert.equal(serverCommunicatorEnqueueToStartOfQueue.thirdCall.thisValue._currentSentItem.messageToSend, message);

            // Move clock to trigger retry timeout
            clock.tick(SEND_TIMEOUT);

            xhr.requests[4].respond(503, { 'Content-Type': 'application/json' },
                JSON.stringify({
                    csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx'],
                }));

            assert.equal(serverCommunicatorEnqueueToStartOfQueue.callCount, 4);
            assert.equal(serverCommunicatorEnqueueToStartOfQueue.getCall(3).thisValue._currentSentItem.messageToSend, message);

            // Move clock to trigger retry timeout
            clock.tick(SEND_TIMEOUT);

            xhr.requests[5].respond(503, { 'Content-Type': 'application/json' },
                JSON.stringify({
                    csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx'],
                }));

            assert.equal(serverCommunicatorEnqueueToStartOfQueue.callCount, 5);

            // Move clock to trigger retry timeout
            clock.tick(SEND_TIMEOUT);

            xhr.requests[6].respond(503, { 'Content-Type': 'application/json' },
                JSON.stringify({
                    csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx'],
                }));

            assert.equal(serverCommunicatorEnqueueToStartOfQueue.callCount, 6);

            const dataPacker = new DataPacker();
            let data = JSON.parse(xhr.requests[1].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(data.d[0], dataPacker.pack('xxx'));
            assert.equal(xhr.requests[1].status, 503);

            data = JSON.parse(xhr.requests[2].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(data.d[0], dataPacker.pack('xxx'));
            assert.equal(xhr.requests[2].status, 503);

            data = JSON.parse(xhr.requests[3].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(data.d[0], dataPacker.pack('xxx'));
            assert.equal(xhr.requests[3].status, 503);

            data = JSON.parse(xhr.requests[4].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(data.d[0], dataPacker.pack('xxx'));
            assert.equal(xhr.requests[4].status, 503);

            data = JSON.parse(xhr.requests[5].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(data.d[0], dataPacker.pack('xxx'));

            data = JSON.parse(xhr.requests[6].requestBody);
            assert.equal(data.d.length, 1);
            assert.equal(data.d[0], dataPacker.pack('xxx'));
        });

        it('sendMessage wup config should fail 5 times on timeout', function () {
            const url = 'http://www.test.com/';
            const getPost = sandbox.stub(WorkerUtils, 'getPostUrl');
            const reMessasgeSettingStub = sandbox.createStubInstance(ReMessageSettings)
            reMessasgeSettingStub.getMessageNumToRetry.returns(6);
            const  retryMessage = new RetryMessage(reMessasgeSettingStub);


            const comm = new ServerCommunicator(wupRequestBodyBuilderStub, SERVER_COMMUNICATOR_SETTINGS, WorkerUtils,retryMessage);

            const successSpy = sandbox.spy();
            const wupServerSessionState = new WupServerSessionState();
            const wupMessageBuilder = new WupMessageBuilder(wupServerSessionState, new DataPacker());

            wupServerSessionState.setCsid('abc');
            wupServerSessionState.setSid('defr');
            wupServerSessionState.setMuid('w1e2r3');
            wupServerSessionState.setContextName('login_1');
            wupServerSessionState.setRequestId(2);
            wupServerSessionState.setSts('sts');
            wupServerSessionState.setStd('std');

            getPost.callsArgWith(4, 'timeout', comm.messageStruct);

            // first one returns sts/std
            const message = wupMessageBuilder.build('js', 'mess');
            wupRequestBodyBuilderStub.build.returns(JSON.stringify(message.getInternalMessage()));

            retryMessageStub.getNextInterval.returns(SEND_TIMEOUT);
            comm.sendMessage(message, SEND_TIMEOUT, 6, false, successSpy, sandbox.spy(), sandbox.spy(), url);

            // Move clock to trigger retry timeout
            clock.tick(6*SEND_TIMEOUT);

            const calls = getPost.getCalls();
            // one time original request, 6 retries
            assert.equal(calls.length, 7);
            assert.equal(calls[4].args[1], 'POST', 'method is not post');
            assert.equal(calls[4].args[0], url, 'not the expected url');
            const data = JSON.parse(calls[4].args[2]);
            assert.equal('abc', data.csid, 'csid not as expected');
            assert.equal('defr', data.cdsnum, 'cdsnum not as expected');
            assert.equal('w1e2r3', data.muid, 'muid not as expected');
            assert.equal('js', data.c, 'c not as expected');
            assert.equal('js', data.ds, 'c not as expected');

            getPost.restore();
        });

        it('sendMessage wup config should fail only once on timeout', function () {
            const url = 'http://www.test.com/';
            const getPost = sandbox.stub(WorkerUtils, 'getPostUrl');
            const reMessasgeSettingStub = sandbox.createStubInstance(ReMessageSettings);
            reMessasgeSettingStub.getMessageNumToRetry.returns(6);
            const retryMessage = new RetryMessage(reMessasgeSettingStub)
            const comm = new ServerCommunicator(wupRequestBodyBuilderStub, SERVER_COMMUNICATOR_SETTINGS, WorkerUtils,retryMessage);

            const successSpy = sandbox.spy();
            const wupServerSessionState = new WupServerSessionState();
            const wupMessageBuilder = new WupMessageBuilder(wupServerSessionState, new DataPacker());

            wupServerSessionState.setCsid('abc');
            wupServerSessionState.setSid('defr');
            wupServerSessionState.setMuid('w1e2r3');
            wupServerSessionState.setContextName('login_1');
            wupServerSessionState.setRequestId(2);
            wupServerSessionState.setSts('sts');
            wupServerSessionState.setStd('std');

            getPost
                .onFirstCall().callsArgWith(4, 'timeout', comm.messageStruct)
                .onSecondCall().callsArgWith(3, '{"sts":"aaa111","std":"bbb222", "wupResponseTimeout":2000}', comm.messageStruct);

            // first one returns sts/std
            const message = wupMessageBuilder.build('js', 'bbbbbb');
            wupRequestBodyBuilderStub.build.returns(JSON.stringify(message.getInternalMessage()));

            comm.sendMessage(message, SEND_TIMEOUT, 6, false, successSpy, sandbox.spy(), sandbox.spy(), url);

            // Move clock to trigger retry timeout
            clock.tick(SEND_TIMEOUT);

            const calls = getPost.getCalls();
            // one time original request, 1 retry which works
            assert.equal(calls.length, 2);
            assert.equal(calls[1].args[1], 'POST', 'method is not post');
            assert.equal(calls[1].args[0], url, 'not the expected url');
            const data = JSON.parse(calls[1].args[2]);
            assert.equal('abc', data.csid, 'csid not as expected');
            getPost.restore();
        });

    });

    describe('isReadyToSendData', function () {
        it('should return false if is paused = true', function () {
            const comm = new ServerCommunicator(wupRequestBodyBuilderStub, SERVER_COMMUNICATOR_SETTINGS, WorkerUtils,retryMessageStub);
            comm.setIsPaused(true)
            assert.isFalse(comm.isReadyToSendData(), 'expected to be ready');
        });

        it('should return false if is paused = true', function () {
            const comm = new ServerCommunicator(wupRequestBodyBuilderStub, SERVER_COMMUNICATOR_SETTINGS, WorkerUtils,retryMessageStub);
            comm.setIsPaused(false)
            assert.isTrue(comm.isReadyToSendData(), 'expected to be ready');
        });

        it('should return true if there is a server url', function () {
            const comm = new ServerCommunicator(wupRequestBodyBuilderStub, SERVER_COMMUNICATOR_SETTINGS, WorkerUtils,retryMessageStub, false);

            assert.isTrue(comm.isReadyToSendData(), 'expected to be ready');
        });
    });

    describe('updateSettings', function () {
        it('should settings successfully', function () {
            const comm = new ServerCommunicator(wupRequestBodyBuilderStub, SERVER_COMMUNICATOR_SETTINGS, WorkerUtils,retryMessageStub);
            let new_settings = { queueLoadThreshold: 234}
            comm.updateSettings(new_settings);


            assert.equal(comm._queueLoadThershold, 234);
        });
    });

    describe('flush', function(){
        const url = 'http://www.test.com/';
        let wupServerSessionState;
        let wupMessageBuilder;
        let message;

        beforeEach(function () {
            this.wupMock = sandbox.stub({
                getCompressedData() {
                },
            });

             wupServerSessionState = new WupServerSessionState();
             wupMessageBuilder = new WupMessageBuilder(wupServerSessionState, new DataPacker());

            // first one returns sts/std
            message = wupMessageBuilder.build(DEFAULT_WUP_TYPE, this.wupMock);
            wupServerSessionState.setCsid('abc');
            wupServerSessionState.setSid('defr');
            wupServerSessionState.setMuid('w1e2r3');
            wupServerSessionState.setContextName('login_1');
            wupServerSessionState.setRequestId(2);
            wupServerSessionState.setSts('sts');
            wupServerSessionState.setStd('std');

        });
        describe('flush fetch API', function () {
            before( function(){
                if(!DOMUtils.isWebWorkerFetchSupported()){
                    this.skip();
                }
            });
            it('should flush all queued data using fetch', async function () {
                const fetchSpy = sandbox.spy(self, 'fetch');
                const errorSpy = sandbox.spy();
                const successSpy = sandbox.spy();

                retryMessageStub.getMessageNumToRetry.returns(15);
                MAX_SEND_ATTEMPTS = retryMessageStub.getMessageNumToRetry();

                const comm = new ServerCommunicator(wupRequestBodyBuilderStub, SERVER_COMMUNICATOR_SETTINGS, WorkerUtils,retryMessageStub);

                wupRequestBodyBuilderStub.build.returns(JSON.stringify(message.getInternalMessage()))
                comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, true, successSpy, sandbox.spy(), errorSpy, url);
                comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, true, successSpy, sandbox.spy(), errorSpy, url);
                comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, true, successSpy, sandbox.spy(), errorSpy, url);
                comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, true, successSpy, sandbox.spy(), errorSpy, url);
                comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, true, successSpy, sandbox.spy(), errorSpy, url);

                await TestUtils.waitForNoAssertion(() => {
                    assert.deepEqual(fetchSpy.firstCall.args[1].body, JSON.stringify(message.getInternalMessage()));
                    assert.equal(fetchSpy.firstCall.args[1].keepalive,true,'expected keepalive to be true');
                    assert.equal(fetchSpy.firstCall.args[1].method,'POST','expected method request to be POST');
                    assert.equal(wupRequestBodyBuilderStub.build.firstCall.lastArg, true)
                    assert.equal(fetchSpy.callCount, 5,"fetch has not been called 5 times");
                    assert.isTrue(errorSpy.notCalled);
                    assert.isTrue(successSpy.notCalled);
                    fetchSpy.restore();
                });
            });

        });

        describe('flush AJAX', function(){
            before( function(){
                if(!DOMUtils.isWebWorkerFetchSupported()){
                    this.skip();
                }
            });

            it('should flush all queued data using AJAX', function(){
                const getPostUrlRequest = sandbox.spy(WorkerUtils,'getPostUrl');
                const fetchSpy = sandbox.spy(window,'fetch');
                const successSpy = sandbox.spy();
                const comm = new ServerCommunicator(wupRequestBodyBuilderStub, SERVER_COMMUNICATOR_SETTINGS, WorkerUtils,retryMessageStub);

                comm.sendMessage(message, SEND_TIMEOUT, MAX_SEND_ATTEMPTS, false, successSpy, sandbox.spy(), sandbox.spy(), url);
                TestUtils.waitForNoAssertion(()=>{
                    assert.equal(xhr.requests.length, 1, 'requests count is not 1');
                    assert.equal(xhr.requests[0].method, 'POST', 'method is not POST');
                    assert.equal(xhr.requests[0].url, url, 'url of request not match');

                    //asserts for the flush requests functions
                    assert.isFalse(fetchSpy.called,"fetchSpy was called");
                    assert.isTrue(getPostUrlRequest.calledOnce,"getPostUrlRequest was called more than once")
                });

            });
        });
    });

    describe('hash256 testing', function() {
        let url = 'http://www.test.com';
        let comm;
        let successSpy;
        let failedSpy;
        let retryFailedSpy;
        let message;
        const messageDestructor = 'wup'


        beforeEach(function() {
            comm = new ServerCommunicator(wupRequestBodyBuilderStub, SERVER_COMMUNICATOR_SETTINGS,
                WorkerUtils, 15, false, messageDestructor);
            successSpy = sandbox.spy();
            failedSpy = sandbox.spy();
            retryFailedSpy = sandbox.spy();
            message = new WupMessage();
            message.data = { a: 'message' };
        });
        afterEach(function() {
            sandbox.restore();
            url = null;
            comm = null;
            successSpy = null;
            failedSpy = null;
            retryFailedSpy = null;
            message = null;
        });

        it('should act normally when configuration set to false- default', async function() {
            const hashServiceSpy = sandbox.spy(HashService, 'hashSha256');
            const sendProcessedQueueItemSpy = sandbox.spy(comm, '_sendProcessedQueueItem');
            const sendWithFetchSpy = sandbox.spy(comm, '_sendWithFetch');
            const sendWithXMLHttpRequestSpy = sandbox.spy(comm, '_sendWithXMLHttpRequest');
            const checkQueueLengthSpy = sandbox.spy(comm, '_checkQueueLength');
            const workerUtilsSpy = sandbox.spy(WorkerUtils, 'getPostUrl');
            comm.sendMessage(message, SEND_TIMEOUT, retryMessageStub.getMessageNumToRetry, false, successSpy, sandbox.spy(), sandbox.spy(), url);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(hashServiceSpy.notCalled, 'hashSha256 should not be called');
                assert.isTrue(sendProcessedQueueItemSpy.calledOnce, '_sendProcessedQueueItem should be called once');
                assert.isTrue(workerUtilsSpy.calledOnce, 'getPostUrl should be called once');
                assert.isTrue(sendWithXMLHttpRequestSpy.calledOnce, '_sendWithXMLHttpRequest should be called once');
                assert.isTrue(checkQueueLengthSpy.calledOnce, '_checkQueueLength should be called once');
                assert.isTrue(sendWithFetchSpy.notCalled, '_sendWithFetch should not be called');
            }, 2000);
        });

        it('should hash wup message body', async function() {
            const hashServiceStub = sandbox.stub(HashService, 'hashSha256');
            const sendProcessedQueueItemSpy = sandbox.spy(comm, '_sendProcessedQueueItem');
            const sendWithFetchSpy = sandbox.spy(comm, '_sendWithFetch');
            const sendWithXMLHttpRequestSpy = sandbox.spy(comm, '_sendWithXMLHttpRequest');
            const checkQueueLengthSpy = sandbox.spy(comm, '_checkQueueLength');
            const workerUtilsSpy = sandbox.spy(WorkerUtils, 'getPostUrl');
            comm.updateEnableWupMessagesHashing(true);

            hashServiceStub.callsFake((message, callback) => {
                callback(null, 'hashedMessage');
            })
            comm.sendMessage(message, SEND_TIMEOUT, retryMessageStub.getMessageNumToRetry, false,
                successSpy, retryFailedSpy, failedSpy, url);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(hashServiceStub.calledOnce, 'hashSha256 should have been called');
                assert.isTrue(sendProcessedQueueItemSpy.calledOnce, '_sendProcessedQueueItem should be called once');
                assert.isTrue(workerUtilsSpy.calledOnce, 'getPostUrl should be called once');
                assert.isTrue(sendWithFetchSpy.notCalled, '_sendWithFetch should not be called once');
                assert.isTrue(sendWithXMLHttpRequestSpy.calledOnce, '_sendWithXMLHttpRequest should be called once');
                assert.isTrue(checkQueueLengthSpy.calledOnce, '_checkQueueLength should be called once');
            });
        });

        it('should log out an error when hashing fails', async function() {
            const hashServiceStub = sandbox.stub(HashService, 'hashSha256');
            const sendProcessedQueueItemSpy = sandbox.spy(comm, '_sendProcessedQueueItem');
            const sendWithFetchSpy = sandbox.spy(comm, '_sendWithFetch');
            const sendWithXMLHttpRequestSpy = sandbox.spy(comm, '_sendWithXMLHttpRequest');
            const checkQueueLengthSpy = sandbox.spy(comm, '_checkQueueLength');
            const workerUtilsSpy = sandbox.spy(WorkerUtils, 'getPostUrl');
            const logSpy = sandbox.spy(Log, 'error');
            comm.updateEnableWupMessagesHashing(true);

            hashServiceStub.callsFake((message, callback) => {
                callback('error', null);
            })
            comm.sendMessage(message, SEND_TIMEOUT, retryMessageStub.getMessageNumToRetry, false,
                successSpy, retryFailedSpy, failedSpy, url);

            const args = logSpy.getCall(0).args[0];

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(logSpy.calledOnce, 'log error should be called once');
                assert.equal(args, 'error', 'log error should be called with error');
                assert.isTrue(hashServiceStub.calledOnce, 'hashSha256 should have been called');
                assert.isTrue(sendProcessedQueueItemSpy.notCalled, '_sendProcessedQueueItem should not be called');
                assert.isTrue(workerUtilsSpy.notCalled, 'getPostUrl should not be called');
                assert.isTrue(sendWithFetchSpy.notCalled, '_sendWithFetch should not be called once');
                assert.isTrue(sendWithXMLHttpRequestSpy.notCalled, '_sendWithXMLHttpRequest should not be called once');
                assert.isTrue(checkQueueLengthSpy.notCalled, '_checkQueueLength should not be called once');
            });
        });

        describe('hashing fetch request body', function() {
            before(function() {
                if(!DOMUtils.isWebWorkerFetchSupported()){
                    this.skip();
                }
            });

            it('should hash fetch request body and send as a custom header', async function () {
                const fetchStub = sandbox.stub(window, 'fetch');
                const hashServiceStub = sandbox.stub(HashService, 'hashSha256');
                const sendProcessedQueueItemSpy = sandbox.spy(comm, '_sendProcessedQueueItem');
                const sendWithFetchSpy = sandbox.spy(comm, '_sendWithFetch');
                const workerUtilsSpy = sandbox.spy(WorkerUtils, 'getPostUrl');
                comm.updateEnableWupMessagesHashing(true);

                hashServiceStub.callsFake((message, callback) => {
                    callback(null, 'hashedMessage');
                });

                comm.sendMessage(message, SEND_TIMEOUT, retryMessageStub.getMessageNumToRetry, true,
                    successSpy, retryFailedSpy, failedSpy, url);

                const fetchCall = fetchStub.getCall(0);
                const fetchArgs = fetchCall.args[0];
                const fetchOptions = fetchCall.args[1];

                const headers = fetchOptions.headers instanceof Headers ? fetchOptions.headers : new Headers(fetchOptions.headers);

                await TestUtils.waitForNoAssertion(() => {
                    assert.isTrue(fetchStub.calledOnce, 'fetch should have been called');
                    assert.equal(fetchOptions.method, 'POST', 'fetch method should be POST');
                    assert.equal(headers.get('X-h'), 'hashedMessage', 'fetch header should be hashedMessage');
                    assert.equal(fetchArgs, url, 'fetch url should be url');
                    assert.isTrue(workerUtilsSpy.notCalled, 'getPostUrl should not be called');
                    assert.isTrue(sendProcessedQueueItemSpy.calledOnce, '_sendProcessedQueueItem should be called once');
                    assert.isTrue(sendWithFetchSpy.calledOnce, '_sendWithFetch should be called once');
                });
            });
        });
    });
    describe('_sendWithXMLHttpRequest', () => {
        let postUrlStub, comm;

        beforeEach(() => {
            comm = new ServerCommunicator(wupRequestBodyBuilderStub, SERVER_COMMUNICATOR_SETTINGS, WorkerUtils,
                15, false);
            postUrlStub = sandbox.stub(comm._workerUtils, 'getPostUrl');
        });

        afterEach(() => {
            sandbox.restore();
            comm = null;
            postUrlStub = null;
        });

        it('should call getPostUrl with correct arguments', () => {
            const requestBody = 'testBody';
            const item = { onSuccess: () => {}, onError: () => {} };
            const hashedBody = 'hashedBody';

            comm._sendWithXMLHttpRequest(requestBody, item, hashedBody);

            assert.isTrue(postUrlStub.calledOnce, 'getPostUrl should be called once');
            sinon.assert.calledWith(postUrlStub, comm.wupUrl, 'POST', requestBody, item.onSuccess, item.onError,
                comm._acceptNoResponse, item.timeout, hashedBody);
        });
    });

    describe('_sendWithFetch', () => {
        let fetchStub, logInfoStub, comm;

        before(function() {
            if(!DOMUtils.isWebWorkerFetchSupported()){
                this?.skip();
            }
        });

        beforeEach(() => {
            comm = new ServerCommunicator(wupRequestBodyBuilderStub, SERVER_COMMUNICATOR_SETTINGS, WorkerUtils,
                15, false);
            fetchStub = sandbox.stub(self, 'fetch').resolves();
            logInfoStub = sandbox.stub(Log, 'info');
        });

        afterEach(() => {
            sandbox.restore();
            fetchStub = null;
            logInfoStub = null;
            comm = null;
        });

        it('should call fetch with correct requestOptions', () => {
            const requestOptions = { method: 'POST' }; // Fill in with appropriate test data
            comm._sendWithFetch(requestOptions);

            assert.isTrue(fetchStub.calledOnce, 'fetch should be called once');
            sinon.assert.calledWith(fetchStub, comm.wupUrl, requestOptions);
            assert.isTrue(logInfoStub.calledOnce, 'logInfo should be called once');
        });
    });

    describe('_checkQueueLength', () => {
        let logWarnStub, comm;

        beforeEach(() => {
            comm = new ServerCommunicator(wupRequestBodyBuilderStub, SERVER_COMMUNICATOR_SETTINGS, WorkerUtils,
                15, false);
            logWarnStub = sandbox.stub(Log, 'warn');
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should log a warning if queue length exceeds threshold', () => {
            // Setup your dataQueue and threshold
            comm._dataQueue = { length: () => {return 10} };
            comm._queueLoadThershold = 5;

            comm._checkQueueLength();

            sinon.assert.calledOnce(logWarnStub);
        });

        it('should not log a warning if queue length is below threshold', () => {
            comm._dataQueue = { length: () => {return 3} };
            comm._queueLoadThershold = 5;

            comm._checkQueueLength();

            sinon.assert.notCalled(logWarnStub);
        });
    });
});
