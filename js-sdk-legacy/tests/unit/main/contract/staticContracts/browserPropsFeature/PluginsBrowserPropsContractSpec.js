import sinon from "sinon";
import Log from "../../../../../../src/main/technicalServices/log/Logger";
import PluginsBrowserPropsContract from "../../../../../../src/main/contract/staticContracts/browserPropsContract/PluginsBrowserPropsContract";

describe('PluginsBrowserPropsContract test:', function () {
    let plugins = [['PDF Viewer', 'internal-pdf-viewer', 'Portable Document Format', ''], ['PDF Viewer', 'internal-pdf-viewer', 'Portable Document Format', 'blabla']];
    let logMessage = '';
    let name = 'plugins';
    const validateMessageLog = 'plugins, BrowserPropsContract - Contract verification failed';


    const assert = chai.assert;
    function getPreCondLogMessage (plugins){
        return ` wrong type in plugins, BrowserProps parameters. plugins : {expected: [[...string]], received: ${ typeof plugins}}`;
    }

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
        plugins = [['PDF Viewer', 'internal-pdf-viewer', 'Portable Document Format', ''], ['PDF Viewer', 'internal-pdf-viewer', 'Portable Document Format', 'blabla']];
        name = 'plugins';
        logMessage = '';
    });


    it('parameters initialization', function () {
        let pluginsBrowserPropsContract = new PluginsBrowserPropsContract(plugins);
        assert.equal(pluginsBrowserPropsContract.plugins[0][0], 'PDF Viewer', 'plugins is not initialized correctly');
        assert.equal(pluginsBrowserPropsContract.plugins[0][1], 'internal-pdf-viewer', 'plugins is not initialized correctly');
        assert.equal(pluginsBrowserPropsContract.plugins[0][2], 'Portable Document Format', 'plugins is not initialized correctly');
        assert.equal(pluginsBrowserPropsContract.plugins[0][3], '', 'plugins is not initialized correctly');
        assert.equal(pluginsBrowserPropsContract.plugins[1][0], 'PDF Viewer', 'plugins is not initialized correctly');
        assert.equal(pluginsBrowserPropsContract.plugins[1][1], 'internal-pdf-viewer', 'plugins is not initialized correctly');
        assert.equal(pluginsBrowserPropsContract.plugins[1][2], 'Portable Document Format', 'plugins is not initialized correctly');
        assert.equal(pluginsBrowserPropsContract.plugins[1][3], 'blabla', 'plugins is not initialized correctly');
    });

    it('pre condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new PluginsBrowserPropsContract(plugins);
        assert.isFalse(this._logWarnStub.called, 'did send log message while should not');
    });

    it('pre condition is not valid: receive string instead of array  . should send log', function () {
        plugins = "hello";
        logMessage = getPreCondLogMessage (plugins)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new PluginsBrowserPropsContract(plugins);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });
    it('pre condition is not valid: array length is not 4. should send log', function () {
        plugins = [['PDF Viewer', 'internal-pdf-viewer', 'Portable Document Format', ''], [ 'internal-pdf-viewer', 'Portable Document Format', 'blabla']];
        logMessage = getPreCondLogMessage (plugins)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new PluginsBrowserPropsContract(plugins);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });
    it('pre condition is not valid: didnt receive string in one of the entries  . should send log', function () {
        plugins = [['PDF Viewer', 'internal-pdf-viewer', 'Portable Document Format', ''], ['PDF Viewer', 'internal-pdf-viewer', 'Portable Document Format', true]];
        logMessage = getPreCondLogMessage (plugins)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new PluginsBrowserPropsContract(plugins);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });


    it('build message', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let pluginsBrowserPropsContract =  new PluginsBrowserPropsContract(plugins);
        let pluginsBrowsingMessage = pluginsBrowserPropsContract.buildQueueMessage();

        assert.equal(pluginsBrowsingMessage[0], name, 'build message built unsuccessfully');
        assert.equal(pluginsBrowsingMessage[1], plugins, 'build message built unsuccessfully');
    });

    it('post condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let pluginsBrowserPropsContract =  new PluginsBrowserPropsContract(plugins);
        pluginsBrowserPropsContract.buildQueueMessage();
        assert.isFalse(this._logWarnStub.called, 'did  send log message while should not');
    });

    it('getName is valid', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let pluginsBrowserPropsContract =  new PluginsBrowserPropsContract(plugins);
        let gettingName = pluginsBrowserPropsContract.getName();
        assert.equal(gettingName,name, 'getName is not correct');
    });
    it('message is invalid', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        const pluginsBrowserPropsContract =  new PluginsBrowserPropsContract(plugins);
        sinon.stub(pluginsBrowserPropsContract, 'getName').returns(3);
        pluginsBrowserPropsContract.buildQueueMessage();

        assert.equal(this._logWarnStub.firstCall.args[0], validateMessageLog);
    });

});