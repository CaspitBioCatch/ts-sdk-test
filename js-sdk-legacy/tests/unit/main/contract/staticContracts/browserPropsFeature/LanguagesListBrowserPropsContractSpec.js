import sinon from "sinon";
import Log from "../../../../../../src/main/technicalServices/log/Logger";
import LanguagesListBrowserPropsContract from "../../../../../../src/main/contract/staticContracts/browserPropsContract/LanguagesListBrowserPropsContract";

describe('LanguagesListBrowserPropsContract test:', function () {
    let languagesList =  ['en-US', 'en'];
    let logMessage = '';
    let name = 'languages';
    const validateMessageLog='languages, BrowserPropsContract - Contract verification failed';


    const assert = chai.assert;
    function getPreCondLogMessage (languagesList){
        return` wrong type in LanguagesList, BrowserProps parameters. languagesList : {expected: [...string], received: ${ typeof languagesList}}`;
    }

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
        languagesList =  ['en-US', 'en'];
        name = 'languages';
        logMessage = '';
    });


    it('parameters initialization', function () {
        let langBrowserPropsContract = new LanguagesListBrowserPropsContract(languagesList);
        assert.equal(langBrowserPropsContract.languagesList, languagesList, 'languagesList is not initialized correctly');
    });

    it('pre condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new LanguagesListBrowserPropsContract(languagesList);
        assert.isFalse(this._logWarnStub.called, 'did send log message while should not');
    });

    it('pre condition is not valid: receive number instead of array. should send log', function () {
        languagesList = 1;
        logMessage = getPreCondLogMessage (languagesList)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new LanguagesListBrowserPropsContract(languagesList);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });
    it('pre condition is not valid: one of the array entries is not a string. should send log', function () {
        languagesList = ['en-US', 5];
        logMessage = getPreCondLogMessage (languagesList)
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new LanguagesListBrowserPropsContract(languagesList);

        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });


    it('build message', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let langBrowserPropsContract =  new LanguagesListBrowserPropsContract(languagesList);
        let langBrowsingMessage = langBrowserPropsContract.buildQueueMessage();

        assert.equal(langBrowsingMessage[0], name, 'build message built unsuccessfully');
        assert.equal(langBrowsingMessage[1], languagesList, 'build message built unsuccessfully');
    });

    it('post condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let langBrowserPropsContract =  new LanguagesListBrowserPropsContract(languagesList);
        langBrowserPropsContract.buildQueueMessage();
        assert.isFalse(this._logWarnStub.called, 'did  send log message while should not');
    });

    it('getName is valid', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        let langBrowserPropsContract =  new LanguagesListBrowserPropsContract(languagesList);
        let gettingName = langBrowserPropsContract.getName();
        assert.equal(gettingName,name, 'getName is not correct');
    });

    it('message is invalid', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        const langBrowserPropsContract =  new LanguagesListBrowserPropsContract(languagesList);
        sinon.stub(langBrowserPropsContract, 'getName').returns(3);
        langBrowserPropsContract.buildQueueMessage();

        assert.equal(this._logWarnStub.firstCall.args[0], validateMessageLog);
    });


});