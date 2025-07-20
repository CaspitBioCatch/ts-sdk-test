import sinon from 'sinon';
import BuildIDBrowserPropsContract from '../../../../../../src/main/contract/staticContracts/browserPropsContract/BuildIDBrowserPropsContract';
import Log from '../../../../../../src/main/technicalServices/log/Logger';

describe('BuildIDBrowserPropsContract tests:', function () {
    const assert = chai.assert;
    const buildID = '20220302163500';
    const featureName = 'navigator_build_id';

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    it('parameters initialization', function () {
        let buildIDBrowserPropsContract = new BuildIDBrowserPropsContract(buildID);
        assert.equal(buildIDBrowserPropsContract.buildID, '20220302163500', 'buildID is not initialized correctly');
    });

    it('pre condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new BuildIDBrowserPropsContract(buildID);
        assert.isFalse(this._logWarnStub.called, 'did send log message while should not');
    });

    it('pre condition is not valid: receive number instead of string. should send log', function () {
        const wrongBuildID = 123;
        const logMessage = `The buildID is either undefined or of a wrong type. Expected string, received: ${typeof wrongBuildID}`
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new BuildIDBrowserPropsContract(wrongBuildID);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });

    it('build message', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let buildIDBrowserPropsContract =  new BuildIDBrowserPropsContract(buildID);
        let buildIDBrowserMessage = buildIDBrowserPropsContract.buildQueueMessage();

        assert.equal(buildIDBrowserMessage[0], featureName, 'message was not built');
        assert.equal(buildIDBrowserMessage[1], buildID, 'message was not built');
    });

    it('post condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let buildIDBrowserPropsContract =  new BuildIDBrowserPropsContract(buildID);
        buildIDBrowserPropsContract.buildQueueMessage();
        assert.isFalse(this._logWarnStub.called, 'log message was sent when it should not');
    });

    it('getName is valid', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let buildIDBrowserPropsContract =  new BuildIDBrowserPropsContract(buildID);
        let retrievedName = buildIDBrowserPropsContract.getName();
        assert.equal(retrievedName, featureName, `getName returned unexpected value: ${retrievedName}`);
    });

    it('message is invalid', function () {
        const wrongBuildID = 123
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let buildIDBrowserPropsContract =  new BuildIDBrowserPropsContract(wrongBuildID);
        buildIDBrowserPropsContract.buildQueueMessage();

        assert.isTrue(this._logWarnStub.calledTwice, 'log message was sent when it should not');
        assert.equal(this._logWarnStub.secondCall.args[0], `${featureName}, BrowserPropsContract - Contract verification failed`);
    });
});
