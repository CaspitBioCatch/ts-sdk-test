import { assert } from 'chai';
import TapEventCollector from '../../../../../src/main/collectors/events/TapEventCollector';
import ConfigurationChanger from '../../ConfigurationChanger';
import { AccelerometerEventStructure } from '../../../../../src/main/collectors/events/AccelerometerEventCollector';
import { GyroEventStructure } from '../../../../../src/main/collectors/events/AccelerometerEventCollector';
import { TestUtils } from '../../../../TestUtils';
import TestBrowserUtils from '../../../../TestBrowserUtils';
import TestEvents from '../../../../TestEvents';
import { EventStructure as TouchEventStructure } from '../../../../../src/main/collectors/events/TouchEventCollector';
import { TestLifecycleHelper } from '../../../TestLifecycleHelper';

describe('Accelerometer events tests:', function () {
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
        timeStamp: 18.2003,
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
            assert.isTrue(updateFeatureConfigSpy.called, 'Accelerometer events updateFeatureConfig function was not called');
            assert.isTrue(sensorDataQueueOnConfigUpdateSpy.called, 'Sensor Data Queue onConfigUpdate function was not called');
        });
    }

    async function waitForAccelerometerCollectorToBeActive(systemBootstrapper, sandbox) {
        const accelerometerEvents = systemBootstrapper.getFeatureBuilder()._features.list.AccelerometerEvents.instance;

        const _onAccelerometerEventSpy = sandbox.spy(accelerometerEvents, '_onAccelerometerEvent');

        // We publish an orientation event and see if the feature event handler is called.
        _onAccelerometerEventSpy.resetHistory();

        // Wait for the feature to be active
        await TestUtils.waitForNoAssertion(() => {
            TestEvents.publishMotionEvent(981, 982, 983, true, 189,
                188, 187);

            return _onAccelerometerEventSpy.calledOnce;
        });
    }

    before(function () {
        if (!window.DeviceMotionEvent || TestBrowserUtils.isIE11(navigator.userAgent)) {
            this.skip();
        }
    });

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
        const accelerometerEvents = this.systemBootstrapper.getFeatureBuilder()._features.list.AccelerometerEvents.instance;
        const sensorDataQueue = this.systemBootstrapper._sensorDataQ;

        updateFeatureConfigSpy = this.sandbox.spy(accelerometerEvents, 'updateFeatureConfig');
        sensorDataQueueOnConfigUpdateSpy = this.sandbox.spy(sensorDataQueue, 'onConfigUpdate');
    });

    afterEach(async function () {
        await changeConfiguration(this.systemBootstrapper, {
            isAccelerometerEvents: true,
            isMotionAroundTouchEnabled: false,
            isTouchEvents: false,
            isPinchZoomEvents: false,
            isMotionOnSessionStart: false,
            motionPaddingOnSessionStartMSec: 20000,
            resetSessionApiThreshold: -1,
            motionPaddingAroundTouchMSec: 3000,
        });

        if (this.sandbox) {
            this.sandbox.restore();
        }
    });

    it('Sensor events are collected successfully', async function () {
        await changeConfiguration(this.systemBootstrapper, {
            isAccelerometerEvents: true,
            isMotionAroundTouchEnabled: false,
            isPinchZoomEvents: false,
            isMotionOnSessionStart: false,
            motionPaddingOnSessionStartMSec: 20000,
            accelerometerEventsSamplePeriod: -1,
            gyroEventsSamplePeriod: -1,
        });

        // Wait for the feature to be active
        await waitForAccelerometerCollectorToBeActive(this.systemBootstrapper, this.sandbox);

        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

        serverWorkerSendAsync.resetHistory();

        TestEvents.publishMotionEvent(2.637, 0.035, -0.05, true, 194.07227567918918,
            16.578909379388982, -11.858026795157887);

        await TestUtils.waitForNoAssertion(() => {
            const accelerometerEvent = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'accelerometer_events');
            assert.exists(accelerometerEvent);

            assert.equal('accelerometer_events', accelerometerEvent.eventName, 'eventName is not accelerometer_events');
            let callData = accelerometerEvent.data;

            assert.equal(callData[AccelerometerEventStructure.indexOf('x') + 1], 2.637, 'wrong x');
            assert.equal(callData[AccelerometerEventStructure.indexOf('y') + 1], 0.035, 'wrong y');
            assert.equal(callData[AccelerometerEventStructure.indexOf('z') + 1], -0.05, 'wrong z');

            const gyroEvents = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'gyro_events');
            assert.exists(gyroEvents);
            assert.equal('gyro_events', gyroEvents.eventName, 'eventName is not gyro_events');
            callData = gyroEvents.data;
            assert.equal(callData[GyroEventStructure.indexOf('absolute') + 1], true, 'expected to be != 0');
            assert.equal(callData[GyroEventStructure.indexOf('alpha') + 1], 194.0723, 'expected to be != 0');
            assert.equal(callData[GyroEventStructure.indexOf('beta') + 1], 16.5789, 'expected to be != 0');
            assert.equal(callData[GyroEventStructure.indexOf('gamma') + 1], -11.8580, 'expected to be != 0');
        }).finally(() => {
            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
        });
    });

    describe('Sensors Around Touch Tests', function () {
        const eventDefinitions = TapEventCollector.getSupportedTouchEvents();

        beforeEach(function () {
            // If there are no event definitions this is not supported by the browser so we abort at this point
            if (TestBrowserUtils.isIE11(window.navigator.userAgent) || !eventDefinitions) {
                this.skip();
            }
        });

        it('Sensor events are collected on touch', async function () {
            await changeConfiguration(this.systemBootstrapper, {
                isAccelerometerEvents: true,
                isMotionAroundTouchEnabled: true,
                motionPaddingAroundTouchMSec: 5000,
                isTouchEvents: true,
                isPinchZoomEvents: false,
                isMotionOnSessionStart: false,
                accelerometerEventsSamplePeriod: -1,
                gyroEventsSamplePeriod: -1,
            });

            // Wait for the feature to be active
            await waitForAccelerometerCollectorToBeActive(this.systemBootstrapper, this.sandbox);

            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

            const touchStartEvent = new UIEvent(eventDefinitions.startEvent, eventObj);
            touchStartEvent.changedTouches = touchList;
            touchStartEvent.targetTouches = touchList;
            touchStartEvent.touches = touchList;

            TestEvents.publishTouchEvent(touchStartEvent);

            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy

            TestEvents.publishMotionEvent(4, -88, 0, true, -55, 5, 1);

            // Send a touchend event which should end the touch window
            const touchEndEvent = new UIEvent(eventDefinitions.endEvent, eventObj);
            touchEndEvent.changedTouches = touchList;
            touchEndEvent.targetTouches = touchList;
            touchEndEvent.touches = touchList;

            TestEvents.publishTouchEvent(touchEndEvent);

            await TestUtils.waitForNoAssertion(() => {
                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'accelerometer_events');
                assert.isNotNull(event, 'Did not find a accelerometer_events event');
                assert.equal(event.data[AccelerometerEventStructure.indexOf('x') + 1], 4, 'wrong x');
                assert.equal(event.data[AccelerometerEventStructure.indexOf('y') + 1], -88, 'wrong y');
                assert.equal(event.data[AccelerometerEventStructure.indexOf('z') + 1], 0, 'wrong z');
            });

            await TestUtils.waitForNoAssertion(() => {
                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'gyro_events');
                assert.isNotNull(event, 'Did not find a gyro_events event');
                const data = event.data;
                assert.equal(data[GyroEventStructure.indexOf('absolute') + 1], true, 'expected to be != 0');
                assert.equal(data[GyroEventStructure.indexOf('alpha') + 1], -55, 'expected to be != 0');
                assert.equal(data[GyroEventStructure.indexOf('beta') + 1], 5, 'expected to be != 0');
                assert.equal(data[GyroEventStructure.indexOf('gamma') + 1], 1, 'expected to be != 0');
            });
            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
        });

        it('Post touch sensor events are collected', async function () {
            await changeConfiguration(this.systemBootstrapper, {
                isAccelerometerEvents: true,
                isMotionAroundTouchEnabled: true,
                motionPaddingAroundTouchMSec: 5000,
                isTouchEvents: true,
                isPinchZoomEvents: false,
                isMotionOnSessionStart: false,
                accelerometerEventsSamplePeriod: -1,
                gyroEventsSamplePeriod: -1,
            });

            // Wait for the feature to be active
            await waitForAccelerometerCollectorToBeActive(this.systemBootstrapper, this.sandbox);

            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy

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

            serverWorkerSendAsync.resetHistory();

            TestEvents.publishMotionEvent(7.22224, -89.5644, 0, true, -32.654321, 1.8523, 3.01013);

            await TestUtils.waitForNoAssertion(() => {
                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'accelerometer_events');
                assert.exists(event, 'Did not find a accelerometer_events event');
                assert.equal(event.data[AccelerometerEventStructure.indexOf('x') + 1], 7.2222, 'wrong x');
                assert.equal(event.data[AccelerometerEventStructure.indexOf('y') + 1], -89.5644, 'wrong y');
                assert.equal(event.data[AccelerometerEventStructure.indexOf('z') + 1], 0, 'wrong z');
            });

            await TestUtils.waitForNoAssertion(() => {
                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'gyro_events');
                assert.exists(event, 'Did not find a gyro_events event');
                assert.equal(event.data[GyroEventStructure.indexOf('absolute') + 1], true, 'expected to be != 0');
                assert.equal(event.data[GyroEventStructure.indexOf('alpha') + 1], -32.6543, 'expected to be != 0');
                assert.equal(event.data[GyroEventStructure.indexOf('beta') + 1], 1.8523, 'expected to be != 0');
                assert.equal(event.data[GyroEventStructure.indexOf('gamma') + 1], 3.0101, 'expected to be != 0');
            });

            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
        });

        it('Pre touch sensor events are collected', async function () {
            await changeConfiguration(this.systemBootstrapper, {
                isAccelerometerEvents: true,
                isMotionAroundTouchEnabled: true,
                motionPaddingAroundTouchMSec: 6000,
                isTouchEvents: true,
                isPinchZoomEvents: false,
                isMotionOnSessionStart: false,
                accelerometerEventsSamplePeriod: -1,
                gyroEventsSamplePeriod: -1,
            });

            // Wait for the feature to be active
            await waitForAccelerometerCollectorToBeActive(this.systemBootstrapper, this.sandbox);

            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy

            TestEvents.publishMotionEvent(1, 2, 3, true, 4, 5, 6);

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
                const event = TestUtils.findFirstEventByPredicate(serverWorkerSendAsync, 'accelerometer_events', (item) => {
                    return item.data[AccelerometerEventStructure.indexOf('x') + 1] === 1;
                });

                assert.isNotNull(event, 'Did not find a accelerometer_events event');
                assert.equal(event.data[AccelerometerEventStructure.indexOf('x') + 1], 1, 'wrong x');
                assert.equal(event.data[AccelerometerEventStructure.indexOf('y') + 1], 2, 'wrong y');
                assert.equal(event.data[AccelerometerEventStructure.indexOf('z') + 1], 3, 'wrong z');
            });

            await TestUtils.waitForNoAssertion(() => {
                const event2 = TestUtils.findFirstEventByPredicate(serverWorkerSendAsync, 'gyro_events', (item) => {
                    return item.data[GyroEventStructure.indexOf('alpha') + 1] === 4;
                });

                assert.isNotNull(event2, 'Did not find a gyro_events event');
                assert.equal(event2.data[GyroEventStructure.indexOf('absolute') + 1], true, 'expected to be != 0');
                assert.equal(event2.data[GyroEventStructure.indexOf('alpha') + 1], 4, 'expected to be != 0');
                assert.equal(event2.data[GyroEventStructure.indexOf('beta') + 1], 5, 'expected to be != 0');
                assert.equal(event2.data[GyroEventStructure.indexOf('gamma') + 1], 6, 'expected to be != 0');
            }).finally(() => {
                serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
            });
        });

        it('Post touch sensor events are not collected when threshold has passed', async function () {
            await changeConfiguration(this.systemBootstrapper, {
                isAccelerometerEvents: true,
                isMotionAroundTouchEnabled: true,
                isTouchEvents: true,
                isPinchZoomEvents: false,
                isMotionOnSessionStart: false,
                accelerometerEventsSamplePeriod: -1,
                gyroEventsSamplePeriod: -1,
            });

            // Wait for the feature to be active
            await waitForAccelerometerCollectorToBeActive(this.systemBootstrapper, this.sandbox);

            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

            // Send a touchstart event to start the tap simulation
            const touchStartEvent = new UIEvent(eventDefinitions.startEvent, eventObj);
            touchStartEvent.changedTouches = touchList;
            touchStartEvent.targetTouches = touchList;
            touchStartEvent.touches = touchList;

            TestEvents.publishTouchEvent(touchStartEvent);

            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy

            window.dispatchEvent(touchStartEvent);

            // Send a touchend event which should end the touch window
            const touchEndEvent = new UIEvent(eventDefinitions.endEvent, eventObj);
            touchEndEvent.changedTouches = touchList;
            touchEndEvent.targetTouches = touchList;
            touchEndEvent.touches = touchList;

            TestEvents.publishTouchEvent(touchEndEvent);

            await TestUtils.wait(3250); // wait for touch padding to pass

            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy

            TestEvents.publishMotionEvent(77, -84, 0, true, -55, 51, 23);

            await TestUtils.wait(1000);

            await TestUtils.waitForNoAssertion(() => {
                const latestEvent = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'accelerometer_events');

                if (latestEvent) {
                    assert.notEqual(latestEvent.data[AccelerometerEventStructure.indexOf('x') + 1], 4.76542);
                } else {
                    assert.notExists(latestEvent);
                }
            }).finally(() => {
                serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
            });
        });

        it('Pre touch sensor events are not collected when threshold has passed', async function () {
            await changeConfiguration(this.systemBootstrapper, {
                isAccelerometerEvents: true,
                isMotionAroundTouchEnabled: true,
                motionPaddingAroundTouchMSec: 3000,
                isTouchEvents: true,
                isPinchZoomEvents: false,
                isMotionOnSessionStart: false,
                accelerometerEventsSamplePeriod: -1,
                gyroEventsSamplePeriod: -1,
            });

            // Wait for the feature to be active
            await waitForAccelerometerCollectorToBeActive(this.systemBootstrapper, this.sandbox);

            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

            serverWorkerSendAsync.resetHistory();

            TestEvents.publishMotionEvent(12, -88, 0, true, -55, 5, 2);

            await TestUtils.wait(3201); // wait more than 3 sec

            // Send a touchstart event to start the tap simulation
            const touchStartEvent = new UIEvent(eventDefinitions.startEvent, eventObj);
            touchStartEvent.changedTouches = touchList;
            touchStartEvent.targetTouches = touchList;
            touchStartEvent.touches = touchList;

            TestEvents.publishTouchEvent(touchStartEvent);

            // Send a touchend event which should end the touch window
            const touchEndEvent = new UIEvent(eventDefinitions.endEvent, eventObj);
            touchEndEvent.changedTouches = touchList;
            touchEndEvent.targetTouches = touchList;
            touchEndEvent.touches = touchList;

            TestEvents.publishTouchEvent(touchEndEvent);

            await TestUtils.wait(1000);

            await TestUtils.waitForNoAssertion(() => {
                const latestEvent = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'accelerometer_events');
                if (latestEvent) {
                    assert.notEqual(latestEvent.data[AccelerometerEventStructure.indexOf('x') + 1], 12);
                } else {
                    assert.notExists(latestEvent);
                }
            }).finally(() => {
                serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
            });
        });
    });

    describe('Sensors on Session Start Tests', function () {
        it('Sensor events are collected when in start of session threshold', async function () {
            await changeConfiguration(this.systemBootstrapper, {
                isAccelerometerEvents: true,
                isMotionAroundTouchEnabled: false,
                isTouchEvents: false,
                isPinchZoomEvents: false,
                isMotionOnSessionStart: true,
                motionPaddingOnSessionStartMSec: 20000,
                resetSessionApiThreshold: -1,
                gyroEventsSamplePeriod: -1,
            });

            // Wait for the feature to be active
            await waitForAccelerometerCollectorToBeActive(this.systemBootstrapper, this.sandbox);

            await TestLifecycleHelper.startNewSession();

            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy

            TestEvents.publishMotionEvent(1.54321, -89.500, 0, true, -55.6500, 5.5555, 2.20220);
            await TestUtils.waitForNoAssertion(() => {
                let event = TestUtils.findFirstEventByPredicate(serverWorkerSendAsync, 'accelerometer_events',
                    (item) => {
                        return item.data[AccelerometerEventStructure.indexOf('x') + 1] === 1.5432;
                    });

                assert.isNotNull(event, 'Did not find a accelerometer_events event');
                assert.equal(event.data[AccelerometerEventStructure.indexOf('x') + 1], 1.5432, 'wrong x');
                assert.equal(event.data[AccelerometerEventStructure.indexOf('y') + 1], -89.500, 'wrong y');
                assert.equal(event.data[AccelerometerEventStructure.indexOf('z') + 1], 0, 'wrong z');

                event = TestUtils.findFirstEventByPredicate(serverWorkerSendAsync, 'gyro_events', (item) => {
                    return item.data[GyroEventStructure.indexOf('alpha') + 1] === -55.6500;
                });

                assert.isNotNull(event, 'Did not find a gyro_events event');
                assert.equal(event.data[GyroEventStructure.indexOf('absolute') + 1], true, 'expected to be != 0');
                assert.equal(event.data[GyroEventStructure.indexOf('alpha') + 1], -55.6500, 'expected to be != 0');
                assert.equal(event.data[GyroEventStructure.indexOf('beta') + 1], 5.5555, 'expected to be != 0');
                assert.equal(event.data[GyroEventStructure.indexOf('gamma') + 1], 2.20220, 'expected to be != 0');
            });
        });

        it('Sensor events are not collected when threshold has passed', async function () {
            await changeConfiguration(this.systemBootstrapper, {
                isAccelerometerEvents: true,
                isMotionAroundTouchEnabled: true,
                isTouchEvents: false,
                isPinchZoomEvents: false,
                isMotionOnSessionStart: true,
                motionPaddingOnSessionStartMSec: 100,
                resetSessionApiThreshold: -1,
                gyroEventsSamplePeriod: -1,
            });

            // Wait for the feature to be active
            await waitForAccelerometerCollectorToBeActive(this.systemBootstrapper, this.sandbox);

            await TestLifecycleHelper.startNewSession();

            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

            await TestUtils.wait(2000);
            serverWorkerSendAsync.resetHistory();

            TestEvents.publishMotionEvent(10.1702, -88.500, 0, true, -55.65666, 5.5555, 2.20220);

            await TestUtils.waitForNoAssertion(() => {
                const latestEvent = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'accelerometer_events');
                assert.notExists(latestEvent);
            }).finally(() => {
                serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
            });
        });

        it('Sensor events are not collected when collection on start of session is disabled', async function () {
            await changeConfiguration(this.systemBootstrapper, {
                isAccelerometerEvents: true,
                isMotionAroundTouchEnabled: true,
                motionPaddingAroundTouchMSec: 0,
                isTouchEvents: false,
                isPinchZoomEvents: false,
                isMotionOnSessionStart: false,
                accelerometerEventsSamplePeriod: -1,
                gyroEventsSamplePeriod: -1,
            });

            // Wait for the feature to be active
            await waitForAccelerometerCollectorToBeActive(this.systemBootstrapper, this.sandbox);

            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
            serverWorkerSendAsync.resetHistory();

            TestEvents.publishMotionEvent(10.1702, -88.500, 0, true, -55.65666, 5.5555, 2.20220);
            // Send a touchstart event to start the tap simulation

            await TestUtils.waitForNoAssertion(() => {
                const latestEvent = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'accelerometer_events');
                assert.notExists(latestEvent);
            }).finally(() => {
                serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
            });
        });

        it('starting a new session resets the sensor gate and collects sensor data', async function () {
            await changeConfiguration(this.systemBootstrapper, {
                isAccelerometerEvents: true,
                isTouchEvents: false,
                isMotionAroundTouchEnabled: true,
                motionPaddingAroundTouchMSec: 0,
                isPinchZoomEvents: false,
                isMotionOnSessionStart: true,
                motionPaddingOnSessionStartMSec: 2000,
                resetSessionApiThreshold: -1,
                accelerometerEventsSamplePeriod: -1,
                gyroEventsSamplePeriod: -1,
            });

            // Wait for the feature to be active
            await waitForAccelerometerCollectorToBeActive(this.systemBootstrapper, this.sandbox);

            await TestLifecycleHelper.startNewSession();

            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

            await TestUtils.wait(5000);
            serverWorkerSendAsync.resetHistory();

            TestEvents.publishMotionEvent(10.1702, -88.500, 0, true, -55.65666, 5.5555, 2.20220);

            await TestUtils.waitForNoAssertion(() => {
                const latestEvent = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'accelerometer_events');
                assert.notExists(latestEvent);
            }).finally(() => {
                serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
            });

            serverWorkerSendAsync.resetHistory();

            await TestLifecycleHelper.startNewSession();

            await TestUtils.waitForNoAssertion(() => {
                TestEvents.publishMotionEvent(-2, -89.500, 0, true, -55.6500, 5.5555, 2.20220);
                TestEvents.publishMotionEvent(2, -89.500, 0, true, -55.6500, 5.5555, 2.20220);

                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'accelerometer_events');
                assert.exists(event, 'Did not find a accelerometer_events event');
            });
        });
    });
});
