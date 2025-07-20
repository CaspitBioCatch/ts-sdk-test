import { MessageBusEventType } from '../events/MessageBusEventType';

class DeviceOrientationEventEmitter {
    constructor(messageBus, EventAggregator) {
        this._messageBus = messageBus;
        this._eventAggregator = EventAggregator;
    }

    start() {
        this._eventAggregator.addEventListener(window, 'deviceorientation', this.handleDeviceOrientationEvent);
    }

    stop() {
        this._eventAggregator.removeEventListener(window, 'deviceorientation', this.handleDeviceOrientationEvent);
    }

    handleDeviceOrientationEvent = (e) => {
        this._messageBus.publish(MessageBusEventType.DeviceOrientationEvent, e);
    }
}

export default DeviceOrientationEventEmitter;
