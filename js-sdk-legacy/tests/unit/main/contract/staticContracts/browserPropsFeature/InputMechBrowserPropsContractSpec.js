import sinon from "sinon";
import Log from "../../../../../../src/main/technicalServices/log/Logger";
import InputMechBrowserPropsContract from "../../../../../../src/main/contract/staticContracts/browserPropsContract/InputMechBrowserPropsContract";

describe('InputMechBrowserPropsContract test:', function () {
    let pointer = 1;
    let hover = 2;
    let logMessage = '';
    let name = 'input_mech';
    const validateMessageLog = 'input_mech, BrowserPropsContract - Contract verification failed';


    const assert = chai.assert;
    function getPreCondLogMessage (pointer, hover){
        return` wrong type in InputMech, BrowserProps parameters. pointer : {expected: number, received: ${ typeof pointer}}, hover : {expected: number, received: ${ typeof hover}}`;
    }

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
        pointer = 1;
        hover = 2;
        name = 'input_mech';
        logMessage = '';
    });


    it('parameters initialization', function () {
        let inputMechBrowserPropsContract = new InputMechBrowserPropsContract(pointer, hover);
        assert.equal(inputMechBrowserPropsContract.pointer, pointer, 'source is not initialized correctly');
        assert.equal(inputMechBrowserPropsContract.hover, hover, 'source is not initialized correctly');

    });

    it('pre condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new InputMechBrowserPropsContract(pointer, hover);
        assert.isFalse(this._logWarnStub.called, 'did send log message while should not');
    });

    it('pre condition is not valid: receive boolean  instead of number. should send log', function () {
        pointer = true;
        logMessage = getPreCondLogMessage (pointer, hover)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new InputMechBrowserPropsContract(pointer, hover);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });

    it('pre condition is not valid: pointer number is put of valid number set. should send log', function () {
        pointer = 6;
        logMessage = getPreCondLogMessage (pointer, hover)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new InputMechBrowserPropsContract(pointer, hover);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });

    it('pre condition is not valid: hover number is put of valid number set. should send log', function () {
        hover = 6;
        logMessage = getPreCondLogMessage (pointer, hover)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new InputMechBrowserPropsContract(pointer, hover);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });

    it('pre condition is not valid: receive string  instead of number. should send log', function () {
        hover = 'hello';
        logMessage = getPreCondLogMessage (pointer, hover)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new InputMechBrowserPropsContract(pointer, hover);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });


    it('build message', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let inputMechBrowserPropsContract =  new InputMechBrowserPropsContract(pointer, hover);
        let inputBrowsingMessage = inputMechBrowserPropsContract.buildQueueMessage();

        assert.equal(inputBrowsingMessage[0], name, 'build message built unsuccessfully');
        assert.equal(inputBrowsingMessage[1][0], pointer, 'build message built unsuccessfully');
        assert.equal(inputBrowsingMessage[1][1], hover, 'build message built unsuccessfully');

    });

    it('post condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let inputMechBrowserPropsContract =  new InputMechBrowserPropsContract(pointer, hover);
        inputMechBrowserPropsContract.buildQueueMessage();
        assert.isFalse(this._logWarnStub.called, 'did  send log message while should not');
    });

    it('getName is valid', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let inputMechBrowserPropsContract =  new InputMechBrowserPropsContract(pointer, hover);
        let gettingName = inputMechBrowserPropsContract.getName();
        assert.equal(gettingName,name, 'getName is not correct');
    });

    it('message is invalid', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        const inputMechBrowserPropsContract =  new InputMechBrowserPropsContract(pointer, hover);
        sinon.stub(inputMechBrowserPropsContract, 'getName').returns(3);
        inputMechBrowserPropsContract.buildQueueMessage();

        assert.equal(this._logWarnStub.firstCall.args[0], validateMessageLog);
    });


});