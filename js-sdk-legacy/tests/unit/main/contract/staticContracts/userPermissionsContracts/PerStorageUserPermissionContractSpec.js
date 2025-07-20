import sinon from "sinon";
import PerStorageUserPermissionContract from "../../../../../../src/main/contract/staticContracts/UserPermissionsContracts/PerStorageUserPermissionContract";
import Log from "../../../../../../src/main/technicalServices/log/Logger";

describe('PerStorageUserPermissionContract test:', function () {
    let persistent = -1;
    let name = 'per_storage' ;
    let logMessage = '';
    let validateMessageLog = 'per_storage, UserPermissionContract - Contract verification failed';


    const assert = chai.assert;
    function getPreCondLogMessage (persistent){
        return  `wrong type in PerStorage , UserPermissionContract, parameters. persistent : {expected: number, received: ${ typeof persistent}}`;
    }

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
        persistent = -1;
        name = 'per_storage' ;
        logMessage = '';
    });


    it('parameters initialization', function () {
        let perStorageUserPermissionContract = new PerStorageUserPermissionContract(persistent);
        assert.equal(perStorageUserPermissionContract.persistent, -1, 'kind is not initialized correctly');
    });

    it('pre condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new PerStorageUserPermissionContract(persistent);
        assert.isFalse(this._logWarnStub.called, 'did  send log message while should not');
    });

    it('pre condition is not valid: receive string instead of number. should send log', function () {
        persistent = "hello" ;
        logMessage = getPreCondLogMessage (persistent)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new PerStorageUserPermissionContract(persistent);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });


    it('build message', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let perStorageUserPermissionContract =  new PerStorageUserPermissionContract(persistent);
        let perStoragePermissioMessage = perStorageUserPermissionContract.buildQueueMessage();

        assert.equal(perStoragePermissioMessage[0], name, 'build message built unsuccessfully');
        assert.equal(perStoragePermissioMessage[1], persistent, 'build message built unsuccessfully');
    });

    it('post condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let perStorageUserPermissionContract =  new PerStorageUserPermissionContract(persistent);
        perStorageUserPermissionContract.buildQueueMessage();
        assert.isFalse(this._logWarnStub.called, 'did  send log message while should not');
    });

    it('getName is valid', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let perStorageUserPermissionContract =  new PerStorageUserPermissionContract(persistent);
        let gettingName = perStorageUserPermissionContract.getName();
        assert.equal(gettingName,name, 'getName is not correct');
    });
    it('message is invalid', function () {
        persistent = "hello" ;
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let perStorageUserPermissionContract =  new PerStorageUserPermissionContract(persistent);
        perStorageUserPermissionContract.buildQueueMessage();
        assert.isTrue(this._logWarnStub.calledTwice, 'did not send log message while should');
        assert.equal(this._logWarnStub.secondCall.args[0], validateMessageLog);
    });


});