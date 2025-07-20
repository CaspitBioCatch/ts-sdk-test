import sinon from "sinon";
import Log from "../../../../../src/main/technicalServices/log/Logger";
import ScreenHighResContract from "../../../../../src/main/contract/staticContracts/ScreenHighResContract";
import {assert} from "chai";

describe('ScreenHighResContract test:', function () {

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    it('parameters initialization', function () {
        let screenHighResContract = new ScreenHighResContract(true);
        assert.equal(screenHighResContract.isHighRes, true, 'isHighRes is not initialized correctly');
    });

    it('pre condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new ScreenHighResContract(true);
        assert.isFalse(this._logWarnStub.called, 'did send log message while should not');
    });

    it('pre condition is not valid: receive number instead of boolean. should send log', function () {
        const isHighRes = 123;
        const logMessage = `wrong type in ScreenHighRes parameters. isHighRes : {expected: boolean, received: ${ typeof isHighRes}}`
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new ScreenHighResContract(isHighRes);
        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });

    it('buildQueueMessage returns expected message format', function () {
        let screenHighResContract = new ScreenHighResContract(true);
        let message = screenHighResContract.buildQueueMessage();
        assert.deepEqual(message, ['screen_high_res', true], 'buildQueueMessage did not return the expected format');
    });

    it('validateMessage with valid message should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let screenHighResContract = new ScreenHighResContract(false);
        screenHighResContract.validateMessage(['screen_high_res', false]);
        assert.isFalse(this._logWarnStub.called, 'did send log message while should not');
    });

    it('validateMessage with invalid message should send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let screenHighResContract = new ScreenHighResContract(true);
        screenHighResContract.validateMessage(['screen_high_res', 123]);
        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], 'ScreenHighRes - Contract verification failed');
    });
});