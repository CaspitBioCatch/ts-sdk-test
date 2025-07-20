import { assert } from 'chai';
import { MasterSlaveMessage } from '../../../src/slave/MasterSlaveMessage';
import { TestUtils } from '../../TestUtils';
import TestBrowserUtils from '../../TestBrowserUtils';
import { SlaveTestUtils } from './SlaveTestUtils';
import TapEventsCollector from '../../../src/main/collectors/events/TapEventCollector';

describe('Slave - Tap event tests:', function () {
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

    beforeEach(async function () {
        const isIE = !!document.documentMode;
        if (TestBrowserUtils.isIE11(window.navigator.userAgent)
            || isIE) {
            this.skip();
            return;
        }
        this.slaveTapSuccess = false;
        const touchList = [{
            target: 9876,
            identifier: Date.now() + 1,
            pageX: 10,
            pageY: 11,
            screenX: 12,
            screenY: 13,
            clientX: 14,
            clientY: 15,
        }];

        const eventDefinitions = TapEventsCollector.getSupportedTouchEvents();

        // If there are no event definitions this is not supported by the browser so we abort at this point
        if (!eventDefinitions) {
            this.skip();
            return;
        }

        const eventObj1 = {
            identifier: 1,
            pointerId: 1, // Field is for supporting browsers which receive PointerEvents and not TouchEvents
            pointerType: 'touch', // Field is for supporting browsers which receive PointerEvents and not TouchEvents
            altKey: false,
            bubbles: true,
            cancelBubble: false,
            cancelable: true,
            changedTouches: touchList,
            ctrlKey: false,
            currentTarget: document,
            defaultPrevented: false,
            detail: 0,
            eventPhase: 2,
            isTrusted: false,
            metaKey: false,
            returnValue: true,
            shiftKey: false,
            sourceCapabilities: null,
            srcElement: document,
            target: document,
            targetTouches: touchList,
            timeStamp: 18.2003,
            touches: touchList,
            type: 'touchstart',
            view: null,
            which: 0,
        };
        const eventObj2 = {
            identifier: 1,
            pointerId: 1, // Field is for supporting browsers which receive PointerEvents and not TouchEvents
            pointerType: 'touch', // Field is for supporting browsers which receive PointerEvents and not TouchEvents
            altKey: false,
            bubbles: true,
            cancelBubble: false,
            cancelable: true,
            changedTouches: touchList,
            ctrlKey: false,
            currentTarget: document,
            defaultPrevented: false,
            detail: 0,
            eventPhase: 2,
            isTrusted: false,
            metaKey: false,
            returnValue: true,
            shiftKey: false,
            sourceCapabilities: null,
            srcElement: document,
            target: document,
            targetTouches: touchList,
            timeStamp: 19.2003,
            touches: touchList,
            type: 'touchend',
            view: null,
            which: 0,
        };
        const evt1 = new UIEvent(eventDefinitions.startEvent, eventObj1);
        evt1.changedTouches = touchList;
        evt1.targetTouches = touchList;
        evt1.touches = touchList;

        document.dispatchEvent(evt1);
        const evt2 = new UIEvent(eventDefinitions.endEvent, eventObj2);
        evt2.changedTouches = touchList;
        evt2.targetTouches = touchList;
        evt2.touches = touchList;
        document.dispatchEvent(evt2);
    });

    it('TapEvents is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (!TestBrowserUtils.isIE11(window.navigator.userAgent)
                && !TestBrowserUtils.isSafari(navigator.userAgent)) {
                if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'tap_events') {
                    this.slaveTapSuccess = true;
                }
            } else {
                this.slaveTapSuccess = true;
            }
        };
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveTapSuccess);
        });
    });

    it('timestamp is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (!TestBrowserUtils.isIE11(window.navigator.userAgent)
                && !TestBrowserUtils.isSafari(navigator.userAgent)) {
                if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'tap_events') {
                    if (msg.data.data[2] > 1574617092849) {
                        this.slaveTapSuccess = true;
                    }
                }
            } else {
                this.slaveTapSuccess = true;
            }
        };
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveTapSuccess);
        });
    });

    it('clientY is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (!TestBrowserUtils.isIE11(window.navigator.userAgent)
                && !TestBrowserUtils.isSafari(navigator.userAgent)) {
                if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'tap_events') {
                    if (msg.data.data[8] === 15) {
                        this.slaveTapSuccess = true;
                    }
                }
            } else {
                this.slaveTapSuccess = true;
            }
        };
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveTapSuccess);
        });
    });

    it('clientX is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (!TestBrowserUtils.isIE11(window.navigator.userAgent)
                && !TestBrowserUtils.isSafari(navigator.userAgent)) {
                if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'tap_events') {
                    if (msg.data.data[7] === 14) {
                        this.slaveTapSuccess = true;
                    }
                }
            } else {
                this.slaveTapSuccess = true;
            }
        };
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveTapSuccess);
        });
    });

    it('screenY is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (!TestBrowserUtils.isIE11(window.navigator.userAgent)
                && !TestBrowserUtils.isSafari(navigator.userAgent)) {
                if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'tap_events') {
                    if (msg.data.data[4] === 13) {
                        this.slaveTapSuccess = true;
                    }
                }
            } else {
                this.slaveTapSuccess = true;
            }
        };
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveTapSuccess);
        });
    });

    it('screenX is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (!TestBrowserUtils.isIE11(window.navigator.userAgent)
                && !TestBrowserUtils.isSafari(navigator.userAgent)) {
                if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'tap_events') {
                    if (msg.data.data[3] === 12) {
                        this.slaveTapSuccess = true;
                    }
                }
            } else {
                this.slaveTapSuccess = true;
            }
        };
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveTapSuccess);
        });
    });

    it('pageY is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (!TestBrowserUtils.isIE11(window.navigator.userAgent)
                && !TestBrowserUtils.isSafari(navigator.userAgent)) {
                if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'tap_events') {
                    if (msg.data.data[6] === 11) {
                        this.slaveTapSuccess = true;
                    }
                }
            } else {
                this.slaveTapSuccess = true;
            }
        };
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveTapSuccess);
        });
    });

    it('pageX is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (!TestBrowserUtils.isIE11(window.navigator.userAgent)
                && !TestBrowserUtils.isSafari(navigator.userAgent)) {
                if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'tap_events') {
                    if (msg.data.data[5] === 10) {
                        this.slaveTapSuccess = true;
                    }
                }
            } else {
                this.slaveTapSuccess = true;
            }
        };
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveTapSuccess);
        });
    });
});
