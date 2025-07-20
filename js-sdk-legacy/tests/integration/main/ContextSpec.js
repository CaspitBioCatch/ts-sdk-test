import {assert} from 'chai';
import ConfigurationChanger from './ConfigurationChanger';
import {TestUtils} from '../../TestUtils';
import {WorkerCommand} from '../../../src/main/events/WorkerCommand';
import TestFeatureSupport from '../../TestFeatureSupport';
import TestBrowserUtils from "../../TestBrowserUtils";

describe('Context Change tests:', function () {
    beforeEach(function () {
        this.sandbox = sinon.createSandbox();

        sessionStorage.removeItem('contextConfiguration');
        const ctxMgr = this.systemBootstrapper.getContextMgr();
        ctxMgr._contextSiteMapper._siteMap = null; // in order he will take a new one
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    it('context change event is sent to the worker upon API call', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
        const ctxMgr = this.systemBootstrapper.getContextMgr();
        const lastContextId = ctxMgr.contextId;
        let timestamp = 0;

        function saveTimestamp(data) {
            timestamp = data.timestamp;
        }

        // verify that the published timestamp is the one sent to server
        this.systemBootstrapper._contextMgr.onContextChange.subscribe(saveTimestamp);

        serverWorkerSendAsync.resetHistory();
        cdApi.changeContext('ADD_PAYEE');
        await TestUtils.waitForNoAssertion(() => {
            const contextChangeEvents = TestUtils.findAllEventsByName(serverWorkerSendAsync, 'contextChange');

            assert.exists(contextChangeEvents, 'No context change events');

            const contextChange = contextChangeEvents.find((item) => {
                return item.data[0] === ctxMgr._toInt32Hash(ctxMgr.contextId);
            });

            assert.exists(contextChange, 'Expected context change event does not exist.');

            assert.equal(contextChange.data[0], ctxMgr._toInt32Hash(ctxMgr.contextId), 'context id did not change after api call');
            assert.equal(contextChange.data[2], 'ADD_PAYEE', 'context name not as expected');
            assert.equal(contextChange.data[3], timestamp, 'context timestamp not as expected');
        });

        serverWorkerSendAsync.resetHistory();
        cdApi.changeContext('BOB');
        await TestUtils.waitForNoAssertion(() => {
            const contextChangeEvents = TestUtils.findAllEventsByName(serverWorkerSendAsync, 'contextChange');

            assert.exists(contextChangeEvents, 'No context change events');

            const contextChange = contextChangeEvents.find((item) => {
                return item.data[0] === ctxMgr._toInt32Hash(ctxMgr.contextId);
            });

            assert.exists(contextChange, 'Expected context change event does not exist.');

            assert.equal(contextChange.data[0], ctxMgr._toInt32Hash(ctxMgr.contextId), 'context id did not changed after api call');
            assert.equal('BOB', contextChange.data[2], 'context name not as expected');

                TestUtils.verifyMsgToWorker(serverWorkerSendAsync, WorkerCommand.changeContextCommand, (data) => {
                    assert.equal(data.contextName, 'BOB', 'context name not as expected');
                });
            }).finally(() => {
                this.systemBootstrapper._contextMgr.onContextChange.unsubscribe(saveTimestamp);
            });
        });

    it('context change event is sent to the worker upon trigger according to server config', async function () {
        // If there is no mutation observer we will not have a trigger...
        if (!TestFeatureSupport.isMutationObserverSupported()) {
            this.skip();
            return;
        }

        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
        const ctxMgr = this.systemBootstrapper.getContextMgr();

        // Modify the configuration before the scenario
        ConfigurationChanger.change(this.systemBootstrapper, {
            'contextConfiguration': JSON.stringify({
                'triggers': [
                    {
                        'selector': 'body',
                    },
                    {
                        'selector': 'input[id=testTrigger]',
                    },
                ],
                'mappings': [
                    {
                        'selector': 'input[id=payment22]',
                        'contextName': 'PAYMENT',
                    },
                    {
                        'url': 'https://aaa.bbb.eee/',
                        'selector': 'input[id=payment]',
                        'contextName': 'PAYMENT1',
                    },
                    {
                        'selector': '[id=testTrigger][value=BOB]',
                        'contextName': 'PAYMENT3',
                    },
                    {
                        'url': 'https://aaa.bbb.ccc/',
                        'contextName': 'PAYMENT2',
                    },
                ],
            }),
        });

        let expectedContextId = ctxMgr.contextId + 1;

        serverWorkerSendAsync.resetHistory();
        let i = document.createElement('input'); // input element, text
        i.setAttribute('id', 'payment22');
        i.setAttribute('type', 'text');
        i.setAttribute('value', 'Shirley54');
        document.body.appendChild(i);

        await TestUtils.waitForNoAssertion(() => {
            const contextChangeEvents = TestUtils.findAllEventsByName(serverWorkerSendAsync, 'contextChange');

            assert.exists(contextChangeEvents, 'No context change events');

            const contextChange = contextChangeEvents.find((item) => {
                return item.data[0] === ctxMgr._toInt32Hash(expectedContextId);
            });

            assert.exists(contextChange, 'Expected context change event does not exist.');

            assert.equal(contextChange.data[0], ctxMgr._toInt32Hash(expectedContextId), 'context id did not change adding item');
            assert.equal('PAYMENT', contextChange.data[2], 'context name not as expected');

            // all elements should be resent with the new context
            // the first call is the element change
            // then change context happens
            const calls = serverWorkerSendAsync.getCalls();
            let verifiedOnce = false;
            for (let j = 1; j < calls.length; j++) {
                if (calls[j].args[1].eventName === 'elements') {
                    assert.notEqual(0, calls[j].args[1].data.length, 'element data not as expected');
                    assert.equal(calls[j].args[1].data[0], ctxMgr._toInt32Hash(expectedContextId), 'bad context id field');
                    assert.equal(calls[j].args[1].data[2], 'INPUT', 'bad tag name for element');
                    verifiedOnce = true;
                }
            }
            assert.isTrue(verifiedOnce, 'elements mapping was not called');
        });

        serverWorkerSendAsync.resetHistory();

        expectedContextId += 1;
        // testTrigger
        i.setAttribute('id', 'kuku');
        const input = document.getElementById('testTrigger');
        input.setAttribute('value', 'BOB');

        await TestUtils.waitForNoAssertion(() => {
            const contextChangeEvents = TestUtils.findAllEventsByName(serverWorkerSendAsync, 'contextChange');

            assert.exists(contextChangeEvents, 'No context change events');

            const contextChange = contextChangeEvents.find((item) => {
                return item.data[0] === ctxMgr._toInt32Hash(expectedContextId);
            });

            assert.exists(contextChange, 'Expected context change event does not exist.');

            assert.equal(contextChange.data[0], ctxMgr._toInt32Hash(expectedContextId), 'context id did not change adding item');
            assert.equal('PAYMENT3', contextChange.data[2], 'context name not as expected');

            const calls = serverWorkerSendAsync.getCalls();
            assert.equal(calls[0].args[0], WorkerCommand.changeContextCommand);
            assert.equal('PAYMENT3', calls[0].args[1].contextName, 'context name not as expected');
        });

        serverWorkerSendAsync.resetHistory();
        input.setAttribute('value', 'kuku');
        await TestUtils.waitForNoAssertion(() => {
            // get all the calls for context change sent to worker
            const calls = serverWorkerSendAsync.getCalls().find((x) => {
                return x.args[0] === WorkerCommand.changeContextCommand;
            });

            assert.notExists(calls, 'non context change created a context change and server call');
        });

        serverWorkerSendAsync.resetHistory();
        document.body.removeChild(input);
        await TestUtils.waitForNoAssertion(() => { // get all the calls for context change sent to worker
            const calls = serverWorkerSendAsync.getCalls().find((x) => {
                return x.args[0] === WorkerCommand.changeContextCommand;
            });

            assert.notExists(calls, 'non context change created a context change and server call');
        }).finally(() => {
            document.body.removeChild(i);
            i = null;
        });
    });

    it('context change event is sent from slave', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
        const ctxMgr = this.systemBootstrapper.getContextMgr();
        const lastContextId = ctxMgr.contextId;

        serverWorkerSendAsync.resetHistory();
        window.postMessage({
            msgType: 'updateMasterContext',
            data: {
                contextId: 1,
                contextHash: ctxMgr._toInt32Hash(1),
                url: 'testUrl',
                name: 'testName',
                referrer: '',
                hLength: 2,
                timestamp: 53,
            },
        }, '*');

        await TestUtils.waitForNoAssertion(() => {
            const contextChangeEvents = TestUtils.findAllEventsByName(serverWorkerSendAsync, 'contextChange');

            assert.exists(contextChangeEvents, 'No context change events');

            const contextChange = contextChangeEvents.find((item) => {
                return item.data[0] === ctxMgr._toInt32Hash(ctxMgr.contextId);
            });

            assert.exists(contextChange, 'Expected context change event does not exist.');

            assert.notEqual(lastContextId, ctxMgr.contextId,
                'context id did not change after api call');
            assert.equal(contextChange.data[2], 'testName', 'context name not as expected');
            assert.equal(contextChange.data[3], 53, 'context timestamp not as expected');
        });
    });

    it('context change runs the per context features', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
        serverWorkerSendAsync.resetHistory();
        // add new element to be found on mapping
        const input2 = document.createElement('input');
        input2.setAttribute('id', 'testElementTADADA');
        input2.value = 'best input';
        input2.name = 'testMapping';
        input2.className = 'test-class-name'; // set the CSS class
        document.body.appendChild(input2); // put it into the DOM

        const script = document.createElement('script');
        const head = document.getElementsByTagName('head')[0];
        script.setAttribute('type', 'text/javascript');
        script.setAttribute('src', 'base/tests/integration/dummyScriptOne.js');
        head.appendChild(script);

        serverWorkerSendAsync.resetHistory();
        window.cdApi.changeContext('Some Context');

        await TestUtils.waitForNoAssertion(() => {
            TestUtils.verifyCallHappened(serverWorkerSendAsync, 'static_fields', 'change context run static', function (data) {
                if (data[0] === 'display' && self.screen) {
                    assert.equal('display', data[0], 'display was not called');
                }
            });
            TestUtils.verifyCallHappened(serverWorkerSendAsync, 'scripts', 'contextChange run scripts', function (data) {
                // if we're here call happened
                assert.notEqual(0, data.length, 'scripts was not called');
                assert.isTrue(data[1].indexOf('dummyScript') > -1, 'expected first field to be script src');
            });

            // Get only the testElementTADADA data which was sent. We expect it to be sent twice.
            // Once when it was added and second time after context was changed
            const elementEvents = serverWorkerSendAsync.getCalls().filter((x) => {
                return x.args[0] === WorkerCommand.sendDataCommand && x.args[1].eventName === 'elements' && x.args[1].data[3] === 'testElementTADADA';
            });

            assert.equal(elementEvents.length, 2, 'testElementTADADA was sent invalid amount of times to the server');
            // Check the last element update which was sent
            assert.equal(elementEvents[elementEvents.length - 1].args[1].eventName, 'elements', 'event not as expected');
            assert.equal(elementEvents[elementEvents.length - 1].args[1].data[3], 'testElementTADADA', 'bad element field');
            assert.equal(elementEvents[elementEvents.length - 1].args[1].data[4], 'testMapping', 'bad element name');
            assert.equal(elementEvents[elementEvents.length - 1].args[1].data[10], 'test-class-name', 'bad element class');
        }).finally(() => {
            serverWorkerSendAsync.resetHistory();
        });
    });

    it('context change runs frames related features', async function () {
        const keyEvent = this.systemBootstrapper.getFeatureBuilder()._features.list.KeyEvents.instance;
        const startFeatureSpy = this.sandbox.spy(keyEvent, 'startFeature');

        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
        serverWorkerSendAsync.resetHistory();

        this.iframe1 = document.createElement('iframe');
        this.iframe1.setAttribute('id', 'iframe1Test');
        document.body.appendChild(this.iframe1);
        this.iframe1.contentWindow.testSign = 'iframe1';

        this.iframe2 = document.createElement('iframe');
        this.iframe2.setAttribute('id', 'iframe2Test');
        document.body.appendChild(this.iframe2);
        this.iframe2.contentWindow.testSign = 'iframe2';

        startFeatureSpy.resetHistory();
        window.cdApi.changeContext('Some Context123');

        await TestUtils.waitForNoAssertion(() => {
            const calls = startFeatureSpy.getCalls();
            assert.equal(calls.length, 2, 'number of start calls is not 2');
            assert.isTrue(startFeatureSpy.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe1'))));
            assert.isTrue(startFeatureSpy.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe2'))));
        }).finally(() => {
            serverWorkerSendAsync.resetHistory();
            startFeatureSpy.restore();
        });
    });

    it('context change triggers sending elements data', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
        const ctxMgr = this.systemBootstrapper.getContextMgr();
        const lastContextId = ctxMgr.contextId;

        serverWorkerSendAsync.resetHistory();
        cdApi.changeContext('ADD_PAYEE');
        await TestUtils.waitForNoAssertion(() => {
            const contextChangeEvents = TestUtils.findAllEventsByName(serverWorkerSendAsync, 'contextChange');

            assert.exists(contextChangeEvents, 'No context change events');

            const contextChange = contextChangeEvents.find((item) => {
                return item.data[0] === ctxMgr._toInt32Hash(ctxMgr.contextId);
            });

            assert.exists(contextChange, 'Expected context change event does not exist.');

            assert.equal(contextChange.data[0], ctxMgr._toInt32Hash(ctxMgr.contextId), 'context id did not change after api call');
            assert.equal(contextChange.data[2], 'ADD_PAYEE', 'context name not as expected');

            // We check that elements were sent with the new context id.
            const elementItemsSent = serverWorkerSendAsync.getCalls().filter((item) => {
                return item.args[1].eventName === 'elements';
            });

            assert.exists(elementItemsSent, 'could not find element messages which were sent to server after context was changed');

            // Its enough to check the last elements message. Checking all might result in failure due to messages which were sent before
            // the context change was performed
            assert.equal(elementItemsSent[elementItemsSent.length - 1].args[1].data[0], ctxMgr._toInt32Hash(ctxMgr.contextId), 'wrong context id');
        });
    });

});
