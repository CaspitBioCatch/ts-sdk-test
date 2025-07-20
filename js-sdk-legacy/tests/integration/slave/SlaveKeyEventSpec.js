import { assert } from 'chai';
import { MasterSlaveMessage } from '../../../src/slave/MasterSlaveMessage';
import { TestUtils } from '../../TestUtils';
import { KeyEventType } from '../../../src/main/collectors/events/KeyEventCollector';
import TestEvents from '../../TestEvents';
import TestBrowserUtils from '../../TestBrowserUtils';
import { SlaveTestUtils } from './SlaveTestUtils';

describe('Slave - Key event tests:', function () {
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
        this.slaveKeySuccess = false;
    });

    it('relativeTime is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'key_events') {
                if (msg.data.data[18] > 0) {
                    this.slaveKeySuccess = true;
                }
            }
        };
        TestEvents.publishKeyboardLegacyEvent('keydown', 'Q', 'q', '81', '0', false, false, false, '');
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });

    it('timestamp is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'key_events') {
                if (msg.data.data[2] > 1569314060566) {
                    this.slaveKeySuccess = true;
                }
            }
        };
        TestEvents.publishKeyboardLegacyEvent('keydown', 'Q', 'q', '81', '0', false, false, false, '');
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });

    it('eventSequence is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'key_events') {
                if (msg.data.data[1] >= 10) {
                    this.slaveKeySuccess = true;
                }
            }
        };
        let i = 0;
        for (i; i <= 10; i++) { // send 11 events
            TestEvents.publishKeyboardLegacyEvent('keydown', 'Q', 'q', '81', '0', false, false, false, '');
        }
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });

    it('key press is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'key_events') {
                if (msg.data.data[3] === KeyEventType.keypress) {
                    this.slaveKeySuccess = true;
                }
            }
        };
        TestEvents.publishKeyboardLegacyEvent('keypress', 'Q', 'q', '81', '0', false, false, false, '');
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });

    it('keydown is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'key_events') {
                if (msg.data.data[3] === KeyEventType.keydown) {
                    this.slaveKeySuccess = true;
                }
            }
        };
        TestEvents.publishKeyboardLegacyEvent('keydown', 'Q', 'q', '81', '0', false, false, false, '');
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });

    it('keyup is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'key_events') {
                if (msg.data.data[3] === KeyEventType.keyup) {
                    this.slaveKeySuccess = true;
                }
            }
        };
        TestEvents.publishKeyboardLegacyEvent('keyup', 'Q', 'q', '81', '0', false, false, false, '');
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });

    it('numpad as code is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'key_events') {
                if (msg.data.data[14] === 'Numpad') {
                    this.slaveKeySuccess = true;
                }
            }
        };
        TestEvents.publishKeyboardLegacyEvent('keyup', 'Q', '8', '104', '0', false, false, false, 'Numpad8');
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });

    it('location is received', async function () {
        let unknown = false;
        let right = false;
        let left = false;
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'key_events') {
                if (msg.data.data[13] === 0) {
                    unknown = true;
                }
                if (msg.data.data[13] === 1) {
                    left = true;
                }
                if (msg.data.data[13] === 2) {
                    right = true;
                }
                if (unknown && left && right) {
                    this.slaveKeySuccess = true;
                }
            }
        };

        TestEvents.publishKeyboardLegacyEvent('keydown', 'Q', 'q', '81', 0, false, false, false, '');
        TestEvents.publishKeyboardLegacyEvent('keydown', 'Q', 'q', '81', 1, false, false, false, '');
        TestEvents.publishKeyboardLegacyEvent('keydown', 'Q', 'q', '81', 2, false, false, false, '');

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });

    it('charCode as char is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'key_events') {
                const num = msg.data.data[6];
                if (num === 65) {
                    this.slaveKeySuccess = true;
                }
            }
        };
        TestEvents.publishKeyboardLegacyEvent('keypress', 'Q', 'q', '81', '0', false, false, false, '81', '81');
        // TestEvents.publishKeyboardEvent('keypress', 'Q', 'q', '81', '0', false, false, false, "81", "81");
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });

    it('charCode as num is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'key_events') {
                if (msg.data.data[6] === 49) {
                    this.slaveKeySuccess = true;
                }
            }
        };
        TestEvents.publishKeyboardLegacyEvent('keypress', 'Q', '2', '50', '0', false, false, false, '');
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });

    it('charCode as numpad is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (!TestBrowserUtils.isIE(navigator.userAgent)) {
                if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'key_events') {
                    if (msg.data.data[6] === 96) {
                        this.slaveKeySuccess = true;
                    }
                }
            } else {
                this.slaveKeySuccess = true;
            }
        };
        TestEvents.publishKeyboardLegacyEvent('keyup', '8', '8', '104', '0', false, false, false, 'Numpad8', 'Numpad8', 96);
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });

    it('key Char hash is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'key_events') {
                if (msg.data.data[15] === 'A') {
                    this.slaveKeySuccess = true;
                }
            }
        };
        TestEvents.publishKeyboardLegacyEvent('keypress', 'Q', 'q', '81', '0', false, false, false, '');
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });
    it('key num hash is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'key_events') {
                if (msg.data.data[15] === '1') {
                    this.slaveKeySuccess = true;
                }
            }
        };
        TestEvents.publishKeyboardLegacyEvent('keypress', 'Q', '3', '81', '0', false, false, false, '');
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });

    it('shift is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'key_events') {
                if (msg.data.data[10]) {
                    this.slaveKeySuccess = true;
                }
            }
        };
        TestEvents.publishKeyboardLegacyEvent('keypress', 'C', 'v', '86', '0', true, false, false, '');
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });

    it('ctrl is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'key_events') {
                if (msg.data.data[9]) {
                    this.slaveKeySuccess = true;
                }
            }
        };
        TestEvents.publishKeyboardLegacyEvent('keypress', 'C', 'c', '17', '0', false, true, false, '');
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });

    it('metaKey is received', async function () {
        if (TestBrowserUtils.isIE11(navigator.userAgent)) {
            this.skip();
        }
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'key_events') {
                if (msg.data.data[12]) {
                    this.slaveKeySuccess = true;
                }
            }
        };
        TestEvents.publishKeyboardLegacyEvent('keyup', 'C', 'c', '17', '0', false, false, true, '');
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });

    it('ctrl-c is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'key_events') {
                if (msg.data.data[8] === 0) {
                    this.slaveKeySuccess = true;
                }
            }
        };
        TestEvents.publishKeyboardLegacyEvent('keypress', 'C', 'c', '67', '0', false, true, false, '', '67', 67);
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });

    it('ctrl-v is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'key_events') {
                if (msg.data.data[8] === 1) {
                    this.slaveKeySuccess = true;
                }
            }
        };
        TestEvents.publishKeyboardLegacyEvent('keypress', 'v', 'v', 86, '1', false, true, false, '81', '81', 86);
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });

    it('ctrl-a is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'key_events') {
                if (msg.data.data[8] === 2) {
                    this.slaveKeySuccess = true;
                }
            }
        };
        TestEvents.publishKeyboardLegacyEvent('keypress', 'a', 'a', '65', '0', false, true, false, '65', '65', 65);
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });

    it('ctrl-x is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'key_events') {
                if (msg.data.data[8] === 3) {
                    this.slaveKeySuccess = true;
                }
            }
        };
        TestEvents.publishKeyboardLegacyEvent('keypress', 'x', 'x', '88', '0', false, true, false, '', '', 88);
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });

    it('ctrl-z is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'key_events') {
                if (msg.data.data[8] === 4) {
                    this.slaveKeySuccess = true;
                }
            }
        };
        TestEvents.publishKeyboardLegacyEvent('keypress', 'z', 'z', 81, '1', false, true, false, '81', '81', 90);
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });

    it('ctrl-p is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'key_events') {
                if (msg.data.data[8] === 5) {
                    this.slaveKeySuccess = true;
                }
            }
        };
        TestEvents.publishKeyboardLegacyEvent('keypress', 'p', 'p', '80', '0', false, true, false, '', '', 80);
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });

    it('ctrl-s is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'key_events') {
                if (msg.data.data[8] === 6) {
                    this.slaveKeySuccess = true;
                }
            }
        };
        TestEvents.publishKeyboardLegacyEvent('keypress', 's', 's', '83', '0', false, true, false, '', '', 83);
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });
});
