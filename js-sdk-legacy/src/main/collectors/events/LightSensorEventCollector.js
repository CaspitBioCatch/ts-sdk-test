/**
 * the sensor reading happens all the time, we don't need all the readings
 * @type {number}
 */
import DataCollector from '../DataCollector';
import Log from '../../technicalServices/log/Logger';

const featureSettings = {
    configKey: 'isLightSensor',
    isDefault: false,
    shouldRunPerContext: false,
    shouldRunPerSession: false,
    shouldRun: false,
    isFrameRelated: false,
    runInSlave: false,
    runInLean: false,
    runInUns: false,
    isRunning: false,
    instance: null,
};

const SENSOR_EVENT_THRESHOLD = 5000;

export const EventStructure = ['eventSequence', 'timestamp', 'illuminance'];

export default class LightSensorEvents extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    constructor(dataQueue, utils, configurationRepository) {
        super();
        this._dataQueue = dataQueue;
        this._utils = utils;
        this._configurationRepository = configurationRepository;
        this._eventThreshold = this._configurationRepository.get('lightSensorEventThreshold') || SENSOR_EVENT_THRESHOLD;
        this._lastTime = 0;
        // Bind the event handlers
        this.onReadingSensorBoundble = this._onReadingSensor.bind(this);
    }

    _onReadingSensor() {
        const time = this.getEventTimestamp();

        if (time - this._lastTime > this._eventThreshold) {
            const eventSeq = this._utils.StorageUtils.getAndUpdateEventSequenceNumber();
            this._lastTime = time;

            this._dataQueue.addToQueue('ambient_light_level',
                this._utils.convertToArrayByMap(EventStructure,
                    {
                        eventSequence: eventSeq,
                        timestamp: time,
                        illuminance: this._sensor.illuminance,
                    }));
        }
    }

    static _onSensorError(event) {
        Log.debug(`Error connecting LightSensor ${event.error}`);
    }

    startFeature() {
        if (!window.AmbientLightSensor) {
            Log.debug('LightSensor does not exist, not collecting');
            return;
        }

        Log.info('AmbientLightSensor exists and collected');

        this._sensor = new AmbientLightSensor();
        this._sensor.addEventListener('reading', this.onReadingSensorBoundble, true)
        this._sensor.addEventListener('error', LightSensorEvents._onSensorError, true)

        this._sensor.start();
    }

    stopFeature() {
        if (this._sensor) {
            this._sensor.removeEventListener('reading', this.onReadingSensorBoundble, true)
            this._sensor.removeEventListener('error', LightSensorEvents._onSensorError, true)
            this._sensor.stop();
            this._sensor = null;
        }
    }

    updateFeatureConfig() {
        this._eventThreshold = this._configurationRepository.get('lightSensorEventThreshold')
            ? this._configurationRepository.get('lightSensorEventThreshold') : this._eventThreshold;
    }
}
