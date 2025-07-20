import sinon from "sinon";
import PerKindUserPermissionContract from "../../../../../../src/main/contract/staticContracts/UserPermissionsContracts/PerKindUserPermissionContract";
import Log from "../../../../../../src/main/technicalServices/log/Logger";

describe('PerKindUserPermissionContract test:', function () {
    let kind = 'kind';
    let perm = 1;
    let name = `per_${kind}`;
    let logMessage = '';
    let validateMessageLog ='PerKind, UserPermissionContract - Contract verification failed' ;


    const assert = chai.assert;
    function getPreCondLogMessage (kind, perm){
        return  `wrong type in PerKind , UserPermissionContract, parameters. kind : {expected: string, received: ${ typeof kind}}, perm : {expected: number, received: ${ typeof perm}}`;
    }

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
        kind = 'kind';
        perm = 1;
        name = `per_${kind}`
        logMessage = '';
    });


    it('parameters initialization', function () {
        let perKindUserPermissionContract = new PerKindUserPermissionContract(kind, perm);
        assert.equal(perKindUserPermissionContract.kind, 'kind', 'kind is not initialized correctly');
        assert.equal(perKindUserPermissionContract.perm, 1, 'perm is not initialized correctly');

    });

    it('pre condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new PerKindUserPermissionContract(kind, perm);
        assert.isFalse(this._logWarnStub.called, 'did  send log message while should not');
    });

    it('pre condition is not valid: receive number instead of string. should send log', function () {
        kind = 0 ;
        logMessage = getPreCondLogMessage (kind, perm)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new PerKindUserPermissionContract(kind, perm);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });

    it('pre condition is not valid: receive stirng instead of number. should send log', function () {
        perm = "hello";
        logMessage = getPreCondLogMessage (kind, perm)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new PerKindUserPermissionContract(kind, perm);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });

    it('build message', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let perKindUserPermissionContract =  new PerKindUserPermissionContract(kind, perm);
        let perKindUserPermissioMessage = perKindUserPermissionContract.buildQueueMessage();

        assert.equal(perKindUserPermissioMessage[0], name, 'build message built unsuccessfully');
        assert.equal(perKindUserPermissioMessage[1], perm, 'build message built unsuccessfully');
    });

    it('post condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let perKindUserPermissionContract =  new PerKindUserPermissionContract(kind, perm);
        perKindUserPermissionContract.buildQueueMessage();
        assert.isFalse(this._logWarnStub.called, 'did  send log message while should not');
    });

    it('getName is valid', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let perKindUserPermissionContract =  new PerKindUserPermissionContract(kind,perm);
        let gettingName = perKindUserPermissionContract.getName();
        assert.equal(gettingName,name, 'getName is not correct');
    });
    it('message is invalid', function () {
        perm = "hello";
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let perKindUserPermissionContract =  new PerKindUserPermissionContract(kind, perm);
        perKindUserPermissionContract.buildQueueMessage();
        assert.isTrue(this._logWarnStub.calledTwice, 'did not send log message while should');
        assert.equal(this._logWarnStub.secondCall.args[0], validateMessageLog);
    });


});