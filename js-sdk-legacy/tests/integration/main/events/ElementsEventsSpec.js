import { assert } from 'chai';
import { EventStructure as ElementEventStructure } from '../../../../src/main/collectors/events/ElementEventCollector';
import { EventStructure as ElementStructure } from '../../../../src/main/collectors/events/ElementsCollector';
import { WorkerCommand } from '../../../../src/main/events/WorkerCommand';
import { ElementEventType } from '../../../../src/main/collectors/events/ElementEventCollector';
import CDUtils from '../../../../src/main/technicalServices/CDUtils';
import ConfigurationChanger from '../ConfigurationChanger';
import { TestUtils } from '../../../TestUtils';
import sinon from "sinon";

describe('ElementsEvents tests:', function () {

        beforeEach(function () {
            const elementEvents = this.systemBootstrapper.getFeatureBuilder()._features.list.ElementEvents.instance;

            if (this._updateFeatureConfigSpy) {
                this._updateFeatureConfigSpy.restore();
            }

            this._updateFeatureConfigSpy = sinon.spy(elementEvents, 'updateFeatureConfig');

            // Modify the configuration before the scenario
            ConfigurationChanger.change(this.systemBootstrapper, {
                isElementsEvent: true,
            });
        });

        after(function () {
            if (this._updateFeatureConfigSpy) {
                this._updateFeatureConfigSpy.restore();
            }
        });

        it('ElementsEvents are sent to the worker', async function () {
            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

            // Wait for the configuration update to apply on the feature
            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this._updateFeatureConfigSpy.called, 'ElementEvents updateFeatureConfig function was not called once. It was called');
            });

            serverWorkerSendAsync.resetHistory();

            let e = document.createEvent('Event');
            e.initEvent('focus', false, true);
            const input = document.getElementById('txt1');
            input.value = 'TestHash';
            input.dispatchEvent(e);

            assert.equal(WorkerCommand.sendDataCommand, serverWorkerSendAsync.lastCall.args[0]);
            assert.equal('element_events', serverWorkerSendAsync.lastCall.args[1].eventName, 'eventName should be element_events');
            let lastCallDataArr = serverWorkerSendAsync.lastCall.args[1].data;
            assert.equal(lastCallDataArr[ElementEventStructure.indexOf('eventType') + 1], ElementEventType.focus);
            assert.equal(lastCallDataArr[0], this.systemBootstrapper.getContextMgr().contextHash, 'context id is not as expected');

            e = document.createEvent('Event');
            e.initEvent('blur', false, true);
            input.dispatchEvent(e);

            assert.equal(WorkerCommand.sendDataCommand, serverWorkerSendAsync.lastCall.args[0]);
            assert.equal('element_events', serverWorkerSendAsync.lastCall.args[1].eventName, 'expected eventName is element_events');
            lastCallDataArr = serverWorkerSendAsync.lastCall.args[1].data;
            assert.equal(lastCallDataArr.length, 11);
            assert.equal(lastCallDataArr[ElementEventStructure.indexOf('eventType') + 1], ElementEventType.blur);
            assert.exists(lastCallDataArr[ElementEventStructure.indexOf('isTrusted') + 1]);
            assert.equal(lastCallDataArr[ElementEventStructure.indexOf('elementValues') + 1], '');
            assert.equal(lastCallDataArr[ElementEventStructure.indexOf('selected') + 1], -1);
            assert.equal(lastCallDataArr[ElementEventStructure.indexOf('hashedValue') + 1], '', 'wrong hash value');

            serverWorkerSendAsync.resetHistory();

            const input2 = document.createElement('input');
            input2.setAttribute('id', 'input2');
            input2.value = 'bob input 2';
            input2.name = 'myElement';
            input2.className = 'css-class-name'; // set the CSS class
            input2.style.left = '100px';
            document.body.appendChild(input2); // put it into the DOM

            await TestUtils.waitForNoAssertion(() => {
                TestUtils.verifyCallHappened(serverWorkerSendAsync, 'elements', 'first elements set', function (data) {
                    assert.equal(data[ElementStructure.indexOf('tagName') + 1], 'INPUT', 'expected to be INPUT');
                    assert.equal(data[ElementStructure.indexOf('id') + 1], 'input2', 'expected to be input2');
                    assert.equal(data[ElementStructure.indexOf('name') + 1], 'myElement', 'expected to be myElement');
                    assert.equal(data[ElementStructure.indexOf('type') + 1], 'text', 'expected to be empty');
                    assert.notEqual(data[ElementStructure.indexOf('leftPosition') + 1], -1, 'expected to be != -1');
                    assert.notEqual(data[ElementStructure.indexOf('topPosition') + 1], -1, 'expected to be != -1');
                    assert.notEqual(data[ElementStructure.indexOf('width') + 1], -1, 'expected to be != -1');
                    assert.notEqual(data[ElementStructure.indexOf('height') + 1], -1, 'expected to be != -1');
                    assert.equal(data[ElementStructure.indexOf('className') + 1], 'css-class-name', 'expected to be css-class-name');
                    assert.equal(data[ElementStructure.indexOf('href') + 1], '', 'expected to be empty');
                    assert.equal(data[ElementStructure.indexOf('title') + 1], '', 'expected to be "enter password tooltip"');
                    assert.equal(data[ElementStructure.indexOf('alt') + 1], '', 'expected to be "enter password"');
                    assert.equal(data[ElementStructure.indexOf('selectValues') + 1], '', 'expected to be empty');
                    assert.equal(data[ElementStructure.indexOf('elementValue') + 1],  'aaa aaaaa 1', 'expected to be aaa aaaaa 1');
                    assert.equal(data[ElementStructure.indexOf('checked') + 1], 0, 'expected checked to be 0');
                });
            });

            serverWorkerSendAsync.resetHistory();
            e = document.createEvent('Event');
            e.initEvent('focus', false, true);

            input2.dispatchEvent(e);

            const expectedTimestamp = CDUtils.cutDecimalPointDigits(e.timeStamp, 3);
            await TestUtils.waitForNoAssertion(() => {
                TestUtils.verifyCallHappened(serverWorkerSendAsync, 'element_events', 'focus element event', function (data) {
                    assert.equal(data[ElementEventStructure.indexOf('eventType') + 1], ElementEventType.focus,
                        'event type is not focus');
                    assert.equal(data[ElementEventStructure.indexOf('selected') + 1], -1, 'selected should be true');
                    assert.equal(data[ElementEventStructure.indexOf('elementValues') + 1], '', 'value should be empty');
                    assert.equal(data[ElementEventStructure.indexOf('length') + 1], 0, 'length should be 0');
                    assert.equal(data[ElementEventStructure.indexOf('hashedValue') + 1], '', 'wrong hash value');
                    assert.equal(data[ElementEventStructure.indexOf('relativeTime') + 1], expectedTimestamp, 'relativeTime value is not found on element event');
                });
            });

            serverWorkerSendAsync.resetHistory();
        });

        it('ElementsEvents are sent once a submit event occurs', async function () {
            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

            // Wait for the configuration update to apply on the feature
            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this._updateFeatureConfigSpy.called, 'ElementEvents updateFeatureConfig function was not called once. It was called');
            });

            serverWorkerSendAsync.resetHistory();

            let confirmMutation = false;
            const mutationCallback = () => {
                confirmMutation = true;
            };
            const observer = TestUtils.startMutation(mutationCallback, document);

            // create form element. no need to test mutation since already tested
            const _myform = document.createElement('form');
            _myform.setAttribute('method', 'post');
            _myform.setAttribute('id', 'myFormForSubmitTest1');
            _myform.setAttribute('action', 'submit.php');
            document.body.appendChild(_myform);

            // Need to add local mutation handler that will signal the test to continue

            await TestUtils.waitForNoAssertion(() => {
                assert.exists(document.getElementById('myFormForSubmitTest1'));
                assert.equal(true, confirmMutation, "Failed to receive mutation notification");
                observer.disconnect();
            });

            const formSubmissionsEvent = document.createEvent('Event');
            formSubmissionsEvent.initEvent('submit', true, true);
            _myform.dispatchEvent(formSubmissionsEvent);

            await TestUtils.waitForNoAssertion(() => {
                TestUtils.verifyCallHappened(serverWorkerSendAsync, 'element_events', 'form elements event', function (data) {
                    assert.equal(data[ElementEventStructure.indexOf('eventType') + 1], ElementEventType.submit,
                        'event type is not form submit');
                });
            }).finally(() => {
                document.body.removeChild(_myform);
            });

            await TestUtils.waitForNoAssertion(() => {
                TestUtils.verifyCallHappened(serverWorkerSendAsync, 'elements', 'first elements set', function (data) {
                    assert.equal(data[ElementStructure.indexOf('tagName') + 1], 'FORM', 'expected to be FORM');
                    assert.equal(data[ElementStructure.indexOf('id') + 1], 'myFormForSubmitTest1', 'expected to be input2');
                    assert.equal(data[ElementStructure.indexOf('type') + 1], '', 'expected to be empty');
                    assert.notEqual(data[ElementStructure.indexOf('leftPosition') + 1], -1, 'expected to be != -1');
                    assert.notEqual(data[ElementStructure.indexOf('topPosition') + 1], -1, 'expected to be != -1');
                    assert.notEqual(data[ElementStructure.indexOf('width') + 1], -1, 'expected to be != -1');
                    assert.notEqual(data[ElementStructure.indexOf('height') + 1], -1, 'expected to be != -1');
                    assert.equal(data[ElementStructure.indexOf('className') + 1], '', 'expected to be empty');
                    assert.equal(data[ElementStructure.indexOf('href') + 1], '', 'expected to be empty');
                    assert.equal(data[ElementStructure.indexOf('title') + 1], '', 'expected to be "enter password tooltip"');
                    assert.equal(data[ElementStructure.indexOf('alt') + 1], '', 'expected to be "enter password"');
                    assert.equal(data[ElementStructure.indexOf('selectValues') + 1], '', 'expected to be empty');
                    assert.equal(data[ElementStructure.indexOf('elementValue') + 1], '');
                    assert.equal(data[ElementStructure.indexOf('checked') + 1], -1, 'expected checked to be 0');
                });
            });

            serverWorkerSendAsync.resetHistory();
        });

        it('ElementsEvents are sent once a click event occurs', async function () {
            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

            // Wait for the configuration update to apply on the feature
            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this._updateFeatureConfigSpy.called, 'ElementEvents updateFeatureConfig function was not called once. It was called');
            });

            serverWorkerSendAsync.resetHistory();

            let confirmMutation = false;
            const mutationCallback = () => {
                confirmMutation = true;
            };
            const observer = TestUtils.startMutation(mutationCallback, document);

            // create element with checked field
            const cb = document.createElement('input');
            cb.setAttribute('id', 'cb1');
            cb.setAttribute('type', 'checkbox');
            cb.checked = false;
            document.body.appendChild(cb);

            const e = document.createEvent('Event');
            e.initEvent('click', true, true);

            // Trigger the click event. This should also make the checkbox selected
            cb.click();


            await TestUtils.waitForNoAssertion(() => {
                TestUtils.verifyCallHappened(serverWorkerSendAsync, 'elements', 'first elements set', function (data) {
                    assert.equal(data[ElementStructure.indexOf('tagName') + 1], 'INPUT', 'expected to be INPUT');
                    assert.equal(data[ElementStructure.indexOf('id') + 1], 'cb1', 'expected to be cb1');
                    assert.equal(data[ElementStructure.indexOf('type') + 1], 'checkbox', 'expected to be checkbox');
                    assert.notEqual(data[ElementStructure.indexOf('leftPosition') + 1], -1, 'expected to be != -1');
                    assert.notEqual(data[ElementStructure.indexOf('topPosition') + 1], -1, 'expected to be != -1');
                    assert.notEqual(data[ElementStructure.indexOf('width') + 1], -1, 'expected to be != -1');
                    assert.notEqual(data[ElementStructure.indexOf('height') + 1], -1, 'expected to be != -1');
                    assert.equal(data[ElementStructure.indexOf('className') + 1], '', 'expected to be empty');
                    assert.equal(data[ElementStructure.indexOf('href') + 1], '', 'expected to be empty');
                    assert.equal(data[ElementStructure.indexOf('title') + 1], '', 'expected to be "enter password tooltip"');
                    assert.equal(data[ElementStructure.indexOf('alt') + 1], '', 'expected to be "enter password"');
                    assert.equal(data[ElementStructure.indexOf('selectValues') + 1], '', 'expected to be empty');
                    assert.equal(data[ElementStructure.indexOf('elementValue') + 1], 'aa');
                    assert.equal(data[ElementStructure.indexOf('checked') + 1], 1, 'expected checked to be 0');
                });
            });


            await TestUtils.waitForNoAssertion(() => {
                assert.exists(document.getElementById('cb1'));
                assert.equal(true, confirmMutation, "Failed to receive mutation notification");
                observer.disconnect();
            });

            await TestUtils.waitForNoAssertion(() => {
                TestUtils.verifyCallHappened(serverWorkerSendAsync, 'elements', 'click element event', function (data) {
                    assert.equal(data[ElementStructure.indexOf('checked') + 1], 1, 'checked should be true');
                });
            });

            serverWorkerSendAsync.resetHistory();
        });

        it('ElementFocusEvents are sent on select event', async function () {
            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
            ConfigurationChanger.change(this.systemBootstrapper, {
                collectSelectElementBlurAndFocusEvents: true,
            });
            // Wait for the configuration update to apply on the feature
            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this._updateFeatureConfigSpy.called, 'ElementEvents updateFeatureConfig function was not called once. It was called');
            });

            let confirmMutation = false;
            const mutationCallback = () => {
                confirmMutation = true;
            };
            const observer = TestUtils.startMutation(mutationCallback, document);

            serverWorkerSendAsync.resetHistory();
            const select = document.createElement('select');
            const optionsValues = [];
            for (let i = 0; i < 5; i++) {
                const opt = document.createElement('option');
                opt.value = i;
                opt.text = i + '_text';
                optionsValues.push(i + '_text');
                select.appendChild(opt);
            }

            select.setAttribute('id', 'select1');
            select.selectedIndex = 0;
            document.body.appendChild(select);

            await TestUtils.waitForNoAssertion(() => {
                assert.exists(document.getElementById('select1'));
                assert.equal(true, confirmMutation, "Failed to receive mutation notification");
                observer.disconnect();
            });

            const e = document.createEvent('Event');
            e.initEvent('focus', false, true);
            select.dispatchEvent(e);

            await TestUtils.waitForNoAssertion(() => {
                TestUtils.verifyCallHappened(serverWorkerSendAsync, 'element_events', 'focus element event', function (data) {
                    assert.equal(data[ElementEventStructure.indexOf('eventType') + 1], ElementEventType.focus,
                        'event type is not focus');
                    assert.equal(data[ElementEventStructure.indexOf('selected') + 1], -1, 'checked should be true');
                });
            });

            serverWorkerSendAsync.resetHistory();
        });

        it('ElementBlurEvents are sent on select event', async function () {
            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
            ConfigurationChanger.change(this.systemBootstrapper, {
                collectSelectElementBlurAndFocusEvents: true,
            });
            // Wait for the configuration update to apply on the feature
            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this._updateFeatureConfigSpy.called, 'ElementEvents updateFeatureConfig function was not called once. It was called');
            });

            serverWorkerSendAsync.resetHistory();

            let confirmMutation = false;
            const mutationCallback = () => {
                confirmMutation = true;
            };
            const observer = TestUtils.startMutation(mutationCallback, document);

            const select = document.createElement('select');
            const optionsValues = [];
            for (let i = 0; i < 5; i++) {
                const opt = document.createElement('option');
                opt.value = i;
                opt.text = i + '_text';
                optionsValues.push(i + '_text');
                select.appendChild(opt);
            }

            select.setAttribute('id', 'select1');
            select.selectedIndex = 0;
            document.body.appendChild(select);

            await TestUtils.waitForNoAssertion(() => {
                assert.exists(document.getElementById('select1'));
                assert.equal(true, confirmMutation, "Failed to receive mutation notification");
                observer.disconnect();
            });

            const e = document.createEvent('Event');
            e.initEvent('blur', false, true);
            select.dispatchEvent(e);

            await TestUtils.waitForNoAssertion(() => {
                TestUtils.verifyCallHappened(serverWorkerSendAsync, 'element_events', 'element blur event', function (data) {
                    assert.equal(data[ElementEventStructure.indexOf('eventType') + 1], ElementEventType.blur,
                        'event type is not blur');
                    assert.equal(data[ElementEventStructure.indexOf('selected') + 1], -1, 'should be -1');
                });
            });

            serverWorkerSendAsync.resetHistory();
        });

        it('ElementBlurEvents are not sent on select event', async function () {
                const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
                ConfigurationChanger.change(this.systemBootstrapper, {
                    collectSelectElementBlurAndFocusEvents: false,
                });
                // Wait for the configuration update to apply on the feature
                await TestUtils.waitForNoAssertion(() => {
                    assert.isTrue(this._updateFeatureConfigSpy.called, 'ElementEvents updateFeatureConfig function was not called once. It was called');
                });

                serverWorkerSendAsync.resetHistory();
                const select = document.createElement('select');
                const optionsValues = [];
                for (let i = 0; i < 5; i++) {
                    const opt = document.createElement('option');
                    opt.value = i;
                    opt.text = i + '_text';
                    optionsValues.push(i + '_text');
                    select.appendChild(opt);
                }

                select.setAttribute('id', 'select1');
                select.selectedIndex = 0;
                document.body.appendChild(select);

                await TestUtils.waitForNoAssertion(() => {
                    assert.exists(document.getElementById('select1'));
                });

                const e = document.createEvent('Event');
                e.initEvent('focus', false, true);
                select.dispatchEvent(e);
                await TestUtils.waitForNoAssertion(() => {
                    const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'element_events');
                    assert.notExists(event,'element_event was found');
                });
                serverWorkerSendAsync.resetHistory();
            });

});
