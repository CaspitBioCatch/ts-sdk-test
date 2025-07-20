import Log from "../../../../../src/main/technicalServices/log/Logger";
import sinon from "sinon";
import GraphicDetectContract from "../../../../../src/main/contract/staticContracts/GraphicDetectContract";

describe('GraphicDetectContract test:', function () {
    let renderer = 'renderer';
    let vendor = 'vendor';
    let version = 'version';
    let supportedExtensions = 'supportedExtensions';
    let logMessage = '';
    const validateMessageLog = 'GraphicDetect - Contract verification failed';
    let name = 'grph_card';


    const assert = chai.assert;

    function getPreCondLogMessage(renderer, vendor, version,supportedExtensions) {
        return `wrong type in GraphicDetectContract parameters. renderer: {expected: string, received: ${typeof renderer}}, vendor: {expected: string, received: ${typeof vendor}},
            version: {expected: string, received: ${typeof version}}, supportedExtensions: {expected: string, received: ${typeof supportedExtensions}}`;
    }

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
        renderer = 'renderer';
        vendor = 'vendor';
        version = 'version';
        supportedExtensions = 'supportedExtensions';
        logMessage = '';
    });


    it('parameters initialization', function () {
        let graphicDetectContract = new GraphicDetectContract(renderer, vendor, version, supportedExtensions);
        assert.equal(graphicDetectContract.renderer, 'renderer', 'renderer is not initialized correctly');
        assert.equal(graphicDetectContract.vendor, 'vendor', 'vendor is not initialized correctly');
        assert.equal(graphicDetectContract.version, 'version', 'version is not initialized correctly');

    });

    it('pre condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new GraphicDetectContract(renderer, vendor, version, supportedExtensions);
        assert.isFalse(this._logWarnStub.called, 'did  send log message while should not');
    });

    it('pre condition is not valid: receive number instead of string. should send log', function () {
        vendor = 7;
        logMessage = getPreCondLogMessage(renderer, vendor, version,supportedExtensions)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new GraphicDetectContract(renderer, vendor, version, supportedExtensions);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });


    it('build message', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let graphicDetectContract = new GraphicDetectContract(renderer, vendor, version, supportedExtensions);
        let graphicDetectMessage = graphicDetectContract.buildQueueMessage();

        assert.equal(graphicDetectMessage[0], name, 'build message built unsuccessfully');
        assert.equal(graphicDetectMessage[1][0], renderer, 'build message built unsuccessfully');
        assert.equal(graphicDetectMessage[1][1], vendor, 'build message built unsuccessfully');
        assert.equal(graphicDetectMessage[1][2], version, 'build message built unsuccessfully');

    });

    it('post condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let graphicDetectContract = new GraphicDetectContract(renderer, vendor, version, supportedExtensions);
        graphicDetectContract.buildQueueMessage();
        assert.isFalse(this._logWarnStub.called, 'did  send log message while should not');
    });

    it('getName is valid', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let graphicDetectContract = new GraphicDetectContract(renderer, vendor, version, supportedExtensions);
        let gettingName = graphicDetectContract.getName();
        assert.equal(gettingName, name, 'getName is not correct');
    });

    it('message is invalid', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        const graphicDetectContract = new GraphicDetectContract(renderer, vendor, version, supportedExtensions);
        sinon.stub(graphicDetectContract, 'getName').returns(3);
        graphicDetectContract.buildQueueMessage();

        assert.equal(this._logWarnStub.firstCall.args[0], validateMessageLog);
    });


});
