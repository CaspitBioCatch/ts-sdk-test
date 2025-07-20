import { assert } from 'chai';
import { TestUtils } from '../../TestUtils';
import { MasterSlaveMessage } from '../../../src/slave/MasterSlaveMessage';
import TestFeatureSupport from '../../TestFeatureSupport';
import TestBrowserUtils from '../../TestBrowserUtils';
import { SlaveTestUtils } from './SlaveTestUtils';

describe('Slave - Clipboard event tests:', function () {
    before(async function () {
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
    });

    beforeEach(function () {
        if (!TestFeatureSupport.isClipboardEventsSupported() || TestBrowserUtils.isIE(navigator.userAgent)) {
            this.skip();
        }

        this.slaveClipboardSuccess = false;
        const input = document.createElement('input');
        input.setAttribute('id', 'txt1');
        input.textContent = 'asdd';
        input.className = 'class-name-txt'; // set the CSS class
        document.body.appendChild(input); // put it into the DOM
    });
    afterEach(function () {
        const input = document.getElementById('txt1');

        if (input) {
            document.body.removeChild(input);
        }
    });

    it('clipboard event is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'clipboard_events') {
                this.slaveClipboardSuccess = true;
            }
        };
        const e = new Event('copy', {
            dataType: 'text/plain', data: 'copy data',
        });
        document.dispatchEvent(e);

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveClipboardSuccess);
        });
    });

    it('timestamp is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'clipboard_events') {
                if (msg.data.data[2] > 1571929134904) this.slaveClipboardSuccess = true;
            }
        };

        const e = new Event('copy', {
            dataType: 'text/plain', data: 'copy data',
        });
        document.dispatchEvent(e);

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveClipboardSuccess);
        });
    });

    it('copy is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'clipboard_events') {
                if (msg.data.data[3] === 0) this.slaveClipboardSuccess = true;
            }
        };
        const e = new Event('copy', {
            dataType: 'text/plain', data: 'copy data',
        });
        document.dispatchEvent(e);
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveClipboardSuccess);
        });
    });

    it('paste is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'clipboard_events') {
                if (msg.data.data[3] === 1) this.slaveClipboardSuccess = true;
            }
        };
        const e = new Event('paste', {
            dataType: 'text/plain', data: 'paste data',
        });
        document.dispatchEvent(e);
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveClipboardSuccess);
        });
    });

    it('cut is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'clipboard_events') {
                if (msg.data.data[3] === 2) this.slaveClipboardSuccess = true;
            }
        };
        const e = new Event('cut', {
            dataType: 'text/plain', data: 'cut data',
        });
        document.dispatchEvent(e);
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveClipboardSuccess);
        });
    });
});
