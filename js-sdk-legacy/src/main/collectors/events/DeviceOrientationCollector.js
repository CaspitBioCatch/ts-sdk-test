import DataCollector from '../DataCollector';
import Log from '../../technicalServices/log/Logger';

const featureSettings = {
    configKey: 'isDeviceOrientationEvents',
    isDefault: false,
    shouldRunPerContext: false,
    shouldRunPerSession: false,
    shouldRun: true,
    isFrameRelated: false,
    runInSlave: false,
    runInLean: false,
    runInUns: false,
    isRunning: false,
    instance: null,
};

export const DeviceOrientationType = {
    'undefined': 0,
    'portrait-primary': 1,
    'landscape-primary': 2,
    'portrait-secondary': 3,
    'landscape-secondary': 4,
};

export const EventStructure = ['eventSequence', 'timestamp', 'orientation'];

export default class DeviceOrientationCollector extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    constructor(utils, dataQ) {
        super();
        this._dataQ = dataQ;
        this._utils = utils;

        this._onDeviceOrientationEventFunc = this._onDeviceOrientationEvent.bind(this);

        if (screen.mozOrientation && screen.addEventListener) {
            this._eventTarget = screen;
            this._eventName = 'mozorientationchange';
        } else if (screen.msOrientation && screen.addEventListener) {
            this._eventTarget = screen;
            this._eventName = 'msorientationchange';
        } else {
            this._eventTarget = window;
            this._eventName = 'orientationchange';
        }
    }

    startFeature() {
        this._utils.addEventListener(this._eventTarget, this._eventName, this._onDeviceOrientationEventFunc);

        this._handleDeviceOrientationEvent(screen);
    }

    stopFeature() {
        this._utils.removeEventListener(this._eventTarget, this._eventName, this._onDeviceOrientationEventFunc);
    }

    _onDeviceOrientationEvent(e) {
        let scr;
        if (!e || !e.target) {
            scr = screen;
        } else {
            // Chrome target is window so we need to get screen out of it. Firefox target is screen so we just get the target
            scr = e.target.screen || e.target;
        }

        this._handleDeviceOrientationEvent(scr);
    }

    // Handle screen orientation event. Notice that we receive the screen object as a parameter. The reason for this is
    // that we require the screen object from the event args since it is the only one up to date with the correct orientation value (At least until FireFox fixes this behavior)
    _handleDeviceOrientationEvent(scr) {
        // Since FireFox has both mozOrientation & orientation properties but only the first one is up to date, this order of must be preserved for now...
        const orientation = scr.mozOrientation || scr.msOrientation || scr.orientation;

        // Case the browser doesn't support orientation
        if (orientation === undefined) {
            Log.debug('onDeviceOrientationEvent: Unable to find orientation data.');
            return;
        }

        // Extract the actual type
        const orientationType = orientation.type || orientation;

        const deviceOrientationType = DeviceOrientationType[orientationType];

        // In case the orientation type is unknown to us...
        if (deviceOrientationType === undefined) {
            Log.error(`onDeviceOrientationEvent: Unknown orientation ${orientationType} value.`);
            return;
        }

        if (this._lastDeviceOrientationType !== deviceOrientationType) {
            const timestamp = this.getEventTimestamp();
            const eventSeq = this._utils.StorageUtils.getAndUpdateEventSequenceNumber();
            this._lastDeviceOrientationType = deviceOrientationType;

            Log.trace(`onDeviceOrientationEvent: Orientation changed to ${deviceOrientationType} at time ${timestamp}`);

            this._dataQ.addToQueue('screen_orientation',
                this._utils.convertToArrayByMap(EventStructure,
                    {
                        eventSequence: eventSeq,
                        timestamp,
                        orientation: deviceOrientationType,
                    }));
        }
    }
}
