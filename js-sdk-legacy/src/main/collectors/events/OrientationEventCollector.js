import DataCollector from '../DataCollector';
import Log from '../../technicalServices/log/Logger';
import { MessageBusEventType } from '../../events/MessageBusEventType';
import { ConfigurationFields } from '../../core/configuration/ConfigurationFields';

const featureSettings = {
    configKey: 'isOrientationEvents',
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

export const EventStructure = ['eventSequence', 'timestamp', 'absolute', 'alpha', 'beta', 'gamma'];

class OrientationEventCollector extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    constructor(configurationRepository, utils, dataQ, MessageBus, DeviceOrientationEventEmitter) {
        super();
        this._dataQ = dataQ;
        this._configurationRepository = configurationRepository;
        this._utils = utils;

        this._samplePeriod = this._configurationRepository.get(ConfigurationFields.orientationEventsSamplePeriod) || 0;

        this._lastAlpha = 0;
        this._lastBeta = 0;
        this._lastGamma = 0;
        this._lastTime = 0;

        this._messageBus = MessageBus;
        this._deviceOrientationEventEmitter = DeviceOrientationEventEmitter;
    }

    startFeature() {
        if (window.DeviceOrientationEvent) {
            this._deviceOrientationEventEmitter.start();
            this._messageBus.subscribe(MessageBusEventType.DeviceOrientationEvent,
                this._handleDeviceOrientationEvent);
        }
    }

    stopFeature() {
        if (window.DeviceOrientationEvent) {
            this._deviceOrientationEventEmitter.stop();
            this._messageBus.unsubscribe(MessageBusEventType.DeviceOrientationEvent,
                this._handleDeviceOrientationEvent);
        }
    }

    _handleDeviceOrientationEvent = (e) => {
        const time = this._utils.dateNow();
        if (e && time - this._lastTime > this._samplePeriod) {
            const absolute = e.absolute || false;
            const alpha = this._utils.isUndefinedNull(e.alpha) ? 0 : this._utils.cutDecimalPointDigits(e.alpha, 4);
            const beta = this._utils.isUndefinedNull(e.beta) ? 0 : this._utils.cutDecimalPointDigits(e.beta, 4);
            const gamma = this._utils.isUndefinedNull(e.gamma) ? 0 : this._utils.cutDecimalPointDigits(e.gamma, 4);

            if (alpha !== this._lastAlpha || beta !== this._lastBeta || gamma !== this._lastGamma) {
                Log.isDebug() && Log.debug(`OrientationEvents:_onOrientationEvent, sending data: timestamp: ${time}
                alpha,betta,gamma: ${alpha},${beta},${gamma},prevTime:${this._lastTime}`);
                this._lastTime = time;
                this._lastAlpha = alpha;
                this._lastBeta = beta;
                this._lastGamma = gamma;
                const eventSeq = this._utils.StorageUtils.getAndUpdateEventSequenceNumber();

                this._dataQ.addToQueue('orientation_events', [null, eventSeq, time, absolute, alpha, beta, gamma]);
            }
        }
    };

    updateFeatureConfig() {
        const samplePeriodConf = this._configurationRepository.get(ConfigurationFields.orientationEventsSamplePeriod);
        this._samplePeriod = samplePeriodConf !== undefined ? samplePeriodConf : this._samplePeriod;
    }
}

export default OrientationEventCollector;
