import { assert } from 'chai';
import { TestUtils } from '../../TestUtils';
import { WorkerCommand } from '../../../src/main/events/WorkerCommand';
import TestEvents from '../../TestEvents';
import TestBrowserUtils from '../../TestBrowserUtils';
import ConfigurationChanger from './ConfigurationChanger';

describe('Customer Api tests:', function () {
    // we wait for all other feature to run in order not to interfere the test. For example, in less time the
    // isPrivateBrowsing may be reported
    it('Pause api should stop all reporting of events and resume should report', async function () {
        ConfigurationChanger.change(this.systemBootstrapper, {
            resetSessionApiThreshold: -1,
            stateChangeEnabled: true
        });

        function getEventName() {
            return serverWorkerSendAsync.called ? serverWorkerSendAsync.getCall(0).args[0] : '';
        }

        await TestUtils.wait(2000);
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
        serverWorkerSendAsync.resetHistory();
        cdApi.pauseCollection();

        await TestUtils.wait(1000);
        serverWorkerSendAsync.resetHistory();

        // create element event
        let e = document.createEvent('Event');
        e.initEvent('focus', false, true);
        const input = document.getElementById('txt1');
        input.dispatchEvent(e);
        assert.isTrue(serverWorkerSendAsync.notCalled, 'element event called on pause: ' + getEventName());

        // create mouse events
        input.click();

        if (!TestBrowserUtils.isIE()) {
            TestEvents.publishMouseEvent('mousemove', 0, 0, 3, 3, 100, 100);

            if (!TestBrowserUtils.isEdge(window.navigator.userAgent)) {
                TestEvents.publishMouseEvent('mouseleave', 0, 0, 55, 55, 100, 100);
            }
        }
        assert.isTrue(serverWorkerSendAsync.notCalled, 'mouse event called on pause: ' + getEventName());

        e = document.createEvent('Event');
        e.initEvent('resize', true, true);
        window.dispatchEvent(e);
        assert.isTrue(serverWorkerSendAsync.notCalled, 'window event called on pause: ' + getEventName());
        if (!TestBrowserUtils.isIE()) {
            TestEvents.publishKeyboardEvent('keydown', 'Q', 'q', 81, '0', false, false, true, 0);
            assert.isTrue(serverWorkerSendAsync.notCalled, 'key event called on pause: ' + getEventName());
        }

        // verify apis are not available
        cdApi.changeContext('Some Context');

        await TestUtils.wait(100);

        assert.notExists(serverWorkerSendAsync.getCalls().find((item) => {
            return item.args[0] === WorkerCommand.changeContextCommand;
        }), 'changeContext api was called.');

        cdApi.startNewSession();

        await TestUtils.wait(100);

        assert.notExists(serverWorkerSendAsync.getCalls().find((item) => {
            return item.args[0] === WorkerCommand.startNewSessionCommand;
        }), 'startNewSession api was called.');
        cdApi.resumeCollection();

        cdApi.startNewSession();

        await TestUtils.waitForNoAssertion(() => {
            assert.exists(serverWorkerSendAsync.getCalls().find((item) => {
                return item.args[0] === WorkerCommand.startNewSessionCommand;
            }), 'startNewSession api was not called after api was resumed');
        });
    });

    describe('Customer facing API functions to server',()=>{
        let srvWrkSendAsync;
     beforeEach(async function(){
         srvWrkSendAsync = await this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
         srvWrkSendAsync.resetHistory();
     })
        it('Change context', async function () {
            window.cdApi.changeContext('MAKE_PAYMENT');

            await TestUtils.waitForNoAssertion(() => {
                const contextChangeEvent = TestUtils.findLatestEventByName(srvWrkSendAsync, 'contextChange');

                assert.exists(contextChangeEvent);
                assert.equal(contextChangeEvent.eventName, 'contextChange', 'msg name is not contextChange');
                assert.equal(contextChangeEvent.data[2], 'MAKE_PAYMENT', 'context is not as expected');
            });
        });

        it('Send metadata', async function () {
            window.cdApi.sendMetadata({
                test1: 'myString',
                test2: 1984,
                obj: {
                    a: 'a', b: 5,
                },
            });

            await TestUtils.waitForNoAssertion(() => {
                let customerMetadataCall = null;
                const calls = srvWrkSendAsync.getCalls();

                for (let i = 0; i < calls.length; i++) {
                    if (calls[i].args[1].eventName === 'customer_metadata') {
                        customerMetadataCall = calls[i];
                        break;
                    }
                }

                assert.isDefined(customerMetadataCall);
                assert.isNotNull(customerMetadataCall);
                assert.equal(customerMetadataCall.args[1].eventName, 'customer_metadata', 'msg name is not customer_metadata');
                assert.equal(customerMetadataCall.args[1].data[1].test1, 'myString', 'data no as expected');
            });
        });

        it('Send csid', async function () {
            window.cdApi.setCustomerSessionId('CustomerSessionIDTadadada');

            await TestUtils.waitForNoAssertion(() => {
                let updateCsidCommand = null;
                const calls = srvWrkSendAsync.getCalls();

                for (let i = 0; i < calls.length; i++) {
                    if (calls[i].args[0] === WorkerCommand.updateCsidCommand && calls[i].args[1].csid === 'CustomerSessionIDTadadada') {
                        updateCsidCommand = calls[i];
                        break;
                    }
                }

                assert.isDefined(updateCsidCommand);
                assert.isNotNull(updateCsidCommand);
                assert.equal(updateCsidCommand.args[1].csid, 'CustomerSessionIDTadadada', 'csid is invalid');
            });
        });

        it('Send psid', async function () {
            window.postMessage({ type: 'cdSetPsid', psid: 'partnerID' }, window.location.href);

            await TestUtils.waitForNoAssertion(() => {
                let updatePsidMessage = null;
                const calls = srvWrkSendAsync.getCalls();

                for (let i = 0; i < calls.length; i++) {
                    if (calls[i].args[0] === WorkerCommand.updatePsidCommand) {
                        updatePsidMessage = calls[i];
                        break;
                    }
                }

                assert.isDefined(updatePsidMessage);
                assert.isNotNull(updatePsidMessage);
                assert.equal(updatePsidMessage.args[1].psid, 'partnerID', 'psid is invalid');
            });
        });

        it('Invalid undefined psid', async function () {
            window.postMessage({ type: 'cdSetPsid', psid: undefined }, window.location.href);

            // Wait for the message to be processed.
            await TestUtils.wait(500);

            await TestUtils.waitForNoAssertion(() => {
                let updatePsidMessage = null;
                const calls = srvWrkSendAsync.getCalls();

                for (let i = 0; i < calls.length; i++) {
                    if (calls[i].args[0] === WorkerCommand.updatePsidCommand) {
                        updatePsidMessage = calls[i];
                        break;
                    }
                }

                assert.isNull(updatePsidMessage);
            });
        });

        it('flushing data', async function(){
            window.cdApi.client.flush();

            await TestUtils.waitForNoAssertion(()=>{
                let customerFlushCall = null;
                const calls = srvWrkSendAsync.getCalls();
                for (let i = 0; i < calls.length; i++) {
                    if(calls[i].args[1][0].eventName === 'flushData'){
                        customerFlushCall = calls[i];
                    }
                }
                assert.isDefined(customerFlushCall);
                assert.isNotNull(customerFlushCall);
                assert.equal(customerFlushCall.args[1][0].eventName, 'flushData', 'event name not equals to flushData');
            })
        })
    })
});
