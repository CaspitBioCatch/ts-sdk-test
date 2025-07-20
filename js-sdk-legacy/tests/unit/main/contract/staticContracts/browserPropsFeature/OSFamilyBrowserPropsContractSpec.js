import sinon from "sinon";
import Log from "../../../../../../src/main/technicalServices/log/Logger";
import OSFamilyBrowserPropsContract from "../../../../../../src/main/contract/staticContracts/browserPropsContract/OSFamilyBrowserPropsContract";

describe('OSFamilyBrowserPropsContract test:', function () {
    let osName = 'Macintosh';
    let logMessage = '';
    let name = 'os_family';
    let validateMessageLog = 'os_family, BrowserPropsContract - Contract verification failed';


    const assert = chai.assert;
    function getPreCondLogMessage (osName){
        return` wrong type in OSFamily, BrowserProps parameters. osName : {expected: string, received: ${ typeof osName}}`;
    }

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
        osName =  'Macintosh';
        name = 'os_family';
        logMessage = '';
    });


    it('parameters initialization', function () {
        let osFamilyBrowserPropsContract = new OSFamilyBrowserPropsContract(osName);
        assert.equal(osFamilyBrowserPropsContract.osName, osName, 'osName is not initialized correctly');
    });

    it('pre condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new OSFamilyBrowserPropsContract(osName);
        assert.isFalse(this._logWarnStub.called, 'did send log message while should not');
    });

    it('pre condition is not valid: receive number instead of string. should send log', function () {
        osName = 1;
        logMessage = getPreCondLogMessage (osName)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new OSFamilyBrowserPropsContract(osName);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });


    it('build message', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let osFamilyBrowserPropsContract =  new OSFamilyBrowserPropsContract(osName);
        let langBrowsingMessage = osFamilyBrowserPropsContract.buildQueueMessage();

        assert.equal(langBrowsingMessage[0], name, 'build message built unsuccessfully');
        assert.equal(langBrowsingMessage[1], osName, 'build message built unsuccessfully');
    });

    it('post condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let osFamilyBrowserPropsContract =  new OSFamilyBrowserPropsContract(osName);
        osFamilyBrowserPropsContract.buildQueueMessage();
        assert.isFalse(this._logWarnStub.called, 'did  send log message while should not');
    });

    it('getName is valid', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let osFamilyBrowserPropsContract =  new OSFamilyBrowserPropsContract(osName);
        let gettingName = osFamilyBrowserPropsContract.getName();
        assert.equal(gettingName,name, 'getName is not correct');
    });

    it('message is invalid', function () {
        osName = 1;
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let osFamilyBrowserPropsContract =  new OSFamilyBrowserPropsContract(osName);
        osFamilyBrowserPropsContract.buildQueueMessage();

        assert.isTrue(this._logWarnStub.calledTwice, 'did not send log message while should');
        assert.equal(this._logWarnStub.secondCall.args[0], validateMessageLog);
    });


});