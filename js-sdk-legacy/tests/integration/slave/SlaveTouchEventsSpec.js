import { assert } from 'chai';
import { MasterSlaveMessage } from '../../../src/slave/MasterSlaveMessage';
import { TestUtils } from '../../TestUtils';
import { TapEventCollector } from '../../../src/main/collectors/events';
import TestBrowserUtils from '../../TestBrowserUtils';
import { SlaveTestUtils } from './SlaveTestUtils';

describe('Slave - Touch event tests:', function () {
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
        if (TestBrowserUtils.isIE11(navigator.userAgent)
            || TestBrowserUtils.isSafari(navigator.userAgent)) {
            this.skip();
        }
        this.slaveTouchSuccess = false;
    });

    it('Touch is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (!TestBrowserUtils.isIE11(window.navigator.userAgent)
                && !TestBrowserUtils.isIE(navigator.userAgent)) {
                if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'touch_events') {
                    this.slaveTouchSuccess = true;
                }
            } else {
                this.slaveTouchSuccess = true;
            }
        };

        const point = { x: 10, y: 10 };
        const touchList = [{
            target: 9876,
            identifier: Date.now() + 1,
            pageX: point.x,
            pageY: point.y,
            screenX: point.x,
            screenY: point.y,
            clientX: point.x,
            clientY: point.y,
            force: 0.1,
        }];

        const eventDefinitions = TapEventCollector.getSupportedTouchEvents();

        // If there are no event definitions this is not supported by the browser so we abort at this point
        if (!eventDefinitions) {
            this.skip();
            return;
        }

        const eventObj = {
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

        const evt = new UIEvent(eventDefinitions.startEvent, eventObj);
        evt.changedTouches = touchList;
        evt.targetTouches = touchList;
        evt.touches = touchList;

        document.dispatchEvent(evt);

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveTouchSuccess);
        });
    });

    it('client x/y page x/y screen x/y is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'touch_events') {
                if (msg.data.data[6] === 14 && msg.data.data[7] === 15 && msg.data.data[11] === 10
                    && msg.data.data[12] === 11 && msg.data.data[13] === 12
                    && msg.data.data[14] === 13) this.slaveTouchSuccess = true;
            }
        };

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
        const eventDefinitions = TapEventCollector.getSupportedTouchEvents();
        // If there are no event definitions this is not supported by the browser so we abort at this point
        if (!eventDefinitions) {
            this.skip();
            return;
        }
        const eventObj = {
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
        const evt = new UIEvent(eventDefinitions.startEvent, eventObj);
        evt.changedTouches = touchList;
        evt.targetTouches = touchList;
        evt.touches = touchList;

        document.dispatchEvent(evt);

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveTouchSuccess);
        });
    });

    it('relativeTime is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'touch_events') {
                if (msg.data.data[15] > 0) this.slaveTouchSuccess = true;
            }
        };

        const point = { x: 10, y: 10 };
        const touchList = [{
            target: 9876,
            identifier: Date.now() + 1,
            pageX: point.x,
            pageY: point.y,
            screenX: point.x,
            screenY: point.y,
            clientX: point.x,
            clientY: point.y,
        }];
        const eventDefinitions = TapEventCollector.getSupportedTouchEvents();
        // If there are no event definitions this is not supported by the browser so we abort at this point
        if (!eventDefinitions) {
            this.skip();
            return;
        }
        const eventObj = {
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
        const evt = new UIEvent(eventDefinitions.startEvent, eventObj);
        evt.changedTouches = touchList;
        evt.targetTouches = touchList;
        evt.touches = touchList;

        document.dispatchEvent(evt);

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveTouchSuccess);
        });
    });

    it('touchstart is received', async function () {
        this.channel.port1.onmessage = (e) => {
            if (!!TestBrowserUtils.isIE11(window.navigator.userAgent)
                && !!TestBrowserUtils.isIE(navigator.userAgent)) {
                const msg = JSON.parse(e.data);
                if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'touch_events') {
                    if (msg.data.data[3] === 0) this.slaveTouchSuccess = true;
                }
            } else {
                this.slaveTouchSuccess = true;
            }
        };

        const touchList = [{
            target: 9876,
            identifier: Date.now() + 1,
            pageX: 10,
            pageY: 11,
            screenX: 12,
            screenY: 13,
            clientX: 14,
            clientY: 15,
            force: 0.1,
        }];
        const eventDefinitions = TapEventCollector.getSupportedTouchEvents();
        // If there are no event definitions this is not supported by the browser so we abort at this point
        if (!eventDefinitions) {
            this.skip();
            return;
        }
        const eventObj = {
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
        let evt = new UIEvent(eventDefinitions.startEvent, eventObj);
        evt.changedTouches = touchList;
        evt.targetTouches = touchList;
        evt.touches = touchList;

        document.dispatchEvent(evt);

        // Prepare the touch end event so we can complete the long press
        evt = new UIEvent(eventDefinitions.endEvent, eventObj);
        evt.changedTouches = touchList;
        evt.targetTouches = touchList;
        evt.touches = touchList;

        // Wait for more then 500 ms so the tap will become a long press
        await TestUtils.wait(550);

        document.dispatchEvent(evt);

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveTouchSuccess);
        });
    });

    it('touchend is received', async function () {
        this.channel.port1.onmessage = (e) => {
            if (!!TestBrowserUtils.isIE11(window.navigator.userAgent)
                && !!TestBrowserUtils.isIE(navigator.userAgent)) {
                const msg = JSON.parse(e.data);
                if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'touch_events') {
                    if (msg.data.data[3] === 2) this.slaveTouchSuccess = true;
                }
            } else {
                this.slaveTouchSuccess = true;
            }
        };

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
        const eventDefinitions = TapEventCollector.getSupportedTouchEvents();
        // If there are no event definitions this is not supported by the browser so we abort at this point
        if (!eventDefinitions) {
            this.skip();
            return;
        }
        const eventObj = {
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
        let evt = new UIEvent(eventDefinitions.startEvent, eventObj);
        evt.changedTouches = touchList;
        evt.targetTouches = touchList;
        evt.touches = touchList;

        document.dispatchEvent(evt);

        // Prepare the touch end event so we can complete the long press
        evt = new UIEvent(eventDefinitions.endEvent, eventObj);
        evt.changedTouches = touchList;
        evt.targetTouches = touchList;
        evt.touches = touchList;

        // Wait for more then 500 ms so the tap will become a long press
        await TestUtils.wait(550);

        document.dispatchEvent(evt);

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveTouchSuccess);
        });
    });

    it('touchPressure is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (!TestBrowserUtils.isIE11(window.navigator.userAgent)
                && !TestBrowserUtils.isIE(navigator.userAgent)) {
                if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'touch_events') {
                    if (msg.data.data[16] === 0.1) this.slaveTouchSuccess = true;
                    this.slaveTouchSuccess = true;
                }
            } else {
                this.slaveTouchSuccess = true;
            }
        };

        const point = { x: 10, y: 10 };
        const touchList = [{
            target: 9876,
            identifier: Date.now() + 1,
            pageX: point.x,
            pageY: point.y,
            screenX: point.x,
            screenY: point.y,
            clientX: point.x,
            clientY: point.y,
            force: 0.1,
        }];

        const eventDefinitions = TapEventCollector.getSupportedTouchEvents();

        // If there are no event definitions this is not supported by the browser so we abort at this point
        if (!eventDefinitions) {
            this.skip();
            return;
        }

        const eventObj = {
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

        const evt = new UIEvent(eventDefinitions.startEvent, eventObj);
        evt.changedTouches = touchList;
        evt.targetTouches = touchList;
        evt.touches = touchList;

         document.dispatchEvent(evt);

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveTouchSuccess);
        });
    });
});
