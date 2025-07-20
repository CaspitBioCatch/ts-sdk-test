import DataCollector from '../DataCollector';
import { MessageBusEventType } from '../../events/MessageBusEventType';

const featureSettings = {
    configKey: 'isBeforeInstallPrompt',
    isDefault: false,
    shouldRunPerContext: false,
    shouldRunPerSession: false,
    shouldRun: false,
    isFrameRelated: false,
    runInLean: false,
    runInUns: false,
    isRunning: false,
    instance: null,
};

export const EventStructure = ['eventSequence', 'timestamp', 'platforms', 'relativeTime'];

class BeforeInstallPromptEventCollector extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    constructor(dataQueue, utils, MessageBus, BeforeInstallPromptEventEmitter) {
        super();
        this._messageBus = MessageBus;
        this._eventEmitter = BeforeInstallPromptEventEmitter;
        this._dataQueue = dataQueue;
        this._utils = utils;
    }

    startFeature() {
        this._eventEmitter.start(window);
        this._messageBus.subscribe(MessageBusEventType.BeforeInstallPromptEvent, this._onBeforeInstallPrompt);
    }

    stopFeature() {
        this._eventEmitter.stop(window);
        this._messageBus.unsubscribe(MessageBusEventType.BeforeInstallPromptEvent, this._onBeforeInstallPrompt);
    }

    _onBeforeInstallPrompt = (event) => {
        const eventSeq = this._utils.StorageUtils.getAndUpdateEventSequenceNumber();
        const time = this.getEventTimestamp();
        const relativeTimestamp = this.getTimestampFromEvent(event);
        const platforms = event.platforms ? event.platforms.join(',') : '';

        this._dataQueue.addToQueue('before_install_prompt',
            this._utils.convertToArrayByMap(EventStructure,
                {
                    eventSequence: eventSeq,
                    timestamp: time,
                    platforms,
                    relativeTime: relativeTimestamp,
                }));
    }
}

export default BeforeInstallPromptEventCollector;
