import sinon from "sinon";
import Log from "../../../../../src/main/technicalServices/log/Logger";
import StorageDirectoryContract from "../../../../../src/main/contract/staticContracts/StorageDirectoryContract";
import {assert} from "chai";

describe('StorageDirectoryContract test:', function () {

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    it('parameters initialization', function () {
        let storageDirectoryContract = new StorageDirectoryContract("root");
        assert.equal(storageDirectoryContract.directoryName, "root", 'directoryName is not initialized correctly');
    });

    it('pre condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new StorageDirectoryContract("root");
        assert.isFalse(this._logWarnStub.called, 'did send log message while should not');
    });

    it('pre condition is not valid: receive number instead of string. should send log', function () {
        const directoryName = 123;
        const logMessage = `wrong type in StorageDirectory parameters. directoryName : {expected: string, received: ${ typeof directoryName}}`
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new StorageDirectoryContract(directoryName);
        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });

    it('buildQueueMessage returns expected message format', function () {
        let storageDirectoryContract = new StorageDirectoryContract("root");
        let message = storageDirectoryContract.buildQueueMessage();
        assert.deepEqual(message, ['storage_directory', "root"], 'buildQueueMessage did not return the expected format');
    });

    it('validateMessage with valid message should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let storageDirectoryContract = new StorageDirectoryContract("root");
        storageDirectoryContract.validateMessage(['storage_directory', "root"]);
        assert.isFalse(this._logWarnStub.called, 'did send log message while should not');
    });

    it('validateMessage with invalid message should send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let storageDirectoryContract = new StorageDirectoryContract("root");
        storageDirectoryContract.validateMessage(['storage_directory', 123]);
        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], 'StorageDirectory - Contract verification failed');
    });
});