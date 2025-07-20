import BrowserDetectContract from "../../../../../src/main/contract/staticContracts/BrowserDetectContract";
import Log from "../../../../../src/main/technicalServices/log/Logger";
import sinon from "sinon";

describe('BrowserDetectContract test:', function () {
    let isChrome = false;
    let isFirefox = true;
    let isEdge = false;
    let isIE = false;
    let isSafari = false;
    let isOpera = false;
    let isBlink = false;
    let logMessage = '';
    let name = 'browser_spoofing';
    let validateMessageLog = 'BrowserDetect - Contract verification failed';


    const assert = chai.assert;
    function getPreCondLogMessage (isChrome, isFirefox, isEdge, isIE, isSafari, isOpera, isBlink){
        return `wrong type in Per, BrowserDetectContract, parameters. isChrome : {expected: boolean, received: ${ typeof isChrome}},
            isFirefox : {expected: boolean, received: ${ typeof isFirefox}},isEdge : {expected: boolean, received: ${ typeof isEdge}},isIE : {expected: boolean, received: ${ typeof isIE}},
            isSafari : {expected: boolean, received: ${ typeof isSafari}},isOpera : {expected: boolean, received: ${ typeof isOpera}} ,isBlink : {expected: boolean, received: ${ typeof isBlink}}`
    }

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
        isChrome = false;
        isFirefox = true;
        isEdge = false;
        isIE = false;
        isSafari = false;
        isOpera = false;
        isBlink = false;
        logMessage = '';

    });


    it('parameters initialization', function () {
        let browserDetectContract = new BrowserDetectContract(isChrome, isFirefox, isEdge, isIE, isSafari, isOpera, isBlink);
        assert.equal(browserDetectContract.isChrome, false, 'isChrome is not initialized correctly');
        assert.equal(browserDetectContract.isFirefox, true, 'isFirefox is not initialized correctly');
        assert.equal(browserDetectContract.isEdge, false, 'isEdge is not initialized correctly');
        assert.equal(browserDetectContract.isIE, false, 'isIE is not initialized correctly');
        assert.equal(browserDetectContract.isSafari, false, 'isSafari is not initialized correctly');
        assert.equal(browserDetectContract.isOpera, false, 'isOpera is not initialized correctly');
        assert.equal(browserDetectContract.isBlink, false, 'isBlink is not initialized correctly');

    });
    it('pre condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new BrowserDetectContract(isChrome, isFirefox, isEdge, isIE, isSafari, isOpera, isBlink);
        assert.isFalse(this._logWarnStub.called, 'did  send log message while should not');
    });

    it('pre condition is not valid: receive number instead of boolean. should send log', function () {
        isChrome =2
        logMessage = getPreCondLogMessage (isChrome, isFirefox, isEdge, isIE, isSafari, isOpera, isBlink)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new BrowserDetectContract(isChrome, isFirefox, isEdge, isIE, isSafari, isOpera, isBlink);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });

    it('pre condition is not valid: receive empty string instead of boolean. should send log', function () {
        isSafari = '';
        logMessage = getPreCondLogMessage (isChrome, isFirefox, isEdge, isIE, isSafari, isOpera, isBlink)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new BrowserDetectContract(isChrome, isFirefox, isEdge, isIE, isSafari, isOpera, isBlink);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });

    it('build message', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let browserDetectContract = new BrowserDetectContract(isChrome, isFirefox, isEdge, isIE, isSafari, isOpera, isBlink);
        let browserDetectMessage = browserDetectContract.buildQueueMessage();

        assert.equal(browserDetectMessage[0], name, 'build message built unsuccessfully');
        assert.equal(browserDetectMessage[1][0], isChrome, 'build message built unsuccessfully');
        assert.equal(browserDetectMessage[1][1], isFirefox, 'build message built unsuccessfully');
        assert.equal(browserDetectMessage[1][2], isEdge, 'build message built unsuccessfully');
        assert.equal(browserDetectMessage[1][3], isIE, 'build message built unsuccessfully');
        assert.equal(browserDetectMessage[1][4], isSafari, 'build message built unsuccessfully');
        assert.equal(browserDetectMessage[1][5], isOpera, 'build message built unsuccessfully');
        assert.equal(browserDetectMessage[1][6], isBlink, 'build message built unsuccessfully');
    });

    it('post condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let browserDetectContract = new BrowserDetectContract(isChrome, isFirefox, isEdge, isIE, isSafari, isOpera, isBlink);
        browserDetectContract.buildQueueMessage();
        assert.isFalse(this._logWarnStub.called, 'did  send log message while should not');
    });

    it('getName is valid', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let browserDetectContract = new BrowserDetectContract(isChrome, isFirefox, isEdge, isIE, isSafari, isOpera, isBlink);
        let gettingName = browserDetectContract.getName();
        assert.equal(gettingName,name, 'getName is not correct');
    });
    it('message is invalid', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        const browserDetectContract = new BrowserDetectContract(isChrome, isFirefox, isEdge, isIE, isSafari, isOpera, isBlink);
        sinon.stub(browserDetectContract, 'getName').returns(3);
        browserDetectContract.buildQueueMessage();

        assert.equal(this._logWarnStub.firstCall.args[0], validateMessageLog);
    });


});