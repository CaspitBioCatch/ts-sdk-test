import sinon from "sinon";
import ConfigurationChanger from "../ConfigurationChanger";
import {TestUtils} from "../../../TestUtils";
import {assert} from "chai";
import {
    ElementEventType,
    EventStructure as ElementEventStructure
} from "../../../../src/main/collectors/events/ElementEventCollector";
import {
    EventStructure,
    EventStructure as ElementStructure
} from "../../../../src/main/collectors/events/ElementsCollector";

const forceConfigOverride = true

describe('Elements events dispatched and elements collected - Unmasked value feature tests: ', function () {
    beforeEach(function() {
        const elementEvents = this.systemBootstrapper.getFeatureBuilder()._features.list.ElementEvents.instance;

        if (this._updateFeatureConfigSpy) {
            this._updateFeatureConfigSpy.restore();
        }

        this._updateFeatureConfigSpy = sinon.spy(elementEvents, 'updateFeatureConfig');

        // Modify the configuration before the scenario
        ConfigurationChanger.change(this.systemBootstrapper, {
            isElementsEvent: true,
            enableUnmaskedValues: true,
            allowedUnmaskedValuesList: ['ok', 'save']
        }, forceConfigOverride);
    });

    after(function () {
        if (this._updateFeatureConfigSpy) {
            this._updateFeatureConfigSpy.restore();
        }
    });

    it('Unmasked value feature disabled', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

        ConfigurationChanger.change(this.systemBootstrapper, {
            enableUnmaskedValues: false,
        }, forceConfigOverride);

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

        //create ok button with hierarchy of tags
        const okValue = document.createTextNode("ok");
        const okItag = document.createElement('i');
        okItag.setAttribute('id', '1.1.1');
        okItag.appendChild(okValue);

        const okBtag = document.createElement('b');
        okBtag.setAttribute('id', '1.1');
        okBtag.appendChild(okItag);

        const okbutton = document.createElement('button');
        okbutton.setAttribute('id', '1');

        okbutton.className = "waves-effect waves-light btn";
        okbutton.appendChild(okBtag);
        document.body.appendChild(okbutton);
        ////

        const e = document.createEvent('MouseEvent');
        e.initEvent('click', true, true);

        await TestUtils.waitForNoAssertion(() => {
            assert.exists(document.getElementById('1'));
            assert.equal(true, confirmMutation, "Failed to receive mutation notification");
            observer.disconnect();
        });
        var eventElement = document.getElementById('1');
        eventElement.dispatchEvent(e);

        await TestUtils.waitForNoAssertion(() => {
            TestUtils.verifyCallHappened(serverWorkerSendAsync, 'element_events', 'click element event', function (data) {
                assert.equal(data[ElementEventStructure.indexOf('eventType') + 1], ElementEventType.click,
                    'event type is not click');
            });
        });

        await TestUtils.waitForNoAssertion(() => {
            TestUtils.verifyCallHappened(serverWorkerSendAsync, 'elements', 'first elements set', function (data) {
                assert.equal(data[ElementStructure.indexOf('id') + 1], '1', 'expected to be 1');
                assert.equal(data[ElementStructure.indexOf('elementValue') + 1], 'aa');
                assert.equal(data[ElementStructure.indexOf('unmaskedElementValue') + 1], '', 'expected to be \'\'');
            });
        });

        serverWorkerSendAsync.resetHistory();
    });

    it('Unmasked value feature enabled, Element event dispatched on element ', async function () {
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

        //create ok button with hierarchy of tags
        const okValue = document.createTextNode("ok");
        const okItag = document.createElement('i');
        okItag.setAttribute('id', '2.1.1');
        okItag.appendChild(okValue);

        const okBtag = document.createElement('b');
        okBtag.setAttribute('id', '2.1');
        okBtag.appendChild(okItag);

        const okbutton = document.createElement('button');
        okbutton.setAttribute('id', '2');
        okbutton.className = "waves-effect waves-light btn";
        okbutton.appendChild(okBtag);
        document.body.appendChild(okbutton);
        ////

        const e = document.createEvent('MouseEvent');
        e.initEvent('click', true, true);

        await TestUtils.waitForNoAssertion(() => {
            assert.exists(document.getElementById('2'));
            assert.equal(true, confirmMutation, "Failed to receive mutation notification");
            observer.disconnect();
        });
        var eventElement = document.getElementById('2');
        eventElement.dispatchEvent(e);

        await TestUtils.waitForNoAssertion(() => {
            TestUtils.verifyCallHappened(serverWorkerSendAsync, 'element_events', 'click element event', function (data) {
                assert.equal(data[ElementEventStructure.indexOf('eventType') + 1], ElementEventType.click,
                    'event type is not click');
            });
        });

        await TestUtils.waitForNoAssertion(() => {
            TestUtils.verifyCallHappened(serverWorkerSendAsync, 'elements', 'first elements set', function (data) {
                assert.equal(data[ElementStructure.indexOf('id') + 1], '2', 'expected to be 2');
                assert.equal(data[ElementStructure.indexOf('elementValue') + 1], 'aa');
                assert.equal(data[ElementStructure.indexOf('unmaskedElementValue') + 1], 'ok', 'expected to be \'ok\'');
            });
        });

        serverWorkerSendAsync.resetHistory();
    });

    it('Unmasked value feature enabled, Element event dispatched on inner tag', async function () {
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

        //create ok button with hierarchy of tags
        const okValue = document.createTextNode("ok");
        const okItag = document.createElement('i');
        okItag.setAttribute('id', '3.1.1');
        okItag.appendChild(okValue);

        const okBtag = document.createElement('b');
        okBtag.setAttribute('id', '3.1');
        okBtag.appendChild(okItag);
        const okbutton = document.createElement('button');
        okbutton.setAttribute('id', '3');

        okbutton.className = "waves-effect waves-light btn";
        okbutton.appendChild(okBtag);
        document.body.appendChild(okbutton);
        ////

        const e = document.createEvent('MouseEvent');
        e.initEvent('click', true, true);

        await TestUtils.waitForNoAssertion(() => {
            assert.exists(document.getElementById('3.1.1'));
            assert.equal(true, confirmMutation, "Failed to receive mutation notification");
            observer.disconnect();
        });

        var eventElement = document.getElementById('3.1.1');
        eventElement.dispatchEvent(e);

        await TestUtils.waitForNoAssertion(() => {
            TestUtils.verifyCallHappened(serverWorkerSendAsync, 'element_events', 'click element event', function (data) {
                assert.equal(data[ElementEventStructure.indexOf('eventType') + 1], ElementEventType.click,
                    'event type is not click');
            });
        });

        let verifiedOnce = 0;
        await TestUtils.waitForNoAssertion(() => {
            TestUtils.verifyCallHappened(serverWorkerSendAsync, 'elements', 'first elements set', function (data) {
                verifiedOnce++;
                if (verifiedOnce == 1) {
                    assert.equal(data[ElementStructure.indexOf('id') + 1], '3.1.1', 'expected to be 3.1.1');
                }
                assert.equal(data[ElementStructure.indexOf('elementValue') + 1], 'aa');
                assert.equal(data[ElementStructure.indexOf('unmaskedElementValue') + 1], 'ok', 'expected to \'ok\'');
            });
        });

        serverWorkerSendAsync.resetHistory();
    });

    it('Unmasked value feature enabled but allowedUnmaskedValues list empty', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

        ConfigurationChanger.change(this.systemBootstrapper, {
            enableUnmaskedValues: true,
            allowedUnmaskedValuesList: []
        }, forceConfigOverride);

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

        //create ok button with hierarchy of tags
        const okValue = document.createTextNode("ok");
        const okItag = document.createElement('i');
        okItag.setAttribute('id', '4.1.1');
        okItag.appendChild(okValue);

        const okBtag = document.createElement('b');
        okBtag.setAttribute('id', '4.1');
        okBtag.appendChild(okItag);

        const okbutton = document.createElement('button');
        okbutton.setAttribute('id', '4');

        okbutton.className = "waves-effect waves-light btn";
        okbutton.appendChild(okBtag);
        document.body.appendChild(okbutton);
        ////

        const e = document.createEvent('MouseEvent');
        e.initEvent('click', true, true);

        await TestUtils.waitForNoAssertion(() => {
            assert.exists(document.getElementById('4'));
            assert.equal(true, confirmMutation, "Failed to receive mutation notification");
            observer.disconnect();
        });
        var eventElement = document.getElementById('4');
        eventElement.dispatchEvent(e);

        await TestUtils.waitForNoAssertion(() => {
            TestUtils.verifyCallHappened(serverWorkerSendAsync, 'element_events', 'click element event', function (data) {

                assert.equal(data[ElementEventStructure.indexOf('eventType') + 1], ElementEventType.click,
                    'event type is not click');
            });
        });

        await TestUtils.waitForNoAssertion(() => {
            TestUtils.verifyCallHappened(serverWorkerSendAsync, 'elements', 'first elements set', function (data) {
                assert.equal(data[ElementStructure.indexOf('id') + 1], '4', 'expected to be 4');
                assert.equal(data[ElementStructure.indexOf('elementValue') + 1], 'aa');
                assert.equal(data[ElementStructure.indexOf('unmaskedElementValue') + 1], '', 'expected to be \'\'');
            });
        });

        serverWorkerSendAsync.resetHistory();
    });

    it('Unmasked value feature enabled but allowedUnmaskedValues list null', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

        ConfigurationChanger.change(this.systemBootstrapper, {
            enableUnmaskedValues: true,
            allowedUnmaskedValuesList: null
        }, forceConfigOverride);

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

        //create ok button with hierarchy of tags
        const okValue = document.createTextNode("ok");
        const okItag = document.createElement('i');
        okItag.setAttribute('id', '5.1.1');
        okItag.appendChild(okValue);

        const okBtag = document.createElement('b');
        okBtag.setAttribute('id', '5.1');
        okBtag.appendChild(okItag);

        const okbutton = document.createElement('button');
        okbutton.setAttribute('id', '5');

        okbutton.className = "waves-effect waves-light btn";
        okbutton.appendChild(okBtag);
        document.body.appendChild(okbutton);
        ////

        const e = document.createEvent('MouseEvent');
        e.initEvent('click', true, true);

        await TestUtils.waitForNoAssertion(() => {
            assert.exists(document.getElementById('5'));
            assert.equal(true, confirmMutation, "Failed to receive mutation notification");
            observer.disconnect();
        });
        var eventElement = document.getElementById('5');
        eventElement.dispatchEvent(e);

        await TestUtils.waitForNoAssertion(() => {
            TestUtils.verifyCallHappened(serverWorkerSendAsync, 'element_events', 'click element event', function (data) {

                assert.equal(data[ElementEventStructure.indexOf('eventType') + 1], ElementEventType.click,
                    'event type is not click');
            });
        });

        await TestUtils.waitForNoAssertion(() => {
            TestUtils.verifyCallHappened(serverWorkerSendAsync, 'elements', 'first elements set', function (data) {
                assert.equal(data[ElementStructure.indexOf('id') + 1], '5', 'expected to be 5');
                assert.equal(data[ElementStructure.indexOf('elementValue') + 1], 'aa');
                assert.equal(data[ElementStructure.indexOf('unmaskedElementValue') + 1], '', 'expected to be \'\'');
            });
        });

        serverWorkerSendAsync.resetHistory();
    });

    it('Unmasked value feature enabled but allowedUnmaskedValues list undefined', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

        ConfigurationChanger.change(this.systemBootstrapper, {
            enableUnmaskedValues: true,
            allowedUnmaskedValuesList: undefined
        }, forceConfigOverride);

        // Wait for the configuration update to apply on the feature
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this._updateFeatureConfigSpy.called, 'ElementEvents updateFeatureConfig called');
        });

        serverWorkerSendAsync.resetHistory();

        let confirmMutation = false;
        const mutationCallback = () => {
            confirmMutation = true;
        };
        const observer = TestUtils.startMutation(mutationCallback, document);

        //create ok button with hierarchy of tags
        const okValue = document.createTextNode("ok");
        const okItag = document.createElement('i');
        okItag.setAttribute('id', '6.1.1');
        okItag.appendChild(okValue);

        const okBtag = document.createElement('b');
        okBtag.setAttribute('id', '6.1');
        okBtag.appendChild(okItag);

        const okbutton = document.createElement('button');
        okbutton.setAttribute('id', '6');

        okbutton.className = "waves-effect waves-light btn";
        okbutton.appendChild(okBtag);
        document.body.appendChild(okbutton);
        ////

        const e = document.createEvent('MouseEvent');
        e.initEvent('click', true, true);

        await TestUtils.waitForNoAssertion(() => {
            assert.exists(document.getElementById('6'));
            assert.equal(true, confirmMutation, "Failed to receive mutation notification");
            observer.disconnect();
        });

        const eventElement = document.getElementById('6');
        eventElement.dispatchEvent(e);

        await TestUtils.waitForNoAssertion(() => {
            TestUtils.verifyCallHappened(serverWorkerSendAsync, 'element_events', 'click element event', function (data) {

                assert.equal(data[ElementEventStructure.indexOf('eventType') + 1], ElementEventType.click,
                    'event type is not click');
            });
        });

        await TestUtils.waitForNoAssertion(() => {
            TestUtils.verifyCallHappened(serverWorkerSendAsync, 'elements', 'first elements set', function (data) {
                assert.equal(data[ElementStructure.indexOf('id') + 1], '6', 'expected to be 6');
                assert.equal(data[ElementStructure.indexOf('elementValue') + 1], 'aa');
                assert.equal(data[ElementStructure.indexOf('unmaskedElementValue') + 1], '', 'expected to be \'\'');
            });
        });

        serverWorkerSendAsync.resetHistory();
    });

    it('Unmasked value feature enabled but allowedUnmaskedValues list is set with object', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

        ConfigurationChanger.change(this.systemBootstrapper, {
            enableUnmaskedValues: true,
            allowedUnmaskedValuesList: [{"foo": "bar"}, "ok"]
        }, forceConfigOverride);

        // Wait for the configuration update to apply on the feature
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this._updateFeatureConfigSpy.called, 'ElementEvents updateFeatureConfig called');
        });

        serverWorkerSendAsync.resetHistory();

        let confirmMutation = false;
        const mutationCallback = () => {
            confirmMutation = true;
        };
        const observer = TestUtils.startMutation(mutationCallback, document);

        //create ok button with hierarchy of tags
        const okValue = document.createTextNode("ok");
        const okItag = document.createElement('i');
        okItag.setAttribute('id', '7.1.1');
        okItag.appendChild(okValue);

        const okBtag = document.createElement('b');
        okBtag.setAttribute('id', '7.1');
        okBtag.appendChild(okItag);

        const okbutton = document.createElement('button');
        okbutton.setAttribute('id', '7');

        okbutton.className = "waves-effect waves-light btn";
        okbutton.appendChild(okBtag);
        document.body.appendChild(okbutton);
        ////

        const e = document.createEvent('MouseEvent');
        e.initEvent('click', true, true);

        await TestUtils.waitForNoAssertion(() => {
            assert.exists(document.getElementById('7'));
            assert.equal(true, confirmMutation, "Failed to receive mutation notification");
            observer.disconnect();
        });

        const eventElement = document.getElementById('7');
        eventElement.dispatchEvent(e);

        await TestUtils.waitForNoAssertion(() => {
            TestUtils.verifyCallHappened(serverWorkerSendAsync, 'element_events', 'click element event', function (data) {

                assert.equal(data[ElementEventStructure.indexOf('eventType') + 1], ElementEventType.click,
                    'event type is not click');
            });
        });

        await TestUtils.waitForNoAssertion(() => {
            TestUtils.verifyCallHappened(serverWorkerSendAsync, 'elements', 'first elements set', function (data) {
                assert.equal(data[ElementStructure.indexOf('id') + 1], '7', 'expected to be 7');
                assert.equal(data[ElementStructure.indexOf('elementValue') + 1], 'aa');
                assert.equal(data[ElementStructure.indexOf('unmaskedElementValue') + 1], 'ok', 'expected to be \'ok\'');
            });
        });

        serverWorkerSendAsync.resetHistory();
    });

    it('Unmasked value feature enabled and isElementsPosition is false', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

        ConfigurationChanger.change(this.systemBootstrapper, {
            enableUnmaskedValues: true,
            allowedUnmaskedValuesList: [{"foo": "bar"}, "ok"],
            isElementsPosition: false
        }, forceConfigOverride);

        // Wait for the configuration update to apply on the feature
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this._updateFeatureConfigSpy.called, 'ElementEvents updateFeatureConfig called');
        });

        serverWorkerSendAsync.resetHistory();

        let confirmMutation = false;
        const mutationCallback = () => {
            confirmMutation = true;
        };
        const observer = TestUtils.startMutation(mutationCallback, document);

        //create ok button with hierarchy of tags
        const okValue = document.createTextNode("ok");
        const okItag = document.createElement('i');
        okItag.setAttribute('id', '8.1.1');
        okItag.appendChild(okValue);

        const okBtag = document.createElement('b');
        okBtag.setAttribute('id', '8.1');
        okBtag.appendChild(okItag);

        const okbutton = document.createElement('button');
        okbutton.setAttribute('id', '8');

        okbutton.className = "waves-effect waves-light btn";
        okbutton.appendChild(okBtag);
        document.body.appendChild(okbutton);
        ////

        const e = document.createEvent('MouseEvent');
        e.initEvent('click', true, true);

        await TestUtils.waitForNoAssertion(() => {
            assert.exists(document.getElementById('8'));
            assert.equal(true, confirmMutation, "Failed to receive mutation notification");
            observer.disconnect();
        });

        const eventElement = document.getElementById('8');
        eventElement.dispatchEvent(e);

        await TestUtils.waitForNoAssertion(() => {
            TestUtils.verifyCallHappened(serverWorkerSendAsync, 'element_events', 'click element event', function (data) {

                assert.equal(data[ElementEventStructure.indexOf('eventType') + 1], ElementEventType.click,
                    'event type is not click');
            });
        });

        await TestUtils.waitForNoAssertion(() => {
            TestUtils.verifyCallHappened(serverWorkerSendAsync, 'elements', 'first elements set', function (data) {
                assert.equal(data[ElementStructure.indexOf('id') + 1], '8', 'expected to be 8');
                assert.equal(data[ElementStructure.indexOf('elementValue') + 1], 'aa');
                assert.equal(data[ElementStructure.indexOf('unmaskedElementValue') + 1], 'ok', 'expected to be \'ok\'');
                assert.equal(data[EventStructure.indexOf('width') + 1], -1, 'expected to be -1');
                assert.equal(data[EventStructure.indexOf('height') + 1], -1, 'expected to be -1');
            });
        });

        serverWorkerSendAsync.resetHistory();
    });

    it('Unmasked value feature enabled and isElementsPosition is true', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

        ConfigurationChanger.change(this.systemBootstrapper, {
            enableUnmaskedValues: true,
            allowedUnmaskedValuesList: [{"foo": "bar"}, "ok"],
            isElementsPosition: true
        }, forceConfigOverride);

        // Wait for the configuration update to apply on the feature
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this._updateFeatureConfigSpy.called, 'ElementEvents updateFeatureConfig called');
        });

        serverWorkerSendAsync.resetHistory();

        let confirmMutation = false;
        const mutationCallback = () => {
            confirmMutation = true;
        };
        const observer = TestUtils.startMutation(mutationCallback, document);

        //create ok button with hierarchy of tags
        const okValue = document.createTextNode("ok");
        const okItag = document.createElement('i');
        okItag.setAttribute('id', '9.1.1');
        okItag.appendChild(okValue);

        const okBtag = document.createElement('b');
        okBtag.setAttribute('id', '9.1');
        okBtag.appendChild(okItag);

        const okbutton = document.createElement('button');
        okbutton.setAttribute('id', '9');

        okbutton.className = "waves-effect waves-light btn";
        okbutton.appendChild(okBtag);
        document.body.appendChild(okbutton);
        ////

        const e = document.createEvent('MouseEvent');
        e.initEvent('click', true, true);

        await TestUtils.waitForNoAssertion(() => {
            assert.exists(document.getElementById('9'));
            assert.equal(true, confirmMutation, "Failed to receive mutation notification");
            observer.disconnect();
        });

        const eventElement = document.getElementById('9');
        eventElement.dispatchEvent(e);

        await TestUtils.waitForNoAssertion(() => {
            TestUtils.verifyCallHappened(serverWorkerSendAsync, 'element_events', 'click element event', function (data) {

                assert.equal(data[ElementEventStructure.indexOf('eventType') + 1], ElementEventType.click,
                    'event type is not click');
            });
        });

        await TestUtils.waitForNoAssertion(() => {
            TestUtils.verifyCallHappened(serverWorkerSendAsync, 'elements', 'first elements set', function (data) {
                assert.equal(data[ElementStructure.indexOf('id') + 1], '9', 'expected to be 9');
                assert.equal(data[ElementStructure.indexOf('elementValue') + 1], 'aa');
                assert.equal(data[ElementStructure.indexOf('unmaskedElementValue') + 1], 'ok', 'expected to be \'ok\'');
                assert.notEqual(data[EventStructure.indexOf('width') + 1], -1, 'expected to be != -1');
                assert.notEqual(data[EventStructure.indexOf('height') + 1], -1, 'expected to be != -1');
            });
        });

        serverWorkerSendAsync.resetHistory();
    });

});
