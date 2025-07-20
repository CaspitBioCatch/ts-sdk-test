import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import DeviceOrientationEventEmitter from '../../../../src/main/emitters/DeviceOrientationEventEmitter';
import EventAggregator from '../../../../src/main/system/EventAggregator';
import { MessageBusEventType } from '../../../../src/main/events/MessageBusEventType';

describe('DeviceOrientationEventEmitter Service Tests:', function () {
    const assert = chai.assert;

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();

        this._messageBus = new MessageBus();
        this._eventAggregator = EventAggregator;
        this.__deviceOrientationEventEmitter = new DeviceOrientationEventEmitter(this._messageBus, this._eventAggregator);

        this._handleDeviceOrientationEventSpy = this.sandbox.spy(this.__deviceOrientationEventEmitter, 'handleDeviceOrientationEvent');
    });

    afterEach(function () {
        this._messageBus = null;
    });

    it('Should create a new instance of DeviceOrientationEventEmitter', function () {
        assert.isObject(this.__deviceOrientationEventEmitter, 'Could not construct a new DeviceOrientationEventEmitter object');
        assert.instanceOf(this.__deviceOrientationEventEmitter._messageBus, MessageBus, '_messageBus instance is not the expected one');
    });

    it('Should emit a deviceorientation event', function () {
        this.__deviceOrientationEventEmitter.start();

        let deviceOrientationEventWasTriggered = false;
        this._messageBus.subscribe(MessageBusEventType.DeviceOrientationEvent, () => {
            deviceOrientationEventWasTriggered = true;
        });

        const e = document.createEvent('Event');
        e.initEvent('deviceorientation', true, true);
        e.alpha = 186.52711633492527;
        e.beta = -1.0925001031008132;
        e.gamma = 1.113181437681716;
        e.absolute = true;

        window.dispatchEvent(e);

        assert.isTrue(this._handleDeviceOrientationEventSpy.calledOnce);
        assert.isTrue(deviceOrientationEventWasTriggered);
    });

    it('Should emit multiple deviceorientation events', function () {
        this.__deviceOrientationEventEmitter.start(window.document);

        let deviceOrientationEventCounter = 0;
        this._messageBus.subscribe(MessageBusEventType.DeviceOrientationEvent, () => {
            deviceOrientationEventCounter++;
        });

        const e = document.createEvent('Event');
        e.initEvent('deviceorientation', true, true);
        e.alpha = 186.52711633492527;
        e.beta = -1.0925001031008132;
        e.gamma = 1.113181437681716;
        e.absolute = true;

        window.dispatchEvent(e);

        assert.isTrue(this._handleDeviceOrientationEventSpy.calledOnce);
        assert.equal(deviceOrientationEventCounter, 1);

        const e2 = document.createEvent('Event');
        e2.initEvent('deviceorientation', true, true);
        e2.alpha = 186.52711633492527;
        e2.beta = -1.0925001031008132;
        e2.gamma = 1.113181437681716;
        e2.absolute = true;

        window.dispatchEvent(e2);

        assert.isTrue(this._handleDeviceOrientationEventSpy.calledTwice);
        assert.equal(deviceOrientationEventCounter, 2);

        const e3 = document.createEvent('Event');
        e3.initEvent('deviceorientation', true, true);
        e3.alpha = 186.52711633492527;
        e3.beta = -1.0925001031008132;
        e3.gamma = 1.113181437681716;
        e3.absolute = true;

        window.dispatchEvent(e3);

        const e4 = document.createEvent('Event');
        e4.initEvent('deviceorientation', true, true);
        e4.alpha = 186.52711633492527;
        e4.beta = -1.0925001031008132;
        e4.gamma = 1.113181437681716;
        e4.absolute = true;

        window.dispatchEvent(e4);

        assert.equal(this._handleDeviceOrientationEventSpy.callCount, 4);
        assert.equal(deviceOrientationEventCounter, 4);
    });

    it('no events are emitted when emitter is stopped', function () {
        this.__deviceOrientationEventEmitter.stop(window.document);

        let copyEventCounter = 0;
        this._messageBus.subscribe(MessageBusEventType.DeviceOrientationEvent, () => {
            copyEventCounter++;
        });

        const e = document.createEvent('Event');
        e.initEvent('deviceorientation', true, true);
        e.alpha = 186.52711633492527;
        e.beta = -1.0925001031008132;
        e.gamma = 1.113181437681716;
        e.absolute = true;

        window.dispatchEvent(e);

        // No event should be raised since emitter is stopped
        assert.isTrue(this._handleDeviceOrientationEventSpy.notCalled);
        assert.equal(copyEventCounter, 0);

        this.__deviceOrientationEventEmitter.start(window.document);

        window.dispatchEvent(e);

        assert.isTrue(this._handleDeviceOrientationEventSpy.calledOnce);
        assert.equal(copyEventCounter, 1);

        // Stop emitter again to see that again events don't arrive
        this.__deviceOrientationEventEmitter.stop(window.document);

        window.dispatchEvent(e);

        assert.isTrue(this._handleDeviceOrientationEventSpy.calledOnce);
        assert.equal(copyEventCounter, 1);
    });
});
