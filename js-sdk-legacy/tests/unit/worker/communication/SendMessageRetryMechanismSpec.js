import WorkerUtils from "../../../../src/worker/utils/WorkerUtils";
import ReMessageSettings from "../../../../src/worker/communication/ReMessageSettings";
import RetryMessage from "../../../../src/worker/communication/RetryMessage";
import ServerCommunicator from "../../../../src/worker/communication/ServerCommunicator";
import WupServerSessionState from "../../../../src/worker/communication/WupServerSessionState";
import WupMessageBuilder from "../../../../src/worker/communication/WupMessageBuilder";
import DataPacker from "../../../../src/worker/wup/DataPacker";
import {assert} from "chai";
import sinon from "sinon";
import WupRequestBodyBuilder from "../../../../src/worker/communication/WupRequestBodyBuilder";
import {DEFAULT_WUP_TYPE} from '../../../../src/worker/communication/Constants';

describe('Send Message Retry tests:', function () {
    let sandbox = null;
    let wupRequestBodyBuilderStub = null;
    let xhr = null;
    let clock = null;
    let settings = {queueLoadThreshold : 100};


    beforeEach(function () {
        sandbox = sinon.createSandbox();
        wupRequestBodyBuilderStub = sandbox.createStubInstance(WupRequestBodyBuilder);

        xhr = sandbox.useFakeServer();
        clock = sandbox.useFakeTimers();
    });

    afterEach(function () {
        sandbox.restore();
    });

    it('request body builder is called in the correct time interval', function () {
        const url = 'http://www.test.com/';

        let messageNumToRetry = 5;
        let messageRetryInterval = 100;
        let incrementalGrowthBetweenFailures = 100;
        let maxIntervalBetweenFailures = 400;
        let reMessageSetting = new ReMessageSettings(messageNumToRetry, messageRetryInterval, incrementalGrowthBetweenFailures, maxIntervalBetweenFailures);
        let retryMessage = new RetryMessage(reMessageSetting);
        const comm = new ServerCommunicator(wupRequestBodyBuilderStub, settings, WorkerUtils,retryMessage);

        const successSpy = sandbox.spy();
        const wupServerSessionState = new WupServerSessionState();
        const wupMessageBuilder = new WupMessageBuilder(wupServerSessionState, new DataPacker());
        let SEND_TIMEOUT = messageRetryInterval;

        wupServerSessionState.setCsid('aaa');
        wupServerSessionState.setSid('bbb111');
        wupServerSessionState.setMuid('mmm222');
        wupServerSessionState.setRequestId(2);

        let message = wupMessageBuilder.build('js', 'sdf');
        wupRequestBodyBuilderStub.build.returns(JSON.stringify(message.getInternalMessage()));

        // first one returns sts/std
        comm.sendMessage(message, SEND_TIMEOUT, messageNumToRetry, false, successSpy, sandbox.spy(), sandbox.spy(), url);
        xhr.requests[0].respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({
            sts: 'aaa111',
            std: 'bbb222',
        }));
        assert.isTrue(wupRequestBodyBuilderStub.build.calledOnce, 'request body builder build method was not called once');

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
        comm.sendMessage(message, SEND_TIMEOUT, messageNumToRetry, false, successSpy, sandbox.spy(), sandbox.spy(), url);
        xhr.requests[1].respond(503, { 'Content-Type': 'application/json' },
            JSON.stringify({
                csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx'],
            }));

        assert.isTrue(wupRequestBodyBuilderStub.build.calledTwice, 'request body builder build method was not called thrice');

        // Move clock to trigger retry timeout - messageRetryInterval = 100
        clock.tick(SEND_TIMEOUT);
        assert.isTrue(wupRequestBodyBuilderStub.build.calledThrice, 'request body builder build method was not called thrice');

        xhr.requests[2].respond(503, { 'Content-Type': 'application/json' },
            JSON.stringify({
                csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx'],
            }));
        // Move clock to trigger retry timeout - messageRetryInterval = 200
        clock.tick(2*SEND_TIMEOUT);
        assert.equal(wupRequestBodyBuilderStub.build.callCount, 4);

        xhr.requests[3].respond(503, { 'Content-Type': 'application/json' },
            JSON.stringify({
                csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx'],
            }));

        //build count stay the same before clock tick
        assert.equal(wupRequestBodyBuilderStub.build.callCount, 4);

        // Move clock to trigger retry timeout - messageRetryInterval = 400
        //build count stay the same before clock tick, and not change a second before
        clock.tick(4*SEND_TIMEOUT-1);
        assert.equal(wupRequestBodyBuilderStub.build.callCount, 4);
        clock.tick(1);
        assert.equal(wupRequestBodyBuilderStub.build.callCount, 5);

        xhr.requests[4].respond(503, { 'Content-Type': 'application/json' },
            JSON.stringify({
                csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx'],
            }));
        // messageRetryInterval = 400 (reach to maxIntervalBetweenFailures and stop incrementing )
        clock.tick(4*SEND_TIMEOUT);
        assert.equal(wupRequestBodyBuilderStub.build.callCount, 6);


        xhr.requests[5].respond(503, { 'Content-Type': 'application/json' },
            JSON.stringify({
                csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx'],
            }));

        // Move clock to trigger retry timeout - the interval is now equal to max interval = 400
        clock.tick(4*SEND_TIMEOUT);
        assert.equal(wupRequestBodyBuilderStub.build.callCount, 7);


        xhr.requests[6].respond(503, { 'Content-Type': 'application/json' },
            JSON.stringify({
                csid: 'aaa', cdsnum: 'bbb111', muid: 'mmm222', d: ['xxx'],
            }));
        clock.tick(4*SEND_TIMEOUT);
        //the retry num reached to messageNumToRetry (one successes message sending + one failure of message sending + 5 retry)
        assert.equal(wupRequestBodyBuilderStub.build.callCount, 7);

    });

});



