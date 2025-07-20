import Log from "../../../../../src/main/technicalServices/log/Logger";
import sinon from "sinon";
import MediaDevicesContract from "../../../../../src/main/contract/staticContracts/MediaDevicesContract";

describe('MediaDevicesContract test:', function () {
    let mediaDevices = [['kind1', 'label1', 'deviceId1', 'groupId1'], ['kind2', 'label2', 'deviceId2', 'groupId2']];
    let logMessage = '';
    let name = 'media_devices';
    const validateMessageLog = 'MediaDevices - Contract verification failed';


    const assert = chai.assert;
    function getPreCondLogMessage (mediaDevices){
        return ` wrong type in MediaDevicesContract parameters. mediaDevices : {expected: [[...string]], received: ${mediaDevices}}`;
    }

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
        mediaDevices = [['kind1', 'label1', 'deviceId1', 'groupId1'], ['kind2', 'label2', 'deviceId2', 'groupId2']];
        logMessage = '';
    });


    it('parameters initialization', function () {
        let mediaDevicesContract = new MediaDevicesContract(mediaDevices);

        assert.equal(mediaDevicesContract.mediaDevices[0][0], 'kind1', 'parameters initialization unsuccessfully');
        assert.equal(mediaDevicesContract.mediaDevices[0][1], 'label1', 'parameters initialization unsuccessfully');
        assert.equal(mediaDevicesContract.mediaDevices[0][2], 'deviceId1', 'parameters initialization unsuccessfully');
        assert.equal(mediaDevicesContract.mediaDevices[0][3], 'groupId1', 'parameters initialization unsuccessfully');
        assert.equal(mediaDevicesContract.mediaDevices[1][0], 'kind2', 'parameters initialization unsuccessfully');
        assert.equal(mediaDevicesContract.mediaDevices[1][1], 'label2', 'parameters initialization unsuccessfully');
        assert.equal(mediaDevicesContract.mediaDevices[1][2], 'deviceId2', 'parameters initialization unsuccessfully');
        assert.equal(mediaDevicesContract.mediaDevices[1][3], 'groupId2', 'parameters initialization unsuccessfully');
    });

    it('pre condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new MediaDevicesContract(mediaDevices);
        assert.isFalse(this._logWarnStub.called, 'did send log message while should not');
    });

    it('pre condition is not valid: did not received an array. should send log', function () {
        mediaDevices = 5
        logMessage = getPreCondLogMessage (mediaDevices)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new MediaDevicesContract(mediaDevices);
        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });

    it('pre condition is not valid: one of the arrays size is not 4. should send log', function () {
        let mediaDevicesFail = [['kind1', 'label1', 'deviceId1', 'groupId1'], ['kind2', 'deviceId2', 'groupId2']];
        logMessage = getPreCondLogMessage (mediaDevicesFail)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new MediaDevicesContract(mediaDevicesFail);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });

    it('pre condition is not valid: one of the arrays contains a boolean value. should send log', function () {
        mediaDevices = [['kind1', 'label1', 'deviceId1', 'groupId1'], ['kind2', 'label2', true, 'groupId2']];
        logMessage = getPreCondLogMessage (mediaDevices)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new MediaDevicesContract(mediaDevices);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });

    it('build message', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let mediaDevicesContract =  new MediaDevicesContract(mediaDevices);
        let mediaDevicesMessage = mediaDevicesContract.buildQueueMessage();

        assert.equal(mediaDevicesMessage[0], name, 'build message built unsuccessfully');
        assert.equal(mediaDevicesMessage[1][0][0], 'kind1', 'build message built unsuccessfully');
        assert.equal(mediaDevicesMessage[1][0][1], 'label1', 'build message built unsuccessfully');
        assert.equal(mediaDevicesMessage[1][0][2], 'deviceId1', 'build message built unsuccessfully');
        assert.equal(mediaDevicesMessage[1][0][3], 'groupId1', 'build message built unsuccessfully');
        assert.equal(mediaDevicesMessage[1][1][0], 'kind2', 'build message built unsuccessfully');
        assert.equal(mediaDevicesMessage[1][1][1], 'label2', 'build message built unsuccessfully');
        assert.equal(mediaDevicesMessage[1][1][2], 'deviceId2', 'build message built unsuccessfully');
        assert.equal(mediaDevicesMessage[1][1][3], 'groupId2', 'build message built unsuccessfully');
    });

    it('post condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let mediaDevicesContract =  new MediaDevicesContract(mediaDevices);
        mediaDevicesContract.buildQueueMessage();
        assert.isFalse(this._logWarnStub.called, 'did send log message while should not');
    });

    it('getName is valid', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let mediaDevicesContract =  new MediaDevicesContract(mediaDevices);
        let gettingName = mediaDevicesContract.getName();
        assert.equal(gettingName,name, 'getName is not correct');
    });
    it('message is invalid', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let mediaDevicesContract =  new MediaDevicesContract(mediaDevices);
        sinon.stub(mediaDevicesContract, 'getName').returns(3);
        mediaDevicesContract.buildQueueMessage();

        assert.equal(this._logWarnStub.firstCall.args[0], validateMessageLog);
    });


});