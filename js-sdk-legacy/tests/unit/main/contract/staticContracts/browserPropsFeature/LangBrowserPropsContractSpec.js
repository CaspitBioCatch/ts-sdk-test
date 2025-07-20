import sinon from "sinon";
import Log from "../../../../../../src/main/technicalServices/log/Logger";
import LangBrowserPropsContract from "../../../../../../src/main/contract/staticContracts/browserPropsContract/LangBrowserPropsContract";

describe('LangBrowserPropsContract test:', function () {
    let language = 'en-US';
    let logMessage = '';
    let name = 'main_lang';
    let validateMessageLog = 'main_lang, BrowserPropsContract - Contract verification failed';


    const assert = chai.assert;
    function getPreCondLogMessage (language){
        return` wrong type in Lang, BrowserProps parameters. language : {expected: string, received: ${ typeof language}}`;
    }

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
        language = 'en-US';
        name = 'main_lang';
        logMessage = '';
    });


    it('parameters initialization', function () {
        let langBrowserPropsContract = new LangBrowserPropsContract(language);
        assert.equal(langBrowserPropsContract.language, language, 'language is not initialized correctly');
    });

    it('pre condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new LangBrowserPropsContract(language);
        assert.isFalse(this._logWarnStub.called, 'did send log message while should not');
    });

    it('pre condition is not valid: receive number instead of string. should send log', function () {
        language = 1;
        logMessage = getPreCondLogMessage (language)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new LangBrowserPropsContract(language);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });


    it('build message', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let langBrowserPropsContract =  new LangBrowserPropsContract(language);
        let langBrowsingMessage = langBrowserPropsContract.buildQueueMessage();

        assert.equal(langBrowsingMessage[0], name, 'build message built unsuccessfully');
        assert.equal(langBrowsingMessage[1], language, 'build message built unsuccessfully');
    });

    it('post condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let langBrowserPropsContract =  new LangBrowserPropsContract(language);
        langBrowserPropsContract.buildQueueMessage();
        assert.isFalse(this._logWarnStub.called, 'did  send log message while should not');
    });

    it('getName is valid', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let langBrowserPropsContract =  new LangBrowserPropsContract(language);
        let gettingName = langBrowserPropsContract.getName();
        assert.equal(gettingName,name, 'getName is not correct');
    });
    it('message is invalid', function () {
        language = 1;
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let langBrowserPropsContract =  new LangBrowserPropsContract(language);
        langBrowserPropsContract.buildQueueMessage();

        assert.isTrue(this._logWarnStub.calledTwice, 'did not send log message while should');
        assert.equal(this._logWarnStub.secondCall.args[0], validateMessageLog);
    });


});