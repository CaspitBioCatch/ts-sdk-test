import { assert } from 'chai';
import ScriptsRepository from '../../../../../src/main/collectors/perContext/ScriptsRepository';
import ScriptsFeature from '../../../../../src/main/collectors/perContext/ScriptsFeature';
import { MockObjects } from '../../../mocks/mockObjects';
import { TestUtils } from '../../../../TestUtils';
import DataQ from '../../../../../src/main/technicalServices/DataQ';

describe('ScriptsFeature test:', function () {
    it('startFeature should send static data with script data list', async function () {
        this.retries(3);

        const dataQ = sinon.createStubInstance(DataQ);

        const scriptsRepositoryStub = sinon.stub(new ScriptsRepository(MockObjects.cdUtils));
        scriptsRepositoryStub.exists.returns(false);

        const script = document.createElement('script');
        const head = document.getElementsByTagName('head')[0];
        script.setAttribute('type', 'text/javascript');
        script.setAttribute('src', 'base/tests/unit/main/collectors/perContext/dummyScriptOne.js');
        head.appendChild(script);

        const scripts = new ScriptsFeature(dataQ, scriptsRepositoryStub);

        scripts.startFeature();

        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(dataQ.addToQueue.called, `addToQueue was not called. document scripts list contains ${document.scripts.length} scripts`);
            const callArgs = dataQ.addToQueue.getCall(0).args;
            assert.equal('scripts', callArgs[0], 'expected first field to be scripts');
            // script either has to to be inline and have a hash or a url
            assert(callArgs[1][1] || callArgs[1][2], 'bad script field format');

            assert.notEqual(0, callArgs[1].length, 'the script list is empty');
        }).finally(() => {
            scripts.stopFeature(self);
            head.removeChild(script);
        });
    });

    it('should verify feature was called after 1 sec as well and added new script', async function () {
        const dataQ = sinon.createStubInstance(DataQ);
        const scriptsRepositoryStub = sinon.stub(new ScriptsRepository(MockObjects.cdUtils));
        scriptsRepositoryStub.exists.returns(false);

        const scripts = new ScriptsFeature(dataQ, scriptsRepositoryStub);
        scripts._timeoutValue = 50;

        const script = document.createElement('script');
        const head = document.getElementsByTagName('head')[0];
        script.setAttribute('type', 'text/javascript');
        script.setAttribute('src', 'base/tests/unit/main/collectors/perContext/dummyScriptOne.js');
        head.appendChild(script);

        dataQ.addToQueue.resetHistory();

        scripts.startFeature();

        const script2 = document.createElement('script');
        script.setAttribute('src', 'base/tests/unit/collectors/perContext/dummyScriptTwo.js');
        script.setAttribute('type', 'text/javascript');
        head.appendChild(script2);
        dataQ.addToQueue.reset();
        // now verify second script was reported
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(dataQ.addToQueue.called, 'addToQueue was not called when adding a script tag');
            const dummyScriptTwoQueueCall = dataQ.addToQueue.getCalls().find((item) => {
                return item.args[0] === 'scripts' && item.args[1][1].indexOf('dummyScriptTwo') > -1;
            });
            assert.isDefined(dummyScriptTwoQueueCall);
        }).finally(() => {
            scripts.stopFeature(self);
            head.removeChild(script2);
            head.removeChild(script);
            dataQ.addToQueue.reset();
        });
    });

    it('should verify feature was called after 1 sec and not added old script', async function () {
        const dataQ = sinon.createStubInstance(DataQ);
        const scriptsRepositoryStub = sinon.stub(new ScriptsRepository(MockObjects.cdUtils));
        scriptsRepositoryStub.exists.returns(false);

        const scripts = new ScriptsFeature(dataQ, scriptsRepositoryStub);
        const checkScript = sinon.stub(scripts, '_checkScriptsData');

        scripts._timeoutValue = 50;

        const script = document.createElement('script');
        const head = document.getElementsByTagName('head')[0];
        script.setAttribute('type', 'text/javascript');
        script.setAttribute('src', 'base/tests/unit/main/collectors/perContext/dummyScriptOne.js');
        head.appendChild(script);
        scripts.startFeature();

        // now verify all script events
        dataQ.addToQueue.reset();

        scriptsRepositoryStub.exists.returns(true);

        // Verify no scripts are resent
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(checkScript.called, 'checkScript was called for checking old scripts');
            assert.isTrue(dataQ.addToQueue.notCalled, 'addToQueue was not called when checking old scripts');
        }).finally(() => {
            scripts.stopFeature(self);
            head.removeChild(script);
            dataQ.addToQueue.reset();
        });
    });
});
