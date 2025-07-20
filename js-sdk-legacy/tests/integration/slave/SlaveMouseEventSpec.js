import { assert } from 'chai';
import { MasterSlaveMessage } from '../../../src/slave/MasterSlaveMessage';
import { TestUtils } from '../../TestUtils';
import { MouseEventType } from '../../../src/main/collectors/events/MouseEventCollector';
import TestEvents from '../../TestEvents';
import TestBrowserUtils from '../../TestBrowserUtils';
import { SlaveTestUtils } from './SlaveTestUtils';

describe('Slave - Mouse event tests:', function () {
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
        this.slaveMouseSuccess = false;
    });

    it('timestamp is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'mouse_events') {
                if (msg.data.data[2] > 1569314060566) {
                    this.slaveMouseSuccess = true;
                }
            }
        };
        TestEvents.publishMouseEvent('click', 3, 'q', 1, 0, 10, 0);
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveMouseSuccess);
        });
    });

    it('eventSequence is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'mouse_events') {
                if (msg.data.data[1] >= 10) {
                    this.slaveMouseSuccess = true;
                }
            }
        };
        let i = 0;
        for (i; i <= 10; i++) { // send 11 events
            TestEvents.publishMouseEvent('click', 1, 'q', 1, 0, 10, 0);
        }
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveMouseSuccess);
        });
    });

    it('relativeTime is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'mouse_events') {
                if (msg.data.data[16] > 0) {
                    this.slaveMouseSuccess = true;
                }
            }
        };
        TestEvents.publishMouseEvent('mousemove', 0, 'q', 0, 0, 0, 0);
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveMouseSuccess);
        });
    });

    it('mouse client x is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'mouse_events') {
                if (msg.data.data[12] === 10) {
                    this.slaveMouseSuccess = true;
                }
            }
        };
        TestEvents.publishMouseEvent('dblclick', 3, 'q', 1, 0, 10, 0);
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveMouseSuccess);
        });
    });

    it('mouse client y is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'mouse_events') {
                if (msg.data.data[13] === 12) {
                    this.slaveMouseSuccess = true;
                }
            }
        };
        TestEvents.publishMouseEvent('dblclick', 3, 'q', 0, 0, 0, 12);
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveMouseSuccess);
        });
    });

    it('mouse page x is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'mouse_events') {
                if (msg.data.data[6] !== -1) {
                    this.slaveMouseSuccess = true;
                }
            }
        };
        TestEvents.publishMouseEvent('click', 3, 'q', 100, 23, 45, 60);
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveMouseSuccess);
        });
    });

    it('mouse page x is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'mouse_events') {
                if (msg.data.data[7] !== -1) {
                    this.slaveMouseSuccess = true;
                }
            }
        };
        TestEvents.publishMouseEvent('click', 3, 'q', 100, 23, 45, 60);
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveMouseSuccess);
        });
    });

    it('mouse screen x is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'mouse_events') {
                if (msg.data.data[8] === 1) {
                    this.slaveMouseSuccess = true;
                }
            }
        };
        TestEvents.publishMouseEvent('dblclick', 3, 'q', 1, 0, 0, 0);
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveMouseSuccess);
        });
    });

    it('mouse screen y is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'mouse_events') {
                if (msg.data.data[9] === 1) {
                    this.slaveMouseSuccess = true;
                }
            }
        };
        TestEvents.publishMouseEvent('dblclick', 3, 'q', 60, 1, 0, 0);
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveMouseSuccess);
        });
    });

    it('mouse right dblclick event is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'mouse_events') {
                if (msg.data.data[3] === MouseEventType.dblclick && msg.data.data[15] === 3) { // rightclick=3
                    this.slaveMouseSuccess = true;
                }
            }
        };
        TestEvents.publishMouseEvent('dblclick', 3, 'q', 60, 0, 0, 0);
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveMouseSuccess);
        });
    });

    it('mouse left dblclick event is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'mouse_events') {
                if (msg.data.data[3] === MouseEventType.dblclick && msg.data.data[15] === 1) { // leftclick=3
                    this.slaveMouseSuccess = true;
                }
            }
        };
        TestEvents.publishMouseEvent('dblclick', 1, 'q', 60, 0, 0, 0);
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveMouseSuccess);
        });
    });

    it('mouse right click event is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'mouse_events') {
                if (msg.data.data[3] === MouseEventType.click && msg.data.data[15] === 3) {
                    this.slaveMouseSuccess = true;
                }
            }
        };
        TestEvents.publishMouseEvent('click', 3, 'q', 60, 0, 0, 0);
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveMouseSuccess);
        });
    });

    it('mouse left click event is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'mouse_events') {
                if (msg.data.data[3] === MouseEventType.click && msg.data.data[15] === 1) {
                    this.slaveMouseSuccess = true;
                }
            }
        };
        TestEvents.publishMouseEvent('click', 1, 'q', 60, 0, 0, 0);
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveMouseSuccess);
        });
    });

    it('mouse move test event is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'mouse_events') {
                if (msg.data.data[3] === MouseEventType.mousemove) {
                    this.slaveMouseSuccess = true;
                }
            }
        };
        TestEvents.publishMouseEvent('mousemove', 0, 'q', 60, 0, 0, 0);

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveMouseSuccess);
        });
    });

    it('mouse up event is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'mouse_events') {
                if (msg.data.data[3] === MouseEventType.mouseup) {
                    this.slaveMouseSuccess = true;
                }
            }
        };
        TestEvents.publishMouseEvent('mouseup', 0, 'q', 60, 0, 0, 0);
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveMouseSuccess);
        });
    });

    it('mouse down event is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'mouse_events') {
                if (msg.data.data[3] === MouseEventType.mousedown) {
                    this.slaveMouseSuccess = true;
                }
            }
        };
        TestEvents.publishMouseEvent('mousedown', 0, 'q', 60, 0, 0, 0);

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveMouseSuccess);
        });
    });

    it('mouse leave event is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (!TestBrowserUtils.isEdge(window.navigator.userAgent)
                && !TestBrowserUtils.isIE11(window.navigator.userAgent)) {
                if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'mouse_events') {
                    if (msg.data.data[3] === MouseEventType.mouseleave) {
                        this.slaveMouseSuccess = true;
                    }
                }
            } else {
                this.slaveMouseSuccess = true;
            }
        };
        TestEvents.publishMouseEvent('mouseleave', 0, 'q', 60, 0, 0, 0);
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveMouseSuccess);
        });
    });

    it('mouse enter event is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (!TestBrowserUtils.isEdge(window.navigator.userAgent)
                && !TestBrowserUtils.isIE11(window.navigator.userAgent)) {
                if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'mouse_events') {
                    if (msg.data.data[3] === MouseEventType.mouseenter) {
                        this.slaveMouseSuccess = true;
                    }
                }
            } else {
                this.slaveMouseSuccess = true;
            }
        };
        TestEvents.publishMouseEvent('mouseenter', 0, 'q', 60, 0, 0, 0);

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveMouseSuccess);
        });
    });

    it('wheel event is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'mouse_events') {
                if (msg.data.data[3] === MouseEventType.wheel) {
                    this.slaveMouseSuccess = true;
                }
            }
        };
        TestEvents.publishMouseEvent('wheel', 4, 'q', 60, 0, 0, 0);

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveMouseSuccess);
        });
    });

    it('mouse enter event + mouse move event + click event scenario is received', async function () {
        let slaveMouseEnter = false;
        let slaveMouseMove = false;
        let slaveMouseClick = false;
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (!TestBrowserUtils.isEdge(window.navigator.userAgent)
                && !TestBrowserUtils.isIE11(window.navigator.userAgent)) {
                if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'mouse_events') {
                    if (msg.data.data[3] === MouseEventType.mouseenter) {
                        slaveMouseEnter = true;
                    }
                    if (msg.data.data[3] === MouseEventType.mousemove) {
                        slaveMouseMove = true;
                    }
                    if (msg.data.data[3] === MouseEventType.click) {
                        slaveMouseClick = true;
                    }
                    if (slaveMouseEnter && slaveMouseMove && slaveMouseClick) {
                        this.slaveMouseSuccess = true;
                    }
                }
            } else {
                this.slaveMouseSuccess = true;
            }
        };
        TestEvents.publishMouseEvent('mouseenter', 0, 'q', 60, 0, 0, 0);
        TestEvents.publishMouseEvent('mousemove', 0, 'q', 60, 0, 0, 0);
        TestEvents.publishMouseEvent('click', 3, 'q', 60, 0, 0, 0);
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveMouseSuccess);
        });
    });

    it('mouse down event + mouse up event + dblclick event scenario is received', async function () {
        let slaveMouseDown = false;
        let slaveMouseMoveUp = false;
        let slaveMousedblClick = false;
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'mouse_events') {
                if (msg.data.data[3] === MouseEventType.mousedown) {
                    slaveMouseDown = true;
                }
                if (msg.data.data[3] === MouseEventType.mouseup) {
                    slaveMouseMoveUp = true;
                }
                if (msg.data.data[3] === MouseEventType.dblclick) {
                    slaveMousedblClick = true;
                }
                if (slaveMouseDown && slaveMouseMoveUp && slaveMousedblClick) {
                    this.slaveMouseSuccess = true;
                }
            }
        };
        TestEvents.publishMouseEvent('mousedown', 0, 'q', 60, 0, 0, 0);
        TestEvents.publishMouseEvent('mouseup', 0, 'q', 60, 0, 0, 0);
        TestEvents.publishMouseEvent('dblclick', 3, 'q', 60, 0, 0, 0);
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveMouseSuccess);
        });
    });

    it('mouse enter event + mouse up event + wheel event scenario is received', async function () {
        let slaveMouseEnter = false;
        let slaveMouseUp = false;
        let slaveWheel = false;
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (!TestBrowserUtils.isEdge(window.navigator.userAgent)
                && !TestBrowserUtils.isIE11(window.navigator.userAgent)) {
                if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'mouse_events') {
                    if (msg.data.data[3] === MouseEventType.mouseenter) {
                        slaveMouseEnter = true;
                    }
                    if (msg.data.data[3] === MouseEventType.mouseup) {
                        slaveMouseUp = true;
                    }
                    if (msg.data.data[3] === MouseEventType.wheel) {
                        slaveWheel = true;
                    }
                    if (slaveMouseEnter && slaveMouseUp && slaveWheel) {
                        this.slaveMouseSuccess = true;
                    }
                }
            } else {
                this.slaveMouseSuccess = true;
            }
        };
        TestEvents.publishMouseEvent('mouseenter', 0, 'q', 60, 0, 0, 0);
        TestEvents.publishMouseEvent('mouseup', 0, 'q', 60, 0, 0, 0);
        TestEvents.publishMouseEvent('wheel', 4, 'q', 60, 0, 0, 0);

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveMouseSuccess);
        });
    });
});
