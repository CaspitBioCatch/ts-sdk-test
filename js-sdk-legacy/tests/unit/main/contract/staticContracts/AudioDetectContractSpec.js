import sinon from "sinon";
import Log from "../../../../../src/main/technicalServices/log/Logger";
import AudioDetectContract from "../../../../../src/main/contract/staticContracts/AudioDetectContract";
import {assert} from "chai";

describe('AudioDetectContract test:', function () {

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    it('parameters initialization', function () {
        let audioDetectContract = new AudioDetectContract('acoustic');
        assert.equal(audioDetectContract.acoustic, 'acoustic', 'acoustic is not initialized correctly');
    });

    it('pre condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new AudioDetectContract('acoustic');
        assert.isFalse(this._logWarnStub.called, 'did send log message while should not');
    });

    it('pre condition is not valid: receive number instead of string. should send log', function () {
        const acoustic = 123;
        const logMessage = `wrong type in AudioDetect parameters. renderer: {expected: string, received: ${typeof acoustic}}`;
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new AudioDetectContract(acoustic);
        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });

    it('buildQueueMessage returns expected message format', function () {
        let audioDetectContract = new AudioDetectContract('acoustic');
        let message = audioDetectContract.buildQueueMessage();
        assert.deepEqual(message, ['audio_detect', 'acoustic'], 'buildQueueMessage did not return the expected format');
    });

    it('validateMessage with valid message should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let audioDetectContract = new AudioDetectContract('acoustic');
        audioDetectContract.validateMessage(['audio_detect', ['acoustic']]);
        assert.isTrue(this._logWarnStub.called, 'did send log message while should not');
    });

    it('validateMessage with invalid message should send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let audioDetectContract = new AudioDetectContract('acoustic');
        audioDetectContract.validateMessage(['audio_detect', 123]);
        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], 'AudioDetect - Contract verification failed');
    });
});
