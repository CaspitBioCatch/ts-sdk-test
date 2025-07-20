import DataCollector from '../DataCollector';
import Log from '../../technicalServices/log/Logger';
import { ConfigurationFields } from '../../core/configuration/ConfigurationFields';

// Constants for configuration and event handling
const DEFAULT_SAMPLE_PERIOD = 0;
const DEFAULT_DECIMAL_PRECISION = 4;
const DEFAULT_INVALID_VALUE = -1;
const DEFAULT_GYRO_VALUE = 0;

// Permission states
export const PERMISSION_STATE = {
    GRANTED: 'granted',
    DENIED: 'denied',
    PROMPT: 'prompt'
};

// Sensor types
export const SENSOR_TYPE = {
    ACCELEROMETER: 'accelerometer',
    GYROSCOPE: 'gyroscope'
};

const featureSettings = {
    configKey: 'isAccelerometerEvents',
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

export const AccelerometerEventStructure = ['eventSequence', 'timestamp', 'x', 'y', 'z'];
export const GyroEventStructure = ['eventSequence', 'timestamp', 'absolute', 'alpha', 'beta', 'gamma'];

/**
 * Collects accelerometer and gyroscope data from device motion events
 * Handles permission checks and data processing for motion sensors
 */
export default class AccelerometerEventCollector extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    /**
     * @param {Object} configurationRepository - Repository for configuration values
     * @param {Object} utils - Utility functions
     * @param {Object} dataQueue - Queue for storing collected data
     * @param {Object} [navigatorObj=window.navigator] - Navigator object (for testing)
     * @param {Object} [windowObj=window] - Window object (for testing)
     */
    constructor(configurationRepository, utils, dataQueue, navigatorObj = window.navigator, windowObj = window) {
        super();
        this._configurationRepository = configurationRepository;
        this._utils = utils;
        this._dataQueue = dataQueue;
        this._storageUtils = this._utils.StorageUtils;
        this._navigator = navigatorObj;
        this._window = windowObj;

        // Initialize configuration values
        this._samplePeriod = this._configurationRepository.get(ConfigurationFields.accelerometerEventsSamplePeriod) || DEFAULT_SAMPLE_PERIOD;
        this._samplePeriodGyro = this._configurationRepository.get(ConfigurationFields.gyroEventsSamplePeriod) || DEFAULT_SAMPLE_PERIOD;

        // Initialize state tracking
        this._lastAccelerometerData = {
            x: 0,
            y: 0,
            z: 0,
            time: 0
        };

        this._lastGyroData = {
            alpha: 0,
            beta: 0,
            gamma: 0,
            time: 0
        };

        // Initialize permission states
        this._hasAccelerometerPermission = false;
        this._hasGyroscopePermission = false;

        // Bind event handler
        this._onAccelerometerventFunc = this._onAccelerometerEvent.bind(this);
    }

    /**
     * Checks and updates sensor permissions
     * Handles two cases:
     * 1. Browsers without Permissions API - defaults to allowed access
     * 2. Browsers with Permissions API - checks actual permissions
     * Each permission is checked independently to prevent one failure from affecting the other
     * @private
     * @returns {Promise<void>}
     */
    async _checkPermissions() {
        // Case 1: Check if Permissions API is available
        if (!this._navigator.permissions?.query) {
            // Fallback for browsers without Permissions API
            this._hasAccelerometerPermission = true;
            this._hasGyroscopePermission = true;
            Log.debug('Permissions API not available, defaulting to allowed access');
            return;
        }

        // Case 2: Check permissions using Permissions API
        // Check accelerometer permission independently
        try {
            const accelerometerPermission = await this._navigator.permissions.query({ 
                name: SENSOR_TYPE.ACCELEROMETER 
            });
            this._hasAccelerometerPermission = accelerometerPermission.state === PERMISSION_STATE.GRANTED;
        } catch (error) {
            Log.warn('Failed to check accelerometer permission:', error);
            this._hasAccelerometerPermission = true;
        }

        // Check gyroscope permission independently
        try {
            const gyroscopePermission = await this._navigator.permissions.query({ 
                name: SENSOR_TYPE.GYROSCOPE 
            });
            this._hasGyroscopePermission = gyroscopePermission.state === PERMISSION_STATE.GRANTED;
        } catch (error) {
            Log.warn('Failed to check gyroscope permission:', error);
            this._hasGyroscopePermission = true;
        }

        if (!this._hasAccelerometerPermission && !this._hasGyroscopePermission) {
            Log.warn('Both accelerometer and gyroscope permissions are denied');
        }
    }

    /**
     * Processes accelerometer data from device motion event
     * @private
     * @param {Object} acceleration - Acceleration data
     * @param {number} time - Current timestamp
     */
    _processAccelerometerData(acceleration, time) {
        if (!acceleration || time - this._lastAccelerometerData.time <= this._samplePeriod) {
            return;
        }

        const x = this._utils.isUndefinedNull(acceleration.x) ? DEFAULT_INVALID_VALUE : 
                 this._utils.cutDecimalPointDigits(acceleration.x, DEFAULT_DECIMAL_PRECISION);
        const y = this._utils.isUndefinedNull(acceleration.y) ? DEFAULT_INVALID_VALUE : 
                 this._utils.cutDecimalPointDigits(acceleration.y, DEFAULT_DECIMAL_PRECISION);
        const z = this._utils.isUndefinedNull(acceleration.z) ? DEFAULT_INVALID_VALUE : 
                 this._utils.cutDecimalPointDigits(acceleration.z, DEFAULT_DECIMAL_PRECISION);

        if (x !== this._lastAccelerometerData.x || y !== this._lastAccelerometerData.y || z !== this._lastAccelerometerData.z) {
            const eventSeq = this._storageUtils.getAndUpdateEventSequenceNumber();
            this._lastAccelerometerData = { x, y, z, time };
            
            this._dataQueue.addToQueue('accelerometer_events', [null, eventSeq, time, x, y, z]);
            Log.isDebug() && Log.debug(`Accelerometer data: timestamp:${time} x,y,z:${x},${y},${z}`);
        }
    }

    /**
     * Processes gyroscope data from device motion event
     * @private
     * @param {Object} rotationRate - Rotation rate data
     * @param {boolean} absolute - Whether rotation is absolute
     * @param {number} time - Current timestamp
     */
    _processGyroData(rotationRate, absolute, time) {
        if (!rotationRate || time - this._lastGyroData.time <= this._samplePeriodGyro) {
            return;
        }

        const alpha = this._utils.isUndefinedNull(rotationRate.alpha) ? DEFAULT_GYRO_VALUE : 
                     this._utils.cutDecimalPointDigits(rotationRate.alpha, DEFAULT_DECIMAL_PRECISION);
        const beta = this._utils.isUndefinedNull(rotationRate.beta) ? DEFAULT_GYRO_VALUE : 
                    this._utils.cutDecimalPointDigits(rotationRate.beta, DEFAULT_DECIMAL_PRECISION);
        const gamma = this._utils.isUndefinedNull(rotationRate.gamma) ? DEFAULT_GYRO_VALUE : 
                     this._utils.cutDecimalPointDigits(rotationRate.gamma, DEFAULT_DECIMAL_PRECISION);

        if (alpha !== this._lastGyroData.alpha || beta !== this._lastGyroData.beta || gamma !== this._lastGyroData.gamma) {
            const eventSeq = this._storageUtils.getAndUpdateEventSequenceNumber();
            this._lastGyroData = { alpha, beta, gamma, time };
            
            this._dataQueue.addToQueue('gyro_events', [null, eventSeq, time, absolute, alpha, beta, gamma]);
            Log.isDebug() && Log.debug(`Gyro data: timestamp:${time} alpha,beta,gamma:${alpha},${beta},${gamma}`);
        }
    }

    /**
     * Handles device motion events
     * @private
     * @param {DeviceMotionEvent} e - Device motion event
     * @returns {boolean}
     */
    _onAccelerometerEvent(e) {
        if (!e) {
            return true;
        }

        const time = this._utils.dateNow();

        if (this._hasAccelerometerPermission && e.accelerationIncludingGravity) {
            this._processAccelerometerData(e.accelerationIncludingGravity, time);
        }

        if (this._hasGyroscopePermission && e.rotationRate) {
            this._processGyroData(e.rotationRate, e.absolute || false, time);
        }

        return true;
    }

    /**
     * Starts collecting device motion data
     * @returns {Promise<void>}
     */
    async startFeature() {
        if (!this._window.DeviceMotionEvent) {
            Log.debug('DeviceMotionEvent not supported in this environment');
            return;
        }

        await this._checkPermissions();
        
        if (this._hasAccelerometerPermission || this._hasGyroscopePermission) {
            this._utils.addEventListener(this._window, 'devicemotion', this._onAccelerometerventFunc);
            Log.debug('Device motion event listener added successfully');
        } else {
            Log.warn('Device motion event listener not added due to missing permissions');
        }
    }

    /**
     * Stops collecting device motion data
     */
    stopFeature() {
        if (this._window.DeviceMotionEvent) {
            this._utils.removeEventListener(this._window, 'devicemotion', this._onAccelerometerventFunc);
            Log.debug('Device motion event listener removed');
        }
    }

    /**
     * Updates feature configuration
     */
    updateFeatureConfig() {
        const newSamplePeriod = this._configurationRepository.get(ConfigurationFields.accelerometerEventsSamplePeriod);
        const newSamplePeriodGyro = this._configurationRepository.get(ConfigurationFields.gyroEventsSamplePeriod);

        if (newSamplePeriod !== undefined) {
            this._samplePeriod = newSamplePeriod;
        }

        if (newSamplePeriodGyro !== undefined) {
            this._samplePeriodGyro = newSamplePeriodGyro;
        }

        Log.debug(`Updated sample periods - Accelerometer: ${this._samplePeriod}, Gyro: ${this._samplePeriodGyro}`);
    }
}
