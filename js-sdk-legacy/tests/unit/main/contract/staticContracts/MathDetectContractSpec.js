import sinon from "sinon";
import Log from "../../../../../src/main/technicalServices/log/Logger";
import {assert} from "chai";
import MathDetectContract from "../../../../../src/main/contract/staticContracts/MathDetectContract";

describe('MathDetectContract test:', function () {

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    it('parameters initialization', function () {
        let mathDetectContract = new MathDetectContract('math');
        assert.equal(mathDetectContract.math, 'math', 'math is not initialized correctly');
    });

    it('pre condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new MathDetectContract('math');
        assert.isFalse(this._logWarnStub.called, 'did send log message while should not');
    });

    it('pre condition is not valid: receive number instead of string. should send log', function () {
        const math = 123;
        const logMessage = `wrong type in MathDetect parameters. renderer: {expected: string, received: ${typeof math}}`;
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new MathDetectContract(math);
        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });

    it('buildQueueMessage returns expected message format', function () {
        let mathDetectContract = new MathDetectContract('math');
        let message = mathDetectContract.buildQueueMessage();
        assert.deepEqual(message, ['math_detect', 'math'], 'buildQueueMessage did not return the expected format');
    });

    it('validateMessage with valid message should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let mathDetectContract = new MathDetectContract('math');
        mathDetectContract.validateMessage(['math_detect', ['math']]);
        assert.isTrue(this._logWarnStub.called, 'did send log message while should not');
    });

    it('validateMessage with invalid message should send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let mathDetectContract = new MathDetectContract('math');
        mathDetectContract.validateMessage(['math_detect', 123]);
        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], 'MathDetect - Contract verification failed');
    });
});
