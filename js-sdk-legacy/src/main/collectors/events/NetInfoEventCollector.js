import DataCollector from '../DataCollector';
import Log from '../../technicalServices/log/Logger';

const featureSettings = {
    configKey: 'isNetInfoEvents',
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

export const EventStructure = ['eventSequence', 'timestamp', 'connectionType', 'effectiveType', 'downlinkMax', 'downlink', 'rtt', 'isSaveData'];

export default class NetInfoEventCollector extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    constructor(utils, dataQueue, connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection) {
        super();
        this._dataQueue = dataQueue;
        this._utils = utils;
        this._connection = connection
        this._boundOnChangeNetworkInfo = this.onChangeNetworkInfo.bind(this);
    }

    onChangeNetworkInfo() {
        Log.debug('NetInfoEvents:onChangeNetworkInfo');
        // I stringify the downlinkMax since on wifi it is Infinity (number) and server side will not handle it...
        const saveData = this._utils.isUndefinedNull(this._connection.saveData) ? '' : this._connection.saveData.toString();
        const time = this.getEventTimestamp();
        const eventSeq = this._utils.StorageUtils.getAndUpdateEventSequenceNumber();

        this._dataQueue.addToQueue('net_info_events',
            this._utils.convertToArrayByMap(EventStructure,
                {
                    eventSequence: eventSeq,
                    timestamp: time,
                    connectionType: this._connection.type ? this._connection.type : '',
                    effectiveType: this._connection.effectiveType ? this._connection.effectiveType : '',
                    downlinkMax: this._connection.downlinkMax ? this._connection.downlinkMax.toString() : '',
                    downlink: this._connection.downlink ? this._connection.downlink.toString() : '',
                    rtt: this._connection.rtt ? this._connection.rtt.toString() : '',
                    isSaveData: saveData,
                }));
    }

    startFeature() {
        if (this._connection) {
            // get the data any time it changes
            this._connection.addEventListener('change', this._boundOnChangeNetworkInfo, true);
            this.onChangeNetworkInfo();
        }
    }

    stopFeature() {
        if (this._connection) {
            this._connection.removeEventListener('change', this._boundOnChangeNetworkInfo, true);
        }
    }
}
