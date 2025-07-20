import sinon from "sinon";
import Log from "../../../../../../src/main/technicalServices/log/Logger";
import DeviceSourceBrowserPropsContract from "../../../../../../src/main/contract/staticContracts/browserPropsContract/DeviceSourceBrowserPropsContract";

describe('DeviceSourceBrowserPropsContract test:', function () {
    let source = 'js';
    let logMessage = '';
    let name = 'device_source';
    let validateMessageLog = 'device_source, BrowserPropsContract - Contract verification failed';


    const assert = chai.assert;
    function getPreCondLogMessage (source){
        return` wrong type in DeviceSource, BrowserProps parameters. source : {expected: string, received: ${ typeof source}}`;
    }

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
        source = 'js';
        name = 'device_source';
        logMessage = '';
    });


    it('parameters initialization', function () {
        let deviceSourceBrowserPropsContract = new DeviceSourceBrowserPropsContract(source);
        assert.equal(deviceSourceBrowserPropsContract.source, 'js', 'source is not initialized correctly');
    });

    it('pre condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new DeviceSourceBrowserPropsContract(source);
        assert.isFalse(this._logWarnStub.called, 'did send log message while should not');
    });

    it('pre condition is not valid: receive boolean  instead of string. should send log', function () {
        source = true;
        logMessage = getPreCondLogMessage (source)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new DeviceSourceBrowserPropsContract(source);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });


    it('build message', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let deviceSourceBrowserPropsContract =  new DeviceSourceBrowserPropsContract(source);
        let deviceSourceBrowsingMessage = deviceSourceBrowserPropsContract.buildQueueMessage();

        assert.equal(deviceSourceBrowsingMessage[0], name, 'build message built unsuccessfully');
        assert.equal(deviceSourceBrowsingMessage[1], source, 'build message built unsuccessfully');
    });

    it('post condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let deviceSourceBrowserPropsContract =  new DeviceSourceBrowserPropsContract(source);
        deviceSourceBrowserPropsContract.buildQueueMessage();
        assert.isFalse(this._logWarnStub.called, 'did  send log message while should not');
    });

    it('getName is valid', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let deviceSourceBrowserPropsContract =  new DeviceSourceBrowserPropsContract(source);
        let gettingName = deviceSourceBrowserPropsContract.getName();
        assert.equal(gettingName,name, 'getName is not correct');
    });

    it('message is invalid', function () {
        source = true;
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let deviceSourceBrowserPropsContract =  new DeviceSourceBrowserPropsContract(source);
        deviceSourceBrowserPropsContract.buildQueueMessage();

        assert.isTrue(this._logWarnStub.calledTwice, 'did not send log message while should');
        assert.equal(this._logWarnStub.secondCall.args[0], validateMessageLog);
    });

});