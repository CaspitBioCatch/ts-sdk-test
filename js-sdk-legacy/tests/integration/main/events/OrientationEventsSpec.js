import { assert } from 'chai';
import ConfigurationChanger from '../ConfigurationChanger';
import { EventStructure as OrientationEventStructure } from '../../../../src/main/collectors/events/OrientationEventCollector';
import { WorkerCommand } from '../../../../src/main/events/WorkerCommand';
import { TestUtils } from '../../../TestUtils';
import TestFeatureSupport from '../../../TestFeatureSupport';
import TapEventCollector from '../../../../src/main/collectors/events/TapEventCollector';
import TestBrowserUtils from '../../../TestBrowserUtils';
import TestEvents from '../../../TestEvents';
import { EventStructure as TouchEventStructure } from '../../../../src/main/collectors/events/TouchEventCollector';
import { TestLifecycleHelper } from '../../TestLifecycleHelper';

describe('Orientation events tests:', function () {
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

    const eventObj = {
        identifier: 1,
        pointerId: 1, // Field is for supporting browsers which receive PointerEvents and not TouchEvents
        pointerType: 'touch', // Field is for supporting browsers which receive PointerEvents and not TouchEvents
        altKey: false,
        bubbles: true,
        cancelBubble: false,
        cancelable: true,
        currentTarget: document,
        defaultPrevented: false,
        detail: 0,
        eventPhase: 2,
        changedTouches: touchList,
        touches: touchList,
        isTrusted: false,
        metaKey: false,
        returnValue: true,
        shiftKey: false,
        sourceCapabilities: null,
        srcElement: document,
        target: document,
        timeStamp: 11.2003,
        type: 'touchstart',
        view: null,
        which: 0,
    };

    let updateFeatureConfigSpy = null;
    let sensorDataQueueOnConfigUpdateSpy = null;

    async function changeConfiguration(systemBootstrapper, configuration) {
        ConfigurationChanger.change(systemBootstrapper, configuration);

        // Wait for the configuration update to apply on the feature
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(updateFeatureConfigSpy.called, 'Orientation events updateFeatureConfig function was not called');
            assert.isTrue(sensorDataQueueOnConfigUpdateSpy.called, 'Sensor Data Queue onConfigUpdate function was not called');
        });
    }

    async function waitForOrientationCollectorToBeActive(systemBootstrapper, sandbox) {
        const orientationEvents = systemBootstrapper.getFeatureBuilder()._features.list.OrientationEvents.instance;

        const _onOrientationEventSpy = sandbox.spy(orientationEvents, '_handleDeviceOrientationEvent');

        // We publish an orientation event and see if the feature event handler is called.
        _onOrientationEventSpy.resetHistory();

        // Wait for the feature to be active
        await TestUtils.waitForNoAssertion(() => {
            const e = new Event('deviceorientation', {});

            e.alpha = 186.52711633527;
            e.beta = -1.0925001031032;
            e.gamma = 1.1131814376816;
            e.absolute = true;
            window.dispatchEvent(e);

            return _onOrientationEventSpy.calledOnce;
        });
    }

    beforeEach(async function () {
        if (!window.DeviceMotionEvent || TestBrowserUtils.isIE11(navigator.userAgent)) {
            this.skip();
            return;
        }

        this.sandbox = sinon.createSandbox();
        const orientationEvents = this.systemBootstrapper.getFeatureBuilder()._features.list.OrientationEvents.instance;
        const sensorDataQueue = this.systemBootstrapper._sensorDataQ;

        updateFeatureConfigSpy = this.sandbox.spy(orientationEvents, 'updateFeatureConfig');
        sensorDataQueueOnConfigUpdateSpy = this.sandbox.spy(sensorDataQueue, 'onConfigUpdate');
    });

    afterEach(function () {
        if (this.sandbox) {
            this.sandbox.restore();
        }
    });

    it('Events are sent immediately to worker', async function () {
        const eventDefinitions = TapEventCollector.getSupportedTouchEvents();
        // If there are no event definitions this is not supported by the browser so we abort at this point
        if (TestBrowserUtils.isIE11(window.navigator.userAgent) || !eventDefinitions) {
            this.skip();
            return;
        }

        await changeConfiguration(this.systemBootstrapper, {
            isOrientationEvents: true,
            orientationEventsSamplePeriod: -1,
        });

        // Wait for the feature to be active
        await waitForOrientationCollectorToBeActive(this.systemBootstrapper, this.sandbox);

        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

        // Send a touchstart event to start the tap simulation
        const touchStartEvent = new UIEvent(eventDefinitions.startEvent, eventObj);
        touchStartEvent.changedTouches = touchList;
        touchStartEvent.targetTouches = touchList;
        touchStartEvent.touches = touchList;

        await TestUtils.wait(1000); // wait less than 3 sec
        TestEvents.publishTouchEvent(touchStartEvent);

        // Send a touchend event which should end the touch window
        const touchEndEvent = new UIEvent(eventDefinitions.endEvent, eventObj);
        touchEndEvent.changedTouches = touchList;
        touchEndEvent.targetTouches = touchList;
        touchEndEvent.touches = touchList;

        TestEvents.publishTouchEvent(touchEndEvent);

        const e = new Event('deviceorientation', {});

        e.alpha = 181;
        e.beta = -1;
        e.gamma = 1;
        e.absolute = true;
        serverWorkerSendAsync.resetHistory();
        window.dispatchEvent(e);

        await TestUtils.waitForNoAssertion(() => {
            const orientationEvents = serverWorkerSendAsync.getCalls().filter((item) => {
                return item.args[0] === WorkerCommand.sendDataCommand
                    && item.args[1].eventName === 'orientation_events'
                    && item.args[1].data[OrientationEventStructure.indexOf('alpha') + 1] === 181; // To make sure we get the correct item lets get real specific.
            });

            const lastOrientationEvent = orientationEvents[orientationEvents.length - 1];
            assert.exists(lastOrientationEvent, 'Unable to find an orientation event which was sent to server');

            const callData = lastOrientationEvent.args[1].data;
            assert.equal(callData[OrientationEventStructure.indexOf('absolute') + 1], true, 'expected absolute to be true');
            assert.equal(callData[OrientationEventStructure.indexOf('alpha') + 1], 181, 'expected alpha to be != 0');
            assert.equal(callData[OrientationEventStructure.indexOf('beta') + 1], -1, 'expected beta to be != 0');
            assert.equal(callData[OrientationEventStructure.indexOf('gamma') + 1], 1, 'expected gamma to be != 0');
        });
        serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
    });

    describe('Sensors Around Touch Tests', function () {
        const eventDefinitions = TapEventCollector.getSupportedTouchEvents();

        beforeEach(function () {
            // If there are no event definitions this is not supported by the browser so we abort at this point
            if (TestBrowserUtils.isIE11(window.navigator.userAgent) || !eventDefinitions) {
                this.skip();
            }
        });

        it('Post touch sensor events are collected', async function () {
            await changeConfiguration(this.systemBootstrapper, {
                isOrientationEvents: true,
                orientationEventsSamplePeriod: -1,
                isMotionAroundTouchEnabled: true,
                isTouchEvents: true,
                isPinchZoomEvents: false,
            });

            // Wait for the feature to be active
            await waitForOrientationCollectorToBeActive(this.systemBootstrapper, this.sandbox);

            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy

            // Send a touchstart event to start the tap simulation
            const evt2 = new UIEvent(eventDefinitions.startEvent, eventObj);
            evt2.changedTouches = touchList;
            evt2.targetTouches = touchList;
            evt2.touches = touchList;

            if (!TestFeatureSupport.isTouchEventsSupported() && TestFeatureSupport.isPointerEventsSupported()) {
                evt2.pointerId = 1; // Field is for supporting browsers which receive PointerEvents and not TouchEvents
                evt2.pointerType = 'touch'; // Field is for supporting browsers which receive PointerEvents and not TouchEvents
            }
            document.dispatchEvent(evt2);

            // Send a touchend event which should end the touch window
            const evt3 = new UIEvent(eventDefinitions.endEvent, eventObj);
            evt3.changedTouches = touchList;
            evt3.targetTouches = touchList;
            evt3.touches = touchList;

            if (!TestFeatureSupport.isTouchEventsSupported() && TestFeatureSupport.isPointerEventsSupported()) {
                evt2.pointerId = 1; // Field is for supporting browsers which receive PointerEvents and not TouchEvents
                evt2.pointerType = 'touch'; // Field is for supporting browsers which receive PointerEvents and not TouchEvents
            }
            document.dispatchEvent(evt3);
            await TestUtils.wait(1500); // wait less than 3 sec

            const e = new Event('deviceorientation', {});

            e.alpha = 167.52711633527;
            e.beta = -1.0925001031032;
            e.gamma = 1.1131814376816;
            e.absolute = true;
            serverWorkerSendAsync.resetHistory();
            window.dispatchEvent(e);

            await TestUtils.waitForNoAssertion(() => {
                const orientationEvents = serverWorkerSendAsync.getCalls().filter((item) => {
                    return item.args[0] === WorkerCommand.sendDataCommand
                        && item.args[1].eventName === 'orientation_events'
                        && item.args[1].data[OrientationEventStructure.indexOf('alpha') + 1] === 167.5271; // To make sure we get the correct item lets get real specific.
                });

                const lastOrientationEvent = orientationEvents[orientationEvents.length - 1];

                assert.exists(lastOrientationEvent, 'Unable to find an orientation event which was sent to server');

                const callData = lastOrientationEvent.args[1].data;
                assert.equal(callData[OrientationEventStructure.indexOf('absolute') + 1], true, 'expected absolute to be true');
                assert.equal(callData[OrientationEventStructure.indexOf('alpha') + 1], 167.5271, 'expected alpha to be != 0');
                assert.equal(callData[OrientationEventStructure.indexOf('beta') + 1], -1.0925, 'expected beta to be != 0');
                assert.equal(callData[OrientationEventStructure.indexOf('gamma') + 1], 1.1132, 'expected gamma to be != 0');
            });
            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
        });

        it('Pre touch sensor events are collected', async function () {
            await changeConfiguration(this.systemBootstrapper, {
                isOrientationEvents: true,
                orientationEventsSamplePeriod: -1,
                isMotionAroundTouchEnabled: true,
                motionPaddingAroundTouchMSec: 6000,
                isTouchEvents: true,
                isPinchZoomEvents: false,
                isMotionOnSessionStart: false,
            });

            // Wait for the feature to be active
            await waitForOrientationCollectorToBeActive(this.systemBootstrapper, this.sandbox);

            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy

            TestEvents.publishDeviceOrientationEvent(12, -1, 1, true);

            // Send a touchstart event to start the tap simulation
            const touchStartEvent = new UIEvent(eventDefinitions.startEvent, eventObj);
            touchStartEvent.changedTouches = touchList;
            touchStartEvent.targetTouches = touchList;
            touchStartEvent.touches = touchList;

            await TestUtils.wait(1000); // wait less than 3 sec
            TestEvents.publishTouchEvent(touchStartEvent);

            // Make sure we processed the touch start event
            await TestUtils.waitForEvent(serverWorkerSendAsync, 'touch_events', (event) => {
                assert.exists(event);
                assert.equal(event.data[TouchEventStructure.indexOf('eventType') + 1], 0);
            });

            // Send a touchend event which should end the touch window
            const touchEndEvent = new UIEvent(eventDefinitions.endEvent, eventObj);
            touchEndEvent.changedTouches = touchList;
            touchEndEvent.targetTouches = touchList;
            touchEndEvent.touches = touchList;

            TestEvents.publishTouchEvent(touchEndEvent);

            // Make sure we processed the touch end event
            await TestUtils.waitForEvent(serverWorkerSendAsync, 'touch_events', (event) => {
                assert.exists(event);
                assert.equal(event.data[TouchEventStructure.indexOf('eventType') + 1], 2);
            });

            await TestUtils.waitForNoAssertion(() => {
                const lastOrientationEvent = TestUtils.findFirstEventByPredicate(serverWorkerSendAsync, 'orientation_events',
                    (item) => {
                        return item.data[OrientationEventStructure.indexOf('alpha') + 1] === 12;
                    });

                assert.exists(lastOrientationEvent, 'Unable to find an orientation event which was sent to server');

                const callData = lastOrientationEvent.data;
                assert.equal(callData[OrientationEventStructure.indexOf('absolute') + 1], true, 'expected absolute to be true');
                assert.equal(callData[OrientationEventStructure.indexOf('alpha') + 1], 12, 'expected alpha to be != 0');
                assert.equal(callData[OrientationEventStructure.indexOf('beta') + 1], -1, 'expected beta to be != 0');
                assert.equal(callData[OrientationEventStructure.indexOf('gamma') + 1], 1, 'expected gamma to be != 0');
            }).finally(() => {
                serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
            });
        });

        it('Post touch sensor events are not collected when threshold has passed', async function () {
            await changeConfiguration(this.systemBootstrapper, {
                isOrientationEvents: true,
                orientationEventsSamplePeriod: -1,
                isMotionAroundTouchEnabled: true,
                isTouchEvents: true,
                isPinchZoomEvents: false,
                isMotionOnSessionStart: false,
                motionPaddingAroundTouchMSec: 3000,
            });

            // Wait for the feature to be active
            await waitForOrientationCollectorToBeActive(this.systemBootstrapper, this.sandbox);

            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy

            // Send a touchstart event to start the tap simulation
            const evt2 = new UIEvent(eventDefinitions.startEvent, eventObj);
            evt2.changedTouches = touchList;
            evt2.targetTouches = touchList;
            evt2.touches = touchList;

            if (!TestFeatureSupport.isTouchEventsSupported() && TestFeatureSupport.isPointerEventsSupported()) {
                evt2.pointerId = 1; // Field is for supporting browsers which receive PointerEvents and not TouchEvents
                evt2.pointerType = 'touch'; // Field is for supporting browsers which receive PointerEvents and not TouchEvents
            }
            await TestUtils.wait(3050); // wait more than 3 sec
            window.dispatchEvent(evt2);

            // Send a touchend event which should end the touch window
            const evt3 = new UIEvent(eventDefinitions.endEvent, eventObj);
            evt3.changedTouches = touchList;
            evt3.targetTouches = touchList;
            evt3.touches = touchList;

            if (!TestFeatureSupport.isTouchEventsSupported() && TestFeatureSupport.isPointerEventsSupported()) {
                evt2.pointerId = 1; // Field is for supporting browsers which receive PointerEvents and not TouchEvents
                evt2.pointerType = 'touch'; // Field is for supporting browsers which receive PointerEvents and not TouchEvents
            }
            window.dispatchEvent(evt3);
            await TestUtils.wait(3001);

            const e = new Event('deviceorientation', {});

            e.alpha = 155;
            e.beta = -12;
            e.gamma = 11;
            e.absolute = true;
            serverWorkerSendAsync.resetHistory();
            window.dispatchEvent(e);

            const calls = TestUtils.findAllEventsByName(serverWorkerSendAsync, 'orientation_events');
            let isOrientationEventsHappened = false;
            for (let i = 0; i < calls.length; i++) {
                if (calls[i].data[OrientationEventStructure.indexOf('alpha') + 1] === 155) {
                    isOrientationEventsHappened = true;
                }
            }

            assert.isNotTrue(isOrientationEventsHappened, 'orientation_events sent to the queue');

            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
        });

        it('Pre touch sensor events are not collected when threshold has passed', async function () {
            await changeConfiguration(this.systemBootstrapper, {
                isOrientationEvents: true,
                orientationEventsSamplePeriod: -1,
                isMotionAroundTouchEnabled: true,
            });

            // Wait for the feature to be active
            await waitForOrientationCollectorToBeActive(this.systemBootstrapper, this.sandbox);``

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

            const eventObj = {
                identifier: 1,
                pointerId: 1, // Field is for supporting browsers which receive PointerEvents and not TouchEvents
                pointerType: 'touch', // Field is for supporting browsers which receive PointerEvents and not TouchEvents
                altKey: false,
                bubbles: true,
                cancelBubble: false,
                cancelable: true,
                currentTarget: document,
                defaultPrevented: false,
                detail: 0,
                eventPhase: 2,
                changedTouches: touchList,
                touches: touchList,
                isTrusted: false,
                metaKey: false,
                returnValue: true,
                shiftKey: false,
                sourceCapabilities: null,
                srcElement: document,
                target: document,
                timeStamp: 25.2003,
                type: 'touchstart',
                view: null,
                which: 0,
            };

            const e = new Event('deviceorientation', {});

            e.alpha = 112.52711633527;
            e.beta = -1.0925001031032;
            e.gamma = 1.1131814376816;
            e.absolute = true;
            serverWorkerSendAsync.resetHistory();
            await TestUtils.wait(3601); // wait more than 3 sec
            window.dispatchEvent(e);

            // Send a touchstart event to start the tap simulation
            const evt2 = new UIEvent(eventDefinitions.startEvent, eventObj);
            evt2.changedTouches = touchList;
            evt2.targetTouches = touchList;
            evt2.touches = touchList;

            if (!TestFeatureSupport.isTouchEventsSupported() && TestFeatureSupport.isPointerEventsSupported()) {
                evt2.pointerId = 1; // Field is for supporting browsers which receive PointerEvents and not TouchEvents
                evt2.pointerType = 'touch'; // Field is for supporting browsers which receive PointerEvents and not TouchEvents
            }
            await TestUtils.wait(4001); // wait more than 3 sec
            window.dispatchEvent(evt2);

            // Send a touchend event which should end the touch window
            const evt3 = new UIEvent(eventDefinitions.endEvent, eventObj);
            evt3.changedTouches = touchList;
            evt3.targetTouches = touchList;
            evt3.touches = touchList;

            if (!TestFeatureSupport.isTouchEventsSupported() && TestFeatureSupport.isPointerEventsSupported()) {
                evt2.pointerId = 1; // Field is for supporting browsers which receive PointerEvents and not TouchEvents
                evt2.pointerType = 'touch'; // Field is for supporting browsers which receive PointerEvents and not TouchEvents
            }
            window.dispatchEvent(evt3);
            const calls = TestUtils.findAllEventsByName(serverWorkerSendAsync, 'orientation_events');
            let isOrientationEventsHappened = false;
            for (let i = 0; i < calls.length; i++) {
                if (calls[i].data[OrientationEventStructure.indexOf('alpha') + 1] === 112.5271) {
                    isOrientationEventsHappened = true;
                }
            }

            assert.isNotTrue(isOrientationEventsHappened, 'orientation_events sent to the queue');
            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
        });
    });

    describe('Sensors on Session Start Tests', function () {
        it('Sensor events are collected when in start of session threshold', async function () {
            await changeConfiguration(this.systemBootstrapper, {
                isOrientationEvents: true,
                orientationEventsSamplePeriod: -1,
                isMotionAroundTouchEnabled: false,
                motionPaddingAroundTouchMSec: 0,
                isTouchEvents: false,
                isPinchZoomEvents: false,
                isMotionOnSessionStart: true,
                motionPaddingOnSessionStartMSec: 20000,
                resetSessionApiThreshold: -1,
            });

            // Wait for the feature to be active
            await waitForOrientationCollectorToBeActive(this.systemBootstrapper, this.sandbox);

            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy

            await TestLifecycleHelper.startNewSession();

            TestEvents.publishDeviceOrientationEvent(183, 0, 1, true);

            await TestUtils.waitForNoAssertion(() => {
                const orientationEvents = TestUtils.findFirstEventByPredicate(serverWorkerSendAsync, 'orientation_events', (item) => {
                    return item.data[OrientationEventStructure.indexOf('alpha') + 1] === 183;
                });

                assert.exists(orientationEvents, 'Unable to find an orientation event which was sent to server');

                const callData = orientationEvents.data;
                assert.equal(callData[OrientationEventStructure.indexOf('absolute') + 1], true, 'expected absolute to be true');
                assert.equal(callData[OrientationEventStructure.indexOf('alpha') + 1], 183, 'expected alpha to be != 0');
                assert.equal(callData[OrientationEventStructure.indexOf('beta') + 1], 0, 'expected beta to be != 0');
                assert.equal(callData[OrientationEventStructure.indexOf('gamma') + 1], 1, 'expected gamma to be != 0');
            }).finally(() => {
                serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
            });
        });

        it('Sensor events are not collected when threshold has passed', async function () {
            await changeConfiguration(this.systemBootstrapper, {
                isOrientationEvents: true,
                orientationEventsSamplePeriod: -1,
                isMotionAroundTouchEnabled: true,
                motionPaddingAroundTouchMSec: 0,
                isTouchEvents: true,
                isPinchZoomEvents: false,
                isMotionOnSessionStart: true,
                motionPaddingOnSessionStartMSec: 1000,
            });

            // Wait for the feature to be active
            await waitForOrientationCollectorToBeActive(this.systemBootstrapper, this.sandbox);

            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
            await TestUtils.wait(3050); // wait more than 3 sec
            const e = new Event('deviceorientation', {});

            e.alpha = 155.52711633527;
            e.beta = -1.0925001031032;
            e.gamma = 1.1131814376816;
            e.absolute = true;
            serverWorkerSendAsync.resetHistory();
            window.dispatchEvent(e);

            const calls = TestUtils.findAllEventsByName(serverWorkerSendAsync, 'orientation_events');
            let isOrientationEventsHappened = false;
            for (let i = 0; i < calls.length; i++) {
                if (calls[i].data[OrientationEventStructure.indexOf('alpha') + 1] === 155.5271) {
                    isOrientationEventsHappened = true;
                }
            }

            assert.isNotTrue(isOrientationEventsHappened, 'orientation_events sent to the queue');

            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
        });

        it('Sensor events are not collected when collection on start of session is disabled', async function () {
            await changeConfiguration(this.systemBootstrapper, {
                isOrientationEvents: true,
                orientationEventsSamplePeriod: -1,
                isMotionAroundTouchEnabled: true,
                isTouchEvents: true,
                isPinchZoomEvents: false,
                isMotionOnSessionStart: false,
            });

            // Wait for the feature to be active
            await waitForOrientationCollectorToBeActive(this.systemBootstrapper, this.sandbox);

            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
            const e = new Event('deviceorientation', {});

            e.alpha = 155.52711633527;
            e.beta = -1.0925001031032;
            e.gamma = 1.1131814376816;
            e.absolute = true;
            serverWorkerSendAsync.resetHistory();
            window.dispatchEvent(e);

            const calls = TestUtils.findAllEventsByName(serverWorkerSendAsync, 'orientation_events');
            let isOrientationEventsHappened = false;
            for (let i = 0; i < calls.length; i++) {
                if (calls[i].data[OrientationEventStructure.indexOf('alpha') + 1] === 155.5271) {
                    isOrientationEventsHappened = true;
                }
            }

            assert.isNotTrue(isOrientationEventsHappened, 'orientation_events sent to the queue');

            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
        });

        it('starting a new session resets the sensor gate and collects sensor data', async function () {
            await changeConfiguration(this.systemBootstrapper, {
                isOrientationEvents: true,
                orientationEventsSamplePeriod: -1,
                isMotionAroundTouchEnabled: true,
                motionPaddingAroundTouchMSec: 0,
                isTouchEvents: false,
                isPinchZoomEvents: false,
                isMotionOnSessionStart: true,
                motionPaddingOnSessionStartMSec: 2000,
                resetSessionApiThreshold: -1,
            });

            await TestLifecycleHelper.startNewSession();

            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

            await TestUtils.wait(5000);
            serverWorkerSendAsync.resetHistory();

            TestEvents.publishDeviceOrientationEvent(183, 0, 1, true);

            await TestUtils.waitForNoAssertion(() => {
                const latestEvent = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'orientation_events');
                assert.notExists(latestEvent);
            }).finally(() => {
                serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
            });

            serverWorkerSendAsync.resetHistory();

            await TestLifecycleHelper.startNewSession();

            await TestUtils.waitForNoAssertion(() => {
                TestEvents.publishDeviceOrientationEvent(121, 1, 2, true);
                TestEvents.publishDeviceOrientationEvent(-121, 1, 2, true);

                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'orientation_events');
                assert.exists(event, 'Did not find a orientation_events event');
            });
        });
    });
});
