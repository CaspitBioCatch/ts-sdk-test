import sinon from "sinon";
import Log from "../../../../../../src/main/technicalServices/log/Logger";
import CookieEnabledBrowserPropsContract from "../../../../../../src/main/contract/staticContracts/browserPropsContract/CookieEnabledBrowserPropsContract";

describe('CookieEnabledBrowserPropsContract test:', function () {
    let isCookie = true;
    let logMessage = '';
    let name = 'cookie_enabled';
    let validateMessageLog = 'CookieEnabled,BrowserPropsContract - Contract verification failed'


    const assert = chai.assert;
    function getPreCondLogMessage (isCookie){
        return `wrong type in CookieEnabled, BrowserProps parameters. isCookie : {expected: boolean, received: ${ typeof isCookie}}`;
    }

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
        isCookie = true;
        name = 'cookie_enabled';
        logMessage = '';
    });


    it('parameters initialization', function () {
        let cookieEnabledBrowserPropsContract = new CookieEnabledBrowserPropsContract(isCookie);
        assert.equal(cookieEnabledBrowserPropsContract.isCookie, true, 'isCookie is not initialized correctly');
    });

    it('pre condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new CookieEnabledBrowserPropsContract(isCookie);
        assert.isFalse(this._logWarnStub.called, 'did  send log message while should not');
    });

    it('pre condition is not valid: receive string instead of boolean. should send log', function () {
        isCookie ='hello'
        logMessage = getPreCondLogMessage (isCookie)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new CookieEnabledBrowserPropsContract(isCookie);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });

    it('pre condition is not valid: receive number instead of boolean. should send log', function () {
        isCookie = 6;
        logMessage = getPreCondLogMessage (isCookie)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new CookieEnabledBrowserPropsContract(isCookie);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });

    it('build message', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let cookieEnabledBrowserPropsContract =  new CookieEnabledBrowserPropsContract(isCookie);
        let isCookieBrowsingMessage = cookieEnabledBrowserPropsContract.buildQueueMessage();

        assert.equal(isCookieBrowsingMessage[0], name, 'build message built unsuccessfully');
        assert.equal(isCookieBrowsingMessage[1], isCookie, 'build message built unsuccessfully');
    });

    it('post condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let cookieEnabledBrowserPropsContract =  new CookieEnabledBrowserPropsContract(isCookie);
        cookieEnabledBrowserPropsContract.buildQueueMessage();
        assert.isFalse(this._logWarnStub.called, 'did  send log message while should not');
    });

    it('getName is valid', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let cookieEnabledBrowserPropsContract =  new CookieEnabledBrowserPropsContract(isCookie);
        let gettingName = cookieEnabledBrowserPropsContract.getName();
        assert.equal(gettingName,name, 'getName is not correct');
    });
    it('message is invalid', function () {
        isCookie ='hello'
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let cookieEnabledBrowserPropsContract = new CookieEnabledBrowserPropsContract(isCookie);
        cookieEnabledBrowserPropsContract.buildQueueMessage();

        assert.isTrue(this._logWarnStub.calledTwice, 'did not send log message while should');
        assert.equal(this._logWarnStub.secondCall.args[0], validateMessageLog);
    });


});