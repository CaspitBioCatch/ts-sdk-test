import sinon from "sinon";
import Log from "../../../../../../src/main/technicalServices/log/Logger";
import OSBrowserPropsContract from "../../../../../../src/main/contract/staticContracts/browserPropsContract/OSBrowserPropsContract";

describe('OSBrowserPropsContract test:', function () {
    let platform = 'MacIntel';
    let logMessage = '';
    let name = 'os';
    let validateMessageLog = 'os, BrowserPropsContract - Contract verification failed';


    const assert = chai.assert;
    function getPreCondLogMessage (platform){
        return` wrong type in OS, BrowserProps parameters. platform : {expected: string, received: ${ typeof platform}}`;
    }

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
        platform =  'MacIntel';
        name = 'os';
        logMessage = '';
    });


    it('parameters initialization', function () {
        let langBrowserPropsContract = new OSBrowserPropsContract(platform);
        assert.equal(langBrowserPropsContract.platform, platform, 'platform is not initialized correctly');
    });

    it('pre condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new OSBrowserPropsContract(platform);
        assert.isFalse(this._logWarnStub.called, 'did send log message while should not');
    });

    it('pre condition is not valid: receive number instead of string. should send log', function () {
        platform = 1;
        logMessage = getPreCondLogMessage (platform)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new OSBrowserPropsContract(platform);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });


    it('build message', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let osBrowserPropsContract =  new OSBrowserPropsContract(platform);
        let OSBrowsingMessage = osBrowserPropsContract.buildQueueMessage();

        assert.equal(OSBrowsingMessage[0], name, 'build message built unsuccessfully');
        assert.equal(OSBrowsingMessage[1], platform, 'build message built unsuccessfully');
    });

    it('post condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let osBrowserPropsContract =  new OSBrowserPropsContract(platform);
        osBrowserPropsContract.buildQueueMessage();
        assert.isFalse(this._logWarnStub.called, 'did  send log message while should not');
    });

    it('getName is valid', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let OSgBrowserPropsContract =  new OSBrowserPropsContract(platform);
        let gettingName = OSgBrowserPropsContract.getName();
        assert.equal(gettingName,name, 'getName is not correct');
    });
    it('message is invalid', function () {
        platform = 1;
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let osBrowserPropsContract =  new OSBrowserPropsContract(platform);
        osBrowserPropsContract.buildQueueMessage();

        assert.isTrue(this._logWarnStub.calledTwice, 'did not send log message while should');
        assert.equal(this._logWarnStub.secondCall.args[0], validateMessageLog);
    });

    it('build message with deprecated api', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let osBrowserPropsContract =  new OSBrowserPropsContract(navigator.platform);
        let OSBrowsingMessage = osBrowserPropsContract.buildQueueMessage();

        assert.equal(OSBrowsingMessage[0], name, 'build message built unsuccessfully');
        assert.isDefined(OSBrowsingMessage[1], 'build message built unsuccessfully');
    });

    it('build message with new api', function () {
            if ('userAgentData' in window.navigator){
                this._logWarnStub = this.sandbox.spy(Log, 'warn');
                let osBrowserPropsContract =  new OSBrowserPropsContract(navigator.userAgentData.platform);
                let OSBrowsingMessage = osBrowserPropsContract.buildQueueMessage();

                assert.equal(OSBrowsingMessage[0], name, 'build message built unsuccessfully');
                assert.isDefined(OSBrowsingMessage[1], 'build message built unsuccessfully');
            }
        else{
            this.skip();
        }
    });
});
