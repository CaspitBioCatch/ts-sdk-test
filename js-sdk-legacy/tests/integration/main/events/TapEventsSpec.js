import { assert } from 'chai';
import { WorkerCommand } from '../../../../src/main/events/WorkerCommand';
import TapEventCollector from '../../../../src/main/collectors/events/TapEventCollector';
import ConfigurationChanger from '../ConfigurationChanger';
import { TestUtils } from '../../../TestUtils';
import TestBrowserUtils from '../../../TestBrowserUtils';

describe('TapEvents tests:', function () {
    beforeEach(async function () {
        const isIE = !!document.documentMode;

        // Window events are not supported in ie10
        if (TestBrowserUtils.isIE11(window.navigator.userAgent)
            || isIE) {
            this.skip();
            return;
        }

        // If there are no event definitions this is not supported by the browser so we abort at this point
        if (!TapEventCollector.getSupportedTouchEvents()) {
            this.skip();
            return;
        }

        const tapEvents = this.systemBootstrapper.getFeatureBuilder()._features.list.TapEvents.instance;

        this._updateFeatureConfigSpy = sinon.spy(tapEvents, 'updateFeatureConfig');

        ConfigurationChanger.change(this.systemBootstrapper, {
            isTapEvents: true,
        });

        // Wait for the configuration update to apply on the feature
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this._updateFeatureConfigSpy.called, 'Tap events updateFeatureConfig function was not called');
        });
    });

    afterEach(async function () {
        ConfigurationChanger.change(this.systemBootstrapper, {
            isTapEvents: false,
        });

        if (this._updateFeatureConfigSpy) {
            // Wait for the configuration update to apply on the feature
            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this._updateFeatureConfigSpy.called, 'Tap events updateFeatureConfig function was not called');
            });

            this._updateFeatureConfigSpy.restore();
        }
    });

    it('Tap Events are collected successfully', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

        const point = {
            x: 10,
            y: 10,
        };
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

        // Send a touchstart event to start the tap simulation
        // Unable to create TouchEvent so UIEvent is the closest and we will add missing data afterwards
        const evt1 = new UIEvent(eventDefinitions.startEvent, eventObj);
        evt1.changedTouches = touchList;
        evt1.targetTouches = touchList;
        evt1.touches = touchList;

        document.dispatchEvent(evt1);

        // Send a touchend event which should cause a tap_events to be sent to the worker
        const evt2 = new UIEvent(eventDefinitions.endEvent, eventObj);
        evt2.changedTouches = touchList;
        evt2.targetTouches = touchList;
        evt2.touches = touchList;

        document.dispatchEvent(evt2);

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(WorkerCommand.sendDataCommand, serverWorkerSendAsync.lastCall.args[0], 'msg is data from main failed');
            assert.equal('tap_events', serverWorkerSendAsync.lastCall.args[1].eventName, 'eventName is not tap_events');
        }).finally(() => {
            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
        });
    });

    it('Long Press Events are collected successfully', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

        const point = {
            x: 10,
            y: 10,
        };
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

        // Send another touchstart so we can start the longpress simulation
        const evt3 = new UIEvent(eventDefinitions.startEvent, eventObj);
        evt3.changedTouches = touchList;
        evt3.targetTouches = touchList;
        evt3.touches = touchList;

        document.dispatchEvent(evt3);

        // Prepare the touch end event so we can complete the long press
        const evt4 = new UIEvent(eventDefinitions.endEvent, eventObj);
        evt4.changedTouches = touchList;
        evt4.targetTouches = touchList;
        evt4.touches = touchList;

        // Wait for more then 500 ms so the tap will become a long press
        await TestUtils.wait(550);

        document.dispatchEvent(evt4);

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(WorkerCommand.sendDataCommand, serverWorkerSendAsync.lastCall.args[0], 'msg is data from main failed');
            assert.equal('longpress_events', serverWorkerSendAsync.lastCall.args[1].eventName, 'eventName is not longpress_events');
        }).finally(() => {
            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
        });
    });

    it('Touch End event does not trigger a tap event if touch start is not received', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

        const point = {
            x: 10,
            y: 10,
        };
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
            type: 'touchend',
            view: null,
            which: 0,
        };

        // Send a touchend event which should be skipped since we didn't have a touchstart
        const evt2 = new UIEvent(eventDefinitions.endEvent, eventObj);
        evt2.changedTouches = touchList;
        evt2.targetTouches = touchList;
        evt2.touches = touchList;

        document.dispatchEvent(evt2);

        await TestUtils.waitForNoAssertion(() => {
            const tapEvents = serverWorkerSendAsync.getCalls().filter((x) => {
                return x.args[0] === WorkerCommand.sendDataCommand && x.args[1].eventName === 'tap_events';
            });

            // We expect to not find any tap events
            assert.equal(tapEvents.length, 0);
        }).finally(() => {
            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
        });
    });

    it('Touch Move event is ignored if touch start is not received', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

        const point = {
            x: 10,
            y: 10,
        };
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
            type: 'touchmove',
            view: null,
            which: 0,
        };

        // Send a touchmove event which should be skipped since we didn't have a touchstart
        const evt1 = new UIEvent(eventDefinitions.moveEvent, eventObj);
        evt1.changedTouches = touchList;
        evt1.targetTouches = touchList;
        evt1.touches = touchList;

        document.dispatchEvent(evt1);

        // Send a touchend event which should be skipped since we didn't have a touchstart
        const evt2 = new UIEvent(eventDefinitions.endEvent, eventObj);
        evt2.changedTouches = touchList;
        evt2.targetTouches = touchList;
        evt2.touches = touchList;

        document.dispatchEvent(evt2);

        await TestUtils.waitForNoAssertion(() => {
            const tapEvents = serverWorkerSendAsync.getCalls().filter((x) => {
                return x.args[0] === WorkerCommand.sendDataCommand && x.args[1].eventName === 'tap_events';
            });

            // We expect to not find any tap events
            assert.equal(tapEvents.length, 0);
        }).finally(() => {
            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
        });
    });
});
