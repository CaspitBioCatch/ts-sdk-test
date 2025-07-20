import sinon from 'sinon';
import MaxTouchPointsBrowserPropsContract from '../../../../../../src/main/contract/staticContracts/browserPropsContract/MaxTouchPointsBrowserPropsContract';
import Log from '../../../../../../src/main/technicalServices/log/Logger';

describe('MaxTouchPointsBrowserPropsContract tests:', function () {
    const assert = chai.assert;
    const featureName = 'navigator_max_touch_points';
    const maxTouchPoints = 5;

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    it('parameters initialization', function () {
        let maxTouchPointsBrowserPropsContract = new MaxTouchPointsBrowserPropsContract(maxTouchPoints);
        assert.equal(maxTouchPointsBrowserPropsContract.maxTouchPoints, 5, 'Max Touch Points is not initialized correctly');
    });

    it('pre condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new MaxTouchPointsBrowserPropsContract(maxTouchPoints);
        assert.isFalse(this._logWarnStub.called, 'did send log message while should not');
    });

    it('pre condition is not valid: receive string instead of number. should send log', function () {
        const wrongMaxTouchPoints = '123';
        const logMessage = `wrong type in MaxTouchPointsContract parameters. Expected: number, received: ${typeof wrongMaxTouchPoints}`
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new MaxTouchPointsBrowserPropsContract(wrongMaxTouchPoints);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });

    it('build message', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let maxTouchPointsBrowserPropsContract =  new MaxTouchPointsBrowserPropsContract(maxTouchPoints);
        let maxTouchPointsBrowserMessage = maxTouchPointsBrowserPropsContract.buildQueueMessage();

        assert.equal(maxTouchPointsBrowserMessage[0], featureName, 'message was not built');
        assert.equal(maxTouchPointsBrowserMessage[1], maxTouchPoints, 'message was not built');
    });

    it('post condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let maxTouchPointsBrowserPropsContract =  new MaxTouchPointsBrowserPropsContract(maxTouchPoints);
        maxTouchPointsBrowserPropsContract.buildQueueMessage();
        assert.isFalse(this._logWarnStub.called, 'log message was sent when it should not');
    });

    it('getName is valid', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let maxTouchPointsBrowserPropsContract =  new MaxTouchPointsBrowserPropsContract(maxTouchPoints);
        let retrievedName = maxTouchPointsBrowserPropsContract.getName();
        assert.equal(retrievedName, featureName, `getName returned unexpected value: ${retrievedName}`);
    });

    it('message is invalid', function () {
        const wrongBuildID = '123'
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let maxTouchPointsBrowserPropsContract =  new MaxTouchPointsBrowserPropsContract(wrongBuildID);
        maxTouchPointsBrowserPropsContract.buildQueueMessage();

        assert.isTrue(this._logWarnStub.calledTwice, 'log message was sent when it should not');
        assert.equal(this._logWarnStub.secondCall.args[0], `${featureName}, BrowserPropsContract - Contract verification failed`);
    });
});
