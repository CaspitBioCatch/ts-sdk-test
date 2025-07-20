import { MasterSlaveMessage } from "../../../src/slave/MasterSlaveMessage";
import { TestUtils } from "../../TestUtils";
import { assert } from "chai";
import { SlaveTestUtils } from "./SlaveTestUtils";
import TestFeatureSupport from "../../TestFeatureSupport";
import TestBrowserUtils from "../../TestBrowserUtils";
import TestDomUtils from "../../TestDomUtils";

describe('Slave - WebComponent tests:', function () {
    let openModeCustomElement = null;
    let openModeCustomElement2 = null;
    before(async function () {
        if (!TestFeatureSupport.isShadowAttachSupported() ||
            !TestFeatureSupport.isCustomElementsSupported() ||
            !TestFeatureSupport.isClipboardEventsSupported() ||
            TestBrowserUtils.isIE(navigator.userAgent)) {
            this.skip();
            return;
        }

        this.channel = new MessageChannel();
        this.slaveHandshaked = false;
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.msgType === MasterSlaveMessage.slaveHandShake) {
                this.slaveHandshaked = true;
            }
        };
        window.postMessage('CDHandShake', '*', [this.channel.port2]);
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(this.slaveHandshaked, true);
        });

        openModeCustomElement = TestDomUtils.createCustomElementSelect('ut-custom-element', 'open', true);
        openModeCustomElement2 = TestDomUtils.createCustomElementCheckBox('ut-custom-element2', 'open', true)
        document.body.appendChild(openModeCustomElement.customElement);
        document.body.appendChild(openModeCustomElement2.customElement);
    });

    it('elements_events change dropdown is received', async function () {
        let slaveWebCompSuccess = false;
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'element_events' ) {
                if (msg.data.data[3] === 4) {
                      slaveWebCompSuccess = true;
                  }
            }
        };

        await TestUtils.wait(200)

        const cb = openModeCustomElement.elementShadowRoot.querySelector('select[id="select1"]');

        const changeEvent = document.createEvent('Event');
        changeEvent.initEvent('change', true, true);
        cb.selectedIndex = 2; // in IE the click event is enough, in the other not
        cb.dispatchEvent(changeEvent);

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(slaveWebCompSuccess, true);
        });
    });
    it('elements_events focus dropdown is received', async function () {
        let slaveWebCompSuccess = false;
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'element_events' ) {
                if (msg.data.data[3] === 2) {
                    slaveWebCompSuccess = true;
                }
            }
        };

        const cb = openModeCustomElement.elementShadowRoot.querySelector('select[id="select1"]');

        const focus = document.createEvent('Event');
        focus.initEvent('focus', true, true);
        cb.dispatchEvent(focus);

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(slaveWebCompSuccess, true);
        });
    });

    it('elements_events blur dropdown is received', async function () {
        let slaveWebCompSuccess = false;
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'element_events' ) {
                if (msg.data.data[3] === 3) {
                    slaveWebCompSuccess = true;
                }
            }
        };

        const cb = openModeCustomElement.elementShadowRoot.querySelector('select[id="select1"]');

        const focus = document.createEvent('Event');
        focus.initEvent('blur', true, true);
        cb.dispatchEvent(focus);

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(slaveWebCompSuccess, true);
        });
    });

    it('elements_events click checkbox is received', async function () {
        let slaveWebCompSuccess = false;
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'element_events' ) {
                if (msg.data.data[3] === 5) {
                    slaveWebCompSuccess = true;
                }
            }
        };
        const cb = openModeCustomElement2.elementShadowRoot.querySelector('input[id="cb1"]');
        cb.click();

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(slaveWebCompSuccess, true);
        });
    });

    it('elements input is received', async function () {
        let slaveWebCompSuccess = false;
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'elements' ) {
                if (msg.data.data[3] === 'sd_input_text') {
                    slaveWebCompSuccess = true;
                }
            }
        };
        const openModeCustomElement3 = TestDomUtils.createCustomElement('ut-custom-element3', 'open', true)
        document.body.appendChild(openModeCustomElement3.customElement);

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(slaveWebCompSuccess, true);
        });
    });
});
