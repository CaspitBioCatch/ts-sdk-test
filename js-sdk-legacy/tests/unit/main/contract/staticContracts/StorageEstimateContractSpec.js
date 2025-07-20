import sinon from "sinon";
import Log from "../../../../../src/main/technicalServices/log/Logger";
import StorageEstimateContract from "../../../../../src/main/contract/staticContracts/StorageEstimateContract";
import {assert} from "chai";

describe('StorageEstimateContract test:', function () {

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    it('parameters initialization', function () {
        let storageEstimateContract = new StorageEstimateContract(10, 20);
        assert.equal(storageEstimateContract.usage, 10, 'usage is not initialized correctly');
        assert.equal(storageEstimateContract.quota, 20, 'quota is not initialized correctly');
    });

    it('pre condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new StorageEstimateContract(10, 20);
        assert.isFalse(this._logWarnStub.called, 'did send log message while should not');
    });

    it('pre condition is not valid: receive string instead of number. should send log', function () {
        const usage = '123';
        const quota = 20;
        const logMessage = `wrong type in StorageEstimate parameters. usage : {expected: number, received: ${ typeof usage}}, quota : {expected: number, received: ${ typeof quota}}`
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new StorageEstimateContract(usage, quota);
        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });

    it('buildQueueMessage returns expected message format', function () {
        let storageEstimateContract = new StorageEstimateContract(10, 20);
        let message = storageEstimateContract.buildQueueMessage();
        assert.deepEqual(message, ['storage_estimate', [10, 20]], 'buildQueueMessage did not return the expected format');
    });

    it('validateMessage with valid message should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let storageEstimateContract = new StorageEstimateContract(10, 20);
        storageEstimateContract.validateMessage(['storage_estimate', [10, 20]]);
        assert.isFalse(this._logWarnStub.called, 'did send log message while should not');
    });

    it('validateMessage with invalid message should send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let storageEstimateContract = new StorageEstimateContract(10, 20);
        storageEstimateContract.validateMessage(['storage_estimate', [10]]);
        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], 'StorageEstimate - Contract verification failed');
    });
});