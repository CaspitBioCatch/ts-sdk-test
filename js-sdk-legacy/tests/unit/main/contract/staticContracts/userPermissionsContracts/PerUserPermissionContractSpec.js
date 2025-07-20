import sinon from "sinon";
import PerUserPermissionContract from "../../../../../../src/main/contract/staticContracts/UserPermissionsContracts/PerUserPermissionContract";
import Log from "../../../../../../src/main/technicalServices/log/Logger";

describe('PerUserPermissionContract test:', function () {
    let per = 'per';
    let state = 1;
    let name = `per_${per}`;
    let logMessage = '';
    let validateMessageLog = 'per, UserPermissionContract - Contract verification failed';


    const assert = chai.assert;
    function getPreCondLogMessage (per, state){
        return  `wrong type in Per, UserPermissionContract, parameters. per : {expected: string, received: ${ typeof per}}, state : {expected: number, received: ${ typeof state}}`;
    }

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
        per = 'per';
        state = 1;
        name = `per_${per}`
        logMessage = '';
    });


    it('parameters initialization', function () {
        let perUserPermissionContract = new PerUserPermissionContract(per, state);
        assert.equal(perUserPermissionContract.per, 'per', 'per is not initialized correctly');
        assert.equal(perUserPermissionContract.state, 1, 'state is not initialized correctly');

    });

    it('pre condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new PerUserPermissionContract(per, state);
        assert.isFalse(this._logWarnStub.called, 'did  send log message while should not');
    });

    it('pre condition is not valid: receive number instead of string. should send log', function () {
        per = 0 ;
        logMessage = getPreCondLogMessage (per, state)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new PerUserPermissionContract(per, state);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });

    it('pre condition is not valid: receive stirng instead of number. should send log', function () {
        state = "hello";
        logMessage = getPreCondLogMessage (per, state)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new PerUserPermissionContract(per, state);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });

    it('build message', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let perUserPermissionContract =  new PerUserPermissionContract(per, state);
        let perKindUserPermissioMessage = perUserPermissionContract.buildQueueMessage();

        assert.equal(perKindUserPermissioMessage[0], name, 'build message built unsuccessfully');
        assert.equal(perKindUserPermissioMessage[1], state, 'build message built unsuccessfully');
    });

    it('post condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let perUserPermissionContract =  new PerUserPermissionContract(per, state);
        perUserPermissionContract.buildQueueMessage();
        assert.isFalse(this._logWarnStub.called, 'did  send log message while should not');
    });

    it('getName is valid', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let perUserPermissionContract =  new PerUserPermissionContract(per,state);
        let gettingName = perUserPermissionContract.getName();
        assert.equal(gettingName,name, 'getName is not correct');
    });
    it('message is invalid', function () {
        state = "hello";
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let perUserPermissionContract =  new PerUserPermissionContract(per, state);
        perUserPermissionContract.buildQueueMessage();
        assert.isTrue(this._logWarnStub.calledTwice, 'did not send log message while should');
        assert.equal(this._logWarnStub.secondCall.args[0], validateMessageLog);
    });


});