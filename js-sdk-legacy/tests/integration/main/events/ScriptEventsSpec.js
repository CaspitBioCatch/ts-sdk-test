import { assert } from 'chai';
import { ScriptEventType } from '../../../../src/main/collectors/events/ScriptEventCollector';
import { TestUtils } from '../../../TestUtils';

describe('ScriptEvents tests:', function () {
    it('ScriptEvents is sent to the worker', async function () {
        this.retries(3);

        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
        serverWorkerSendAsync.resetHistory();

        // var ctxMgr = this.systemBootstrapper.getContextMgr();
        const head = document.getElementsByTagName('head')[0];
        const script = document.createElement('script');
        script.setAttribute('type', 'text/javascript');
        script.setAttribute('src', 'http://code.jquery.com/jquery-1.7.1.min.js');
        head.appendChild(script);

        await TestUtils.waitForNoAssertion(() => {
            TestUtils.verifyCallHappened(serverWorkerSendAsync, 'script_events', 'script_events', function (data) {
                assert.equal(ScriptEventType.load, data[3], 'script event data not as expected');
                assert.equal('http://code.jquery.com/jquery-1.7.1.min.js', data[7], 'script event data not as expected');
            });
        });
    });
});
