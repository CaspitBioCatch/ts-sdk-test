import sinon from "sinon";
import Log from "../../../../../../src/main/technicalServices/log/Logger";
import TimeZoneBrowserPropsContract from "../../../../../../src/main/contract/staticContracts/browserPropsContract/TimeZoneBrowserPropsContract";

describe('TimeZoneBrowserPropsContract test:', function () {
    let tz = 180;
    let logMessage = '';
    let name = 'time_zone';
    let validateMessageLog = 'time_zone, BrowserPropsContract - Contract verification failed';


    const assert = chai.assert;
    function getPreCondLogMessage (tz){
        return `wrong type in TimeZone, BrowserProps parameters. tz : {expected: string, received: ${ typeof tz}}`;
    }

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
        tz = 180;
        name = 'time_zone';
        logMessage = '';
    });


    it('parameters initialization', function () {
        let timeZoneBrowserPropsContract = new TimeZoneBrowserPropsContract(tz);
        assert.equal(timeZoneBrowserPropsContract.tz, tz, 'version is not initialized correctly');
    });

    it('pre condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new TimeZoneBrowserPropsContract(tz);
        assert.isFalse(this._logWarnStub.called, 'did send log message while should not');
    });

    it('pre condition is not valid: receive string instead of number  . should send log', function () {
        tz = "hello";
        logMessage = getPreCondLogMessage (tz)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new TimeZoneBrowserPropsContract(tz);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });


    it('build message', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let timeZoneBrowserPropsContract =  new TimeZoneBrowserPropsContract(tz);
        let timeZoneBrowsingMessage = timeZoneBrowserPropsContract.buildQueueMessage();

        assert.equal(timeZoneBrowsingMessage[0], name, 'build message built unsuccessfully');
        assert.equal(timeZoneBrowsingMessage[1], tz, 'build message built unsuccessfully');
    });

    it('post condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let timeZoneBrowserPropsContract =  new TimeZoneBrowserPropsContract(tz);
        timeZoneBrowserPropsContract.buildQueueMessage();
        assert.isFalse(this._logWarnStub.called, 'did  send log message while should not');
    });

    it('getName is valid', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let timeZoneBrowserPropsContract =  new TimeZoneBrowserPropsContract(tz);
        let gettingName = timeZoneBrowserPropsContract.getName();
        assert.equal(gettingName,name, 'getName is not correct');
    });

    it('message is invalid', function () {
        tz = "hello";
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let timeZoneBrowserPropsContract =  new TimeZoneBrowserPropsContract(tz);
        timeZoneBrowserPropsContract.buildQueueMessage();

        assert.isTrue(this._logWarnStub.calledTwice, 'did not send log message while should');
        assert.equal(this._logWarnStub.secondCall.args[0], validateMessageLog);
    });



});