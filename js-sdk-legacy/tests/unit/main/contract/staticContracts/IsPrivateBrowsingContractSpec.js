import Log from "../../../../../src/main/technicalServices/log/Logger";
import sinon from "sinon";
import IsPrivateBrowsingContract from "../../../../../src/main/contract/staticContracts/IsPrivateBrowsingContract";

describe('IsPrivateBrowsingContract test:', function () {
    let isPrivate = true;
    let logMessage = '';
    let name = 'is_private_browsing';
    let validateMessageLog = 'IsPrivateBrowsing - Contract verification failed';


    const assert = chai.assert;
    function getPreCondLogMessage (isPrivate){
        return `wrong type in IsPrivateBrowsingContract parameters. isPrivate : {expected: boolean, received: ${ typeof isPrivate}}`;
    }

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
        isPrivate = true;
        logMessage = '';
    });


    it('parameters initialization', function () {
        let isPrivateBrowsingContract = new IsPrivateBrowsingContract(isPrivate);
        assert.equal(isPrivateBrowsingContract.isPrivate, true, 'isPrivate is not initialized correctly');
    });

    it('pre condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new IsPrivateBrowsingContract(isPrivate);
        assert.isFalse(this._logWarnStub.called, 'did  send log message while should not');
    });

    it('pre condition is not valid: receive string instead of boolean. should send log', function () {
        isPrivate ='hello'
        logMessage = getPreCondLogMessage (isPrivate)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new IsPrivateBrowsingContract(isPrivate);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });

    it('pre condition is not valid: receive number instead of boolean. should send log', function () {
        isPrivate = 6;
        logMessage = getPreCondLogMessage (isPrivate)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new IsPrivateBrowsingContract(isPrivate);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });

    it('build message', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let isPrivateBrowsingContract =  new IsPrivateBrowsingContract(isPrivate);
        let isPrivateBrowsingMessage = isPrivateBrowsingContract.buildQueueMessage();

        assert.equal(isPrivateBrowsingMessage[0], name, 'build message built unsuccessfully');
        assert.equal(isPrivateBrowsingMessage[1], isPrivate, 'build message built unsuccessfully');
    });

    it('post condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let isPrivateBrowsingContract =  new IsPrivateBrowsingContract(isPrivate);
        isPrivateBrowsingContract.buildQueueMessage();
        assert.isFalse(this._logWarnStub.called, 'did  send log message while should not');
    });

    it('getName is valid', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let isPrivateBrowsingContract =  new IsPrivateBrowsingContract(isPrivate);
        let gettingName = isPrivateBrowsingContract.getName();
        assert.equal(gettingName,name, 'getName is not correct');
    });
    it('message is invalid', function () {
        isPrivate = 6;
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let isPrivateBrowsingContract = new IsPrivateBrowsingContract(isPrivate);
        isPrivateBrowsingContract.buildQueueMessage();

        assert.isTrue(this._logWarnStub.calledTwice, 'did not send log message while should');
        assert.equal(this._logWarnStub.secondCall.args[0], validateMessageLog);
    });

});