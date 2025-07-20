import sinon from "sinon";
import Log from "../../../../../../src/main/technicalServices/log/Logger";
import VersionClientBrowserPropsContract from "../../../../../../src/main/contract/staticContracts/browserPropsContract/VersionClientBrowserPropsContract";

describe('VersionClientBrowserPropsContract test:', function () {
    let scriptVersion = 'dev-version.0.18c28ea0';
    let logMessage = '';
    let name = 'version_client';
    let validateMessageLog = 'version_client, BrowserPropsContract - Contract verification failed';


    const assert = chai.assert;
    function getPreCondLogMessage (scriptVersion){
        return` wrong type in VersionClient, BrowserProps parameters. scriptVersion : {expected: string, received: ${ typeof scriptVersion}}`;
    }

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
        scriptVersion = 'dev-version.0.18c28ea0';
        name = 'version_client';
        logMessage = '';
    });


    it('parameters initialization', function () {
        let versionClientBrowserPropsContract = new VersionClientBrowserPropsContract(scriptVersion);
        assert.equal(versionClientBrowserPropsContract.scriptVersion, scriptVersion, 'version is not initialized correctly');
    });

    it('pre condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new VersionClientBrowserPropsContract(scriptVersion);
        assert.isFalse(this._logWarnStub.called, 'did send log message while should not');
    });

    it('pre condition is not valid: receive number instead of  string. should send log', function () {
        scriptVersion = 1;
        logMessage = getPreCondLogMessage (scriptVersion)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new VersionClientBrowserPropsContract(scriptVersion);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });


    it('build message', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let versionClientBrowserPropsContract =  new VersionClientBrowserPropsContract(scriptVersion);
        let osVersionBrowsingMessage = versionClientBrowserPropsContract.buildQueueMessage();

        assert.equal(osVersionBrowsingMessage[0], name, 'build message built unsuccessfully');
        assert.equal(osVersionBrowsingMessage[1], scriptVersion, 'build message built unsuccessfully');
    });

    it('post condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let versionClientBrowserPropsContract =  new VersionClientBrowserPropsContract(scriptVersion);
        versionClientBrowserPropsContract.buildQueueMessage();
        assert.isFalse(this._logWarnStub.called, 'did  send log message while should not');
    });

    it('getName is valid', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let versionClientBrowserPropsContract =  new VersionClientBrowserPropsContract(scriptVersion);
        let gettingName = versionClientBrowserPropsContract.getName();
        assert.equal(gettingName,name, 'getName is not correct');
    });
    it('message is invalid', function () {
        scriptVersion = 1;
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let versionClientBrowserPropsContract =  new VersionClientBrowserPropsContract(scriptVersion);
        versionClientBrowserPropsContract.buildQueueMessage();
        assert.isTrue(this._logWarnStub.calledTwice, 'did not send log message while should');
        assert.equal(this._logWarnStub.secondCall.args[0], validateMessageLog);
    });


});