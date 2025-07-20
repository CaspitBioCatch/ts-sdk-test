import { assert } from 'chai';
import TestBrowserUtils from '../../../TestBrowserUtils';
import TapEvents from '../../../../src/main/collectors/events/TapEventCollector';
import { TestUtils } from '../../../TestUtils';
import {EventStructure as TouchEventStructure,} from '../../../../src/main/collectors/events/TouchEventCollector';
import ConfigurationChanger from '../ConfigurationChanger';
import { ConfigurationFields } from '../../../../src/main/core/configuration/ConfigurationFields';

describe('TouchEvent tests:', function () {
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
        force: 0.8,
    }];

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

    before(async function () {
        ConfigurationChanger.change(this.systemBootstrapper, {
            isTouchEvents: true,
            // force override coordinateMasking configuration in order to confirm the actual coordinates works (without masking)
            [ConfigurationFields.enableCoordinatesMasking] : false,
        }, true);
        // Window events are not supported in ie10
        if (TestBrowserUtils.isIE11(window.navigator.userAgent)
            || TestBrowserUtils.isEdge(window.navigator.userAgent)
            || TestBrowserUtils.isSafari(window.navigator.userAgent)) {
            this.skip();
        }

        this.eventDefinitions = TapEvents.getSupportedTouchEvents();

        // If there are no event definitions this is not supported by the browser so we abort at this point
        if (!this.eventDefinitions) {
            this.skip();
        }
    });

    it('TouchEvent is received', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

        // Send a touchstart event to start the tap simulation
        const evt = new UIEvent(this.eventDefinitions.startEvent, eventObj);
        evt.changedTouches = touchList;
        evt.targetTouches = touchList;
        evt.touches = touchList;

        document.dispatchEvent(evt);
        await TestUtils.waitForNoAssertion(() => {
            if (serverWorkerSendAsync.lastCall.args[1].eventName === 'touch_events') {
                assert.equal('touch_events', serverWorkerSendAsync.lastCall.args[1].eventName, 'eventName is not touch_events');
            }
        }).finally(() => {
            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
        });
    });

    it('relativeTime is received ', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

        // Send a touchstart event to start the tap simulation
        const evt = new UIEvent(this.eventDefinitions.startEvent, eventObj);
        evt.changedTouches = touchList;
        evt.targetTouches = touchList;
        evt.touches = touchList;

        document.dispatchEvent(evt);
        await TestUtils.waitForNoAssertion(() => {
            if (serverWorkerSendAsync.lastCall.args[1].eventName === 'touch_events') {
                assert.isAbove(serverWorkerSendAsync.lastCall.args[1]
                    .data[TouchEventStructure.indexOf('relativeTime') + 1], 0, 'relativeTime is not right');
            }
        }).finally(() => {
            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
        });
    });

    it('touchstart is received ', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
        if (TestBrowserUtils.isFirefox(window.navigator.userAgent, '')) {
            const event1 = new PointerEvent('pointerdown',
                {
                    bubbles: true,
                    cancelable: true,
                    composed: true,
                    pointerId: 42,
                    pointerType: 'pen',
                    clientX: 300,
                    clientY: 500,
                });
            document.dispatchEvent(event1);
        } else {
            // Send a touchstart event to start the tap simulation
            const evt = new UIEvent(this.eventDefinitions.startEvent, eventObj);
            evt.changedTouches = touchList;
            evt.targetTouches = touchList;
            evt.touches = touchList;

            document.dispatchEvent(evt);
        }

        await TestUtils.waitForNoAssertion(() => {

            if (serverWorkerSendAsync.lastCall.args[1].eventName === 'touch_events') {
                assert.equal(serverWorkerSendAsync.lastCall.args[1]
                        .data[TouchEventStructure.indexOf('eventType') + 1],
                    0, 'event type is not touchend');
            }
        }).finally(() => {
            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
        });
    });

    it('touchmove is received ', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
        if (TestBrowserUtils.isFirefox(window.navigator.userAgent, '')) {
            const event1 = new PointerEvent('pointerover',
                {
                    bubbles: true,
                    cancelable: true,
                    composed: true,
                    pointerId: 42,
                    pointerType: 'pen',
                    clientX: 300,
                    clientY: 500,
                });
            document.dispatchEvent(event1);

            const pointerEventInitDict = {
                bubbles: true,
                cancelable: true,
                composed: true,
                pointerId: 42,
                pointerType: 'pen',
                clientX: 300,
                clientY: 500,
            };
            const p1 = new PointerEvent('pointermove', pointerEventInitDict);
            pointerEventInitDict.clientX += 10;
            const p2 = new PointerEvent('pointermove', pointerEventInitDict);
            pointerEventInitDict.coalescedEvents = [p1, p2];
            const event2 = new PointerEvent('pointermove', pointerEventInitDict);
            document.dispatchEvent(event2);
        } else {
            // Send a touchstart event to start the tap simulation
            let evt = new UIEvent(this.eventDefinitions.startEvent, eventObj);
            evt.changedTouches = touchList;
            evt.targetTouches = touchList;
            evt.touches = touchList;

            document.dispatchEvent(evt);
            eventObj.type = 'touchmove';
            evt = new UIEvent(this.eventDefinitions.moveEvent, eventObj);
            evt.changedTouches = touchList;
            evt.targetTouches = touchList;
            evt.touches = touchList;
            document.dispatchEvent(evt);
        }
        await TestUtils.waitForNoAssertion(() => {
            if (serverWorkerSendAsync.lastCall.args[1].eventName === 'touch_events') {
                assert.equal(serverWorkerSendAsync.lastCall.args[1]
                        .data[TouchEventStructure.indexOf('eventType') + 1],
                    1, 'event type is not touchend');
            }
        }).finally(() => {
            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
        });
    });

    it('touchend is received ', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
        if (TestBrowserUtils.isFirefox(window.navigator.userAgent, '')) {
            const event1 = new PointerEvent('pointerdown',
                {
                    bubbles: true,
                    cancelable: true,
                    composed: true,
                    pointerId: 42,
                    pointerType: 'pen',
                    clientX: 300,
                    clientY: 500,
                });
            document.dispatchEvent(event1);
            const event2 = new PointerEvent('pointerup',
                {
                    bubbles: true,
                    cancelable: true,
                    composed: true,
                    pointerId: 42,
                    pointerType: 'pen',
                    clientX: 300,
                    clientY: 500,
                });
            document.dispatchEvent(event2);
        } else {
            // Send a touchstart event to start the tap simulation
            let evt = new UIEvent(this.eventDefinitions.startEvent, eventObj);
            evt.changedTouches = touchList;
            evt.targetTouches = touchList;
            evt.touches = touchList;

            document.dispatchEvent(evt);
            eventObj.type = 'touchend';
            evt = new UIEvent(this.eventDefinitions.endEvent, eventObj);
            evt.changedTouches = touchList;
            evt.targetTouches = touchList;
            evt.touches = touchList;
            document.dispatchEvent(evt);
        }
        await TestUtils.waitForNoAssertion(() => {
            if (serverWorkerSendAsync.lastCall.args[1].eventName === 'touch_events') {
                assert.equal(serverWorkerSendAsync.lastCall.args[1]
                        .data[TouchEventStructure.indexOf('eventType') + 1],
                    2, 'event type is not touchend');
            }
        }).finally(() => {
            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
        });
    });

    it('touchcancel is received ', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
        if (TestBrowserUtils.isFirefox(window.navigator.userAgent, '')) {
            this.skip();
        } else {
            // Send a touchstart event to start the tap simulation
            let evt = new UIEvent(this.eventDefinitions.startEvent, eventObj);
            evt.changedTouches = touchList;
            evt.targetTouches = touchList;
            evt.touches = touchList;

            document.dispatchEvent(evt);
            eventObj.type = 'touchcancel';
            evt = new UIEvent(this.eventDefinitions.cancelEvent, eventObj);
            evt.changedTouches = touchList;
            evt.targetTouches = touchList;
            evt.touches = touchList;
            document.dispatchEvent(evt);
        }
        await TestUtils.waitForNoAssertion(() => {
            if (serverWorkerSendAsync.lastCall.args[1].eventName === 'touch_events') {
                assert.equal(serverWorkerSendAsync.lastCall.args[1]
                        .data[TouchEventStructure.indexOf('eventType') + 1],
                    3, 'event type is not touchend');
            }
        }).finally(() => {
            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
        });
    });

    it('touchPressure & client x/y  & page x/y screen x/y is received ', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

        // Send a touchstart event to start the tap simulation
        const evt = new UIEvent(this.eventDefinitions.startEvent, eventObj);
        evt.changedTouches = touchList;
        evt.targetTouches = touchList;
        evt.touches = touchList;

        document.dispatchEvent(evt);
        const data = serverWorkerSendAsync.lastCall.args[1].data;
        await TestUtils.waitForNoAssertion(() => {
            if (serverWorkerSendAsync.lastCall.args[1].eventName === 'touch_events') {
                assert.equal(data[TouchEventStructure.indexOf('touchPressure') + 1],
                    0.8, 'pressure is not received');
                assert.equal(data[TouchEventStructure.indexOf('clientX') + 1], 10, 'clientx is not right');
                assert.equal(data[TouchEventStructure.indexOf('clientY') + 1], 10, 'clienty is not right');
                assert.equal(data[TouchEventStructure.indexOf('screenY') + 1], 10, 'screeny is not right');
            }

        }).finally(() => {
            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
        });
    });
});
