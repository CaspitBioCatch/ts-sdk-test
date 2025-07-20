import sinon from "sinon";
import Log from "../../../../../../src/main/technicalServices/log/Logger";
import DeviceMemoryBrowserPropsContract from "../../../../../../src/main/contract/staticContracts/browserPropsContract/DeviceMemoryBrowserPropsContract";

describe('DeviceMemoryBrowserPropsContract test:', function () {
    let memory = 2;
    let logMessage = '';
    let name = 'device_memory';
     let validateMessageLog = 'device_memory, BrowserPropsContract - Contract verification failed';


    const assert = chai.assert;
    function getPreCondLogMessage (memory){
        return  `wrong type in DeviceMemoryBrowser, BrowserProps parameters. memory : {expected: number in {0.25, 0.5, 1, 2, 4, 8, 0} received: type:${ typeof memory} value:${memory}}`;
    }

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
        memory = 2;
        name = 'device_memory';
        logMessage = '';
    });


    it('parameters initialization', function () {
        let deviceMemoryBrowserPropsContract = new DeviceMemoryBrowserPropsContract(memory);
        assert.equal(deviceMemoryBrowserPropsContract.memory, 2, 'memory is not initialized correctly');
    });

    it('pre condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new DeviceMemoryBrowserPropsContract(memory);
        assert.isFalse(this._logWarnStub.called, 'did send log message while should not');
    });

    it('pre condition is not valid: receive string instead of number. should send log', function () {
        memory ='hello'
        logMessage = getPreCondLogMessage (memory)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new DeviceMemoryBrowserPropsContract(memory);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });

    it('pre condition is not valid: receive boolean instead of number. should send log', function () {
        memory = true;
        logMessage = getPreCondLogMessage (memory)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new DeviceMemoryBrowserPropsContract(memory);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });

    it('pre condition is not valid: number is not part of allowed set. should send log', function () {
        memory = 7;
        logMessage = getPreCondLogMessage (memory)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new DeviceMemoryBrowserPropsContract(memory);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });

    it('build message', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let deviceMemoryBrowserPropsContract =  new DeviceMemoryBrowserPropsContract(memory);
        let deviceMemorrBrowsingMessage = deviceMemoryBrowserPropsContract.buildQueueMessage();

        assert.equal(deviceMemorrBrowsingMessage[0], name, 'build message built unsuccessfully');
        assert.equal(deviceMemorrBrowsingMessage[1], memory, 'build message built unsuccessfully');
    });

    it('post condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let deviceMemoryBrowserPropsContract =  new DeviceMemoryBrowserPropsContract(memory);
        deviceMemoryBrowserPropsContract.buildQueueMessage();
        assert.isFalse(this._logWarnStub.called, 'did  send log message while should not');
    });

    it('getName is valid', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let deviceMemoryBrowserPropsContract =  new DeviceMemoryBrowserPropsContract(memory);
        let gettingName = deviceMemoryBrowserPropsContract.getName();
        assert.equal(gettingName,name, 'getName is not correct');
    });

    it('message is invalid', function () {
        memory = true;
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let deviceMemoryBrowserPropsContract =  new DeviceMemoryBrowserPropsContract(memory);
        deviceMemoryBrowserPropsContract.buildQueueMessage();

        assert.isTrue(this._logWarnStub.calledTwice, 'did not send log message while should');
        assert.equal(this._logWarnStub.secondCall.args[0], validateMessageLog);
    });


});
