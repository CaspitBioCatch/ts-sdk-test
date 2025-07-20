import TestFeatureSupport from "../../../TestFeatureSupport";
import TestBrowserUtils from "../../../TestBrowserUtils";
import TestDomUtils from "../../../TestDomUtils";
import ConfigurationChanger from "../ConfigurationChanger";
import {assert} from "chai";
import {
    ElementEventType,
    EventStructure as ElementEventStructure
} from "../../../../src/main/collectors/events/ElementEventCollector";
import {TestUtils} from "../../../TestUtils";

describe('WebComponent tests:', function () {
    let openModeCustomElement = null;
    let openModeCustomElement2 = null;

    before(async function () {
        if (!TestFeatureSupport.isShadowAttachSupported() ||
            !TestFeatureSupport.isCustomElementsSupported() ||
            TestBrowserUtils.isIE(navigator.userAgent)) {
            this.skip();
            return;
        }

        const elementEvents = this.systemBootstrapper.getFeatureBuilder()._features.list.ElementEvents.instance;

        if (this._updateFeatureConfigSpy) {
            this._updateFeatureConfigSpy.restore();
        }

        this._updateFeatureConfigSpy = sinon.spy(elementEvents, 'updateFeatureConfig');

        // Modify the configuration before the scenario
        ConfigurationChanger.change(this.systemBootstrapper, {
            isElementsEvent: true,
            collectSelectElementBlurAndFocusEvents: true,
        });

        openModeCustomElement = TestDomUtils.createCustomElementSelect('ut-custom-element', 'open', true);
        openModeCustomElement2 = TestDomUtils.createCustomElementCheckBox('ut-custom-element2', 'open', true)
        document.body.appendChild(openModeCustomElement.customElement);
        document.body.appendChild(openModeCustomElement2.customElement);
    });

    after(function () {
        if (this._updateFeatureConfigSpy) {
            this._updateFeatureConfigSpy.restore();
        }
    });

    it('elements_events focus dropdown is received', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
        serverWorkerSendAsync.resetHistory();
        const cb = openModeCustomElement.elementShadowRoot.querySelector('select[id="select1"]');
        assert.exists(cb);
        await TestUtils.wait(200)

        const e = document.createEvent('Event');
        e.initEvent('focus', false, true);
        cb.dispatchEvent(e);

        await TestUtils.waitForNoAssertion(() => {
            TestUtils.verifyCallHappened(serverWorkerSendAsync, 'element_events', 'focus element event', function (data) {
                assert.equal(data[ElementEventStructure.indexOf('eventType') + 1], ElementEventType.focus,
                    'event type is not focus');
                assert.equal(data[ElementEventStructure.indexOf('selected') + 1], -1, 'checked should be true');
            });
        });
    });

    it('elements_events blur dropdown is received', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
        serverWorkerSendAsync.resetHistory();
        const cb = openModeCustomElement.elementShadowRoot.querySelector('select[id="select1"]');

        await TestUtils.waitForNoAssertion(() => {
            assert.exists(cb);
        });

        const e = document.createEvent('Event');
        e.initEvent('blur', false, true);
        cb.dispatchEvent(e);

        await TestUtils.waitForNoAssertion(() => {
            TestUtils.verifyCallHappened(serverWorkerSendAsync, 'element_events', 'blur element event', function (data) {
                assert.equal(data[ElementEventStructure.indexOf('eventType') + 1], ElementEventType.blur,
                    'event type is not focus');
                assert.equal(data[ElementEventStructure.indexOf('selected') + 1], -1, 'checked should be true');
            });
        });
    });

    it('elements_events change dropdown is received', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
        serverWorkerSendAsync.resetHistory();
        const cb = openModeCustomElement.elementShadowRoot.querySelector('select[id="select1"]');

        await TestUtils.waitForNoAssertion(() => {
            assert.exists(cb);
        });

        const changeEvent = document.createEvent('Event');
        changeEvent.initEvent('change', true, true);
        cb.selectedIndex = 2; // in IE the click event is enough, in the other not
        cb.dispatchEvent(changeEvent);

        await TestUtils.waitForNoAssertion(() => {
            TestUtils.verifyCallHappened(serverWorkerSendAsync, 'element_events', 'change element event', function (data) {
                assert.equal(data[ElementEventStructure.indexOf('eventType') + 1], ElementEventType.change,
                    'event type is not focus');
                assert.equal(data[ElementEventStructure.indexOf('selected') + 1], 2, 'checked should be true');
            });
        });
    });

    it('element input is received', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
        serverWorkerSendAsync.resetHistory();

        const openModeCustomElement3 = TestDomUtils.createCustomElement('ut-custom-element3', 'open', true)
        document.body.appendChild(openModeCustomElement3.customElement);

        await TestUtils.waitForNoAssertion(() => {
            TestUtils.verifyCallHappened(serverWorkerSendAsync, 'elements', 'elements ', function (data) {
                assert.equal(data[2], 'INPUT','event type is not INPUT');
                assert.equal(data[3], 'sd_input_text');
                assert.equal(data[4], 'sd_input_text');
                assert.equal(data[5], 'text');
            });
        });
    });
});