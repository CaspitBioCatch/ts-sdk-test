import sinon from "sinon";
import Log from "../../../../../../src/main/technicalServices/log/Logger";
import JsUaBrowserPropsContract from "../../../../../../src/main/contract/staticContracts/browserPropsContract/JsUaBrowserPropsContract";

describe('JsUaBrowserPropsContract test:', function () {
    let userAgent = 'Mozilla/5.0';
    let logMessage = '';
    let name = 'js_ua';
    let validateMessageLog = 'js_ua, BrowserPropsContract - Contract verification failed';


    const assert = chai.assert;
    function getPreCondLogMessage (userAgent){
        return `wrong type in JsUa, BrowserProps parameters. userAgent : {expected: string, received: ${ typeof userAgent}}`;
    }

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
        userAgent = 'Mozilla/5.0';
        name = 'js_ua';
        logMessage = '';
    });


    it('parameters initialization', function () {
        let jsUaBrowserPropsContract = new JsUaBrowserPropsContract(userAgent);
        assert.equal(jsUaBrowserPropsContract.userAgent, userAgent, 'userAgent is not initialized correctly');
    });

    it('pre condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new JsUaBrowserPropsContract(userAgent);
        assert.isFalse(this._logWarnStub.called, 'did send log message while should not');
    });

    it('pre condition is not valid: receive number instead of string. should send log', function () {
        userAgent = 1;
        logMessage = getPreCondLogMessage (userAgent)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new JsUaBrowserPropsContract(userAgent);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });


    it('build message', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let jsUaBrowserPropsContract =  new JsUaBrowserPropsContract(userAgent);
        let jsUaBrowsingMessage = jsUaBrowserPropsContract.buildQueueMessage();

        assert.equal(jsUaBrowsingMessage[0], name, 'build message built unsuccessfully');
        assert.equal(jsUaBrowsingMessage[1], userAgent, 'build message built unsuccessfully');
    });

    it('post condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let jsUaBrowserPropsContract =  new JsUaBrowserPropsContract(userAgent);
        jsUaBrowserPropsContract.buildQueueMessage();
        assert.isFalse(this._logWarnStub.called, 'did  send log message while should not');
    });

    it('getName is valid', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let jsUaBrowserPropsContract =  new JsUaBrowserPropsContract(userAgent);
        let gettingName = jsUaBrowserPropsContract.getName();
        assert.equal(gettingName,name, 'getName is not correct');
    });

    it('message is invalid', function () {
        userAgent = 1;
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let jsUaBrowserPropsContract =  new JsUaBrowserPropsContract(userAgent);
        jsUaBrowserPropsContract.buildQueueMessage();

        assert.isTrue(this._logWarnStub.calledTwice, 'did not send log message while should');
        assert.equal(this._logWarnStub.secondCall.args[0], validateMessageLog);
    });


});