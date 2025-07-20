import sinon from "sinon";
import Log from '../../../../../../src/main/technicalServices/log/Logger';
import {assert} from "chai";
import {
    BrowserDisplayBrowserPropsContract
} from "../../../../../../src/main/contract/staticContracts/browserPropsContract/BrowserDisplayBrowserPropsContract";

describe('browserDisplayBrowserPropsContract test:', function () {

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    it('parameters initialization', function () {
        let contract = new BrowserDisplayBrowserPropsContract('display');
        assert.equal(contract.browserDisplay, 'display', 'browserDisplay is not initialized correctly');
    });

    it('pre condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new BrowserDisplayBrowserPropsContract('display');
        assert.isFalse(this._logWarnStub.called, 'did send log message while should not');
    });

    it('pre condition is not valid: receive number instead of string. should send log', function () {
        const browserDisplay = 123;
        const logMessage = `wrong type in BrowserDisplay, BrowserProps parameters. BrowserDisplay : {expected: string, received: ${typeof browserDisplay}}`;
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new BrowserDisplayBrowserPropsContract(browserDisplay);
        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });

    it('buildQueueMessage returns expected message format', function () {
        let contract = new BrowserDisplayBrowserPropsContract('display');
        let message = contract.buildQueueMessage();
        assert.deepEqual(message, ['browser_display_detect', 'display'], 'buildQueueMessage did not return the expected format');
    });

    it('validateMessage with valid message should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let contract = new BrowserDisplayBrowserPropsContract('display');
        contract.validateMessage(['browser_display_detect', 'display']);
        assert.isFalse(this._logWarnStub.called, 'did send log message while should not');
    });

    it('validateMessage with invalid message should send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let contract = new BrowserDisplayBrowserPropsContract('display');
        contract.validateMessage(['browser_display_detect', 123]);
        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], 'TransparencyReduced, BrowserPropsContract - Contract verification failed');
    });
});
