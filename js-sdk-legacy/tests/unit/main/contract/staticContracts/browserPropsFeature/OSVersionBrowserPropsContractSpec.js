import sinon from "sinon";
import Log from "../../../../../../src/main/technicalServices/log/Logger";
import OSVersionBrowserPropsContract from "../../../../../../src/main/contract/staticContracts/browserPropsContract/OSVersionBrowserPropsContract";

describe('OSVersionBrowserPropsContract test:', function () {
    let version = 10.157;
    let logMessage = '';
    let name = 'os_version';
    let validateMessageLog = 'os_version, BrowserPropsContract - Contract verification failed';


    const assert = chai.assert;
    function getPreCondLogMessage (version){
        return` wrong type in OSVersion, BrowserProps parameters. version : {expected: number, received: ${ typeof version}}`;
    }

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
        version = 10.157;
        name = 'os_version';
        logMessage = '';
    });


    it('parameters initialization', function () {
        let osVersionBrowserPropsContract = new OSVersionBrowserPropsContract(version);
        assert.equal(osVersionBrowserPropsContract.version, version, 'version is not initialized correctly');
    });

    it('pre condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new OSVersionBrowserPropsContract(version);
        assert.isFalse(this._logWarnStub.called, 'did send log message while should not');
    });
    it('pre condition is valid, version is null', function () {
        version = null;
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new OSVersionBrowserPropsContract(version);
        assert.isFalse(this._logWarnStub.called, 'did send log message while should not');
    });

    it('pre condition is not valid: receive string instead of number . should send log', function () {
        version = '1';
        logMessage = getPreCondLogMessage (version)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new OSVersionBrowserPropsContract(version);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });


    it('build message', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let osVersionBrowserPropsContract =  new OSVersionBrowserPropsContract(version);
        let osVersionBrowsingMessage = osVersionBrowserPropsContract.buildQueueMessage();

        assert.equal(osVersionBrowsingMessage[0], name, 'build message built unsuccessfully');
        assert.equal(osVersionBrowsingMessage[1], version, 'build message built unsuccessfully');
    });

    it('post condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let osVersionBrowserPropsContract =  new OSVersionBrowserPropsContract(version);
        osVersionBrowserPropsContract.buildQueueMessage();
        assert.isFalse(this._logWarnStub.called, 'did  send log message while should not');
    });

    it('getName is valid', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let osVersionBrowserPropsContract =  new OSVersionBrowserPropsContract(version);
        let gettingName = osVersionBrowserPropsContract.getName();
        assert.equal(gettingName,name, 'getName is not correct');
    });

    it('message is invalid', function () {
        version = '1';
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let osVersionBrowserPropsContract =  new OSVersionBrowserPropsContract(version);
        osVersionBrowserPropsContract.buildQueueMessage();

        assert.isTrue(this._logWarnStub.calledTwice, 'did not send log message while should');
        assert.equal(this._logWarnStub.secondCall.args[0], validateMessageLog);
    });


});