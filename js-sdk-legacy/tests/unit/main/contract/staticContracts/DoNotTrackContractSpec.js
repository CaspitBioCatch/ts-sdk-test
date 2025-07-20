import Log from "../../../../../src/main/technicalServices/log/Logger";
import sinon from "sinon";
import DoNotTrackContract from "../../../../../src/main/contract/staticContracts/DoNotTrackContract";

describe('DoNotTrackContract test:', function () {
    let dnt = 0;
    let logMessage = '';
    let name = 'dnt';
    let validateMessageLog ='DoNotTrack - Contract verification failed' ;


    const assert = chai.assert;
    function getPreCondLogMessage (dnt){
        return `wrong type in DoNotTrackContract parameters. dnt : {expected: number in {0,1,2}, received: type: ${typeof dnt}, value: ${dnt}`;
    }

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
        dnt = 0;
        logMessage = '';
    });


    it('parameters initialization', function () {
        let doNotTrackContract = new DoNotTrackContract(dnt);
        assert.equal(doNotTrackContract.dnt, 0, 'dnt is not initialized correctly');
    });

    it('pre condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new DoNotTrackContract(dnt);
        assert.isFalse(this._logWarnStub.called, 'did  send log message while should not');
    });

    it('pre condition is not valid: receive string instead of number. should send log', function () {
        dnt ='hello'
        logMessage = getPreCondLogMessage (dnt)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new DoNotTrackContract(dnt);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });

    it('pre condition is not valid: receive number out of range. should send log', function () {
        dnt = 6;
        logMessage = getPreCondLogMessage (dnt)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new DoNotTrackContract(dnt);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });

    it('build message', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let doNotTrackContract =  new DoNotTrackContract(dnt);
        let doNotTrackMessage = doNotTrackContract.buildQueueMessage();

        assert.equal(doNotTrackMessage[0], name, 'build message built unsuccessfully');
        assert.equal(doNotTrackMessage[1], dnt, 'build message built unsuccessfully');
    });

    it('post condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let doNotTrackContract =  new DoNotTrackContract(dnt);
        doNotTrackContract.buildQueueMessage();
        assert.isFalse(this._logWarnStub.called, 'did  send log message while should not');
    });

    it('getName is valid', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let doNotTrackContract =  new DoNotTrackContract(dnt);
        let gettingName = doNotTrackContract.getName();
        assert.equal(gettingName,name, 'getName is not correct');
    });
    it('message is invalid', function () {
        dnt ='hello'
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let doNotTrackContract =  new DoNotTrackContract(dnt);
        doNotTrackContract.buildQueueMessage();

        assert.isTrue(this._logWarnStub.calledTwice, 'did not send log message while should');
        assert.equal(this._logWarnStub.secondCall.args[0], validateMessageLog);
    });


});