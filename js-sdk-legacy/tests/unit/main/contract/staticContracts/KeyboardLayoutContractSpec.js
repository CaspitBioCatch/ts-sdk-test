import sinon from "sinon";
import Log from "../../../../../src/main/technicalServices/log/Logger";
import KeyboardLayoutContract from "../../../../../src/main/contract/staticContracts/KeyboardLayoutContract";
import {assert} from "chai";

describe('KeyboardLayoutContract test:', function () {

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    it('parameters initialization', function () {
        const keyboardLayout = "b0e106ee1de7ce5ea7bcc1bd50542ddd";
        let keyboardLayoutContract = new KeyboardLayoutContract(keyboardLayout);
        assert.equal(keyboardLayoutContract.keyboardLayout, keyboardLayout, 'keyboardLayout is not initialized correctly');
    });

    it('pre condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new KeyboardLayoutContract("b0e106ee1de7ce5ea7bcc1bd50542ddd");
        assert.isFalse(this._logWarnStub.called, 'did send log message while should not');
    });

    it('pre condition is not valid: receive number instead of string. should send log', function () {
        const keyboardLayout = 123;
        const logMessage = `wrong type in KeyboardLayout parameters. keyboardLayout : {expected: string, received: ${ typeof keyboardLayout}}`
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new KeyboardLayoutContract(keyboardLayout);
        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });

    it('buildQueueMessage returns expected message format', function () {
        const keyboardLayout = "b0e106ee1de7ce5ea7bcc1bd50542ddd";
        let keyboardLayoutContract = new KeyboardLayoutContract(keyboardLayout);
        let message = keyboardLayoutContract.buildQueueMessage();
        assert.deepEqual(message, ['keyboard_layout', keyboardLayout], 'buildQueueMessage did not return the expected format');
    });

    it('validateMessage with valid message should not send log', function () {
        const keyboardLayout = "b0e106ee1de7ce5ea7bcc1bd50542ddd";
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let keyboardLayoutContract = new KeyboardLayoutContract(keyboardLayout);
        keyboardLayoutContract.validateMessage(['keyboard_layout', keyboardLayout]);
        assert.isFalse(this._logWarnStub.called, 'did send log message while should not');
    });

    it('validateMessage with invalid message should send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let keyboardLayoutContract = new KeyboardLayoutContract("b0e106ee1de7ce5ea7bcc1bd50542ddd");
        keyboardLayoutContract.validateMessage(['keyboard_layout', 123]);
        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], 'KeyboardLayout - Contract verification failed');
    });
});