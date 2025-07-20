import sinon from "sinon";
import Log from "../../../../../../src/main/technicalServices/log/Logger";
import CoresBrowserPropsContract from "../../../../../../src/main/contract/staticContracts/browserPropsContract/CoresBrowserPropsContract";

describe('CoresBrowserPropsContract test:', function () {
    let hardwareConcurrency = 12;
    let logMessage = '';
    let name = 'cores';
    let validateMessageLog = 'cores,BrowserPropsContract - Contract verification failed';


    const assert = chai.assert;
    function getPreCondLogMessage (hardwareConcurrency){
        return `wrong type in cores, BrowserProps parameters. hardwareConcurrency : {expected: number, received: ${ typeof hardwareConcurrency}}`;
    }

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
        hardwareConcurrency = 12;
        name = 'cores';
        logMessage = '';
    });


    it('parameters initialization', function () {
        let coresBrowserPropsContract = new CoresBrowserPropsContract(hardwareConcurrency);
        assert.equal(coresBrowserPropsContract.hardwareConcurrency, 12, 'hardwareConcurrency is not initialized correctly');
    });

    it('pre condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new CoresBrowserPropsContract(hardwareConcurrency);
        assert.isFalse(this._logWarnStub.called, 'did send log message while should not');
    });

    it('pre condition is not valid: receive string instead of boolean. should send log', function () {
        hardwareConcurrency ='hello'
        logMessage = getPreCondLogMessage (hardwareConcurrency)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new CoresBrowserPropsContract(hardwareConcurrency);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });

    it('pre condition is not valid: receive boolean instead of number. should send log', function () {
        hardwareConcurrency = true;
        logMessage = getPreCondLogMessage (hardwareConcurrency)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new CoresBrowserPropsContract(hardwareConcurrency);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });

    it('build message', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let coresBrowserPropsContract =  new CoresBrowserPropsContract(hardwareConcurrency);
        let coresBrowserBrowsingMessage = coresBrowserPropsContract.buildQueueMessage();

        assert.equal(coresBrowserBrowsingMessage[0], name, 'build message built unsuccessfully');
        assert.equal(coresBrowserBrowsingMessage[1], hardwareConcurrency, 'build message built unsuccessfully');
    });

    it('post condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let coresBrowserPropsContract =  new CoresBrowserPropsContract(hardwareConcurrency);
        coresBrowserPropsContract.buildQueueMessage();
        assert.isFalse(this._logWarnStub.called, 'did  send log message while should not');
    });

    it('getName is valid', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let coresBrowserPropsContract =  new CoresBrowserPropsContract(hardwareConcurrency);
        let gettingName = coresBrowserPropsContract.getName();
        assert.equal(gettingName,name, 'getName is not correct');
    });

    it('message is invalid', function () {
        hardwareConcurrency = true;
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let coresBrowserPropsContract =  new CoresBrowserPropsContract(hardwareConcurrency);
        coresBrowserPropsContract.buildQueueMessage();

        assert.isTrue(this._logWarnStub.calledTwice, 'did not send log message while should');
        assert.equal(this._logWarnStub.secondCall.args[0], validateMessageLog);
    });


});