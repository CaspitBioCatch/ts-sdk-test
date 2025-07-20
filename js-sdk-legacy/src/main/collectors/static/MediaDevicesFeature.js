import DataCollector from '../DataCollector';
import Log from '../../technicalServices/log/Logger';
import MediaDevicesContract from "../../contract/staticContracts/MediaDevicesContract";

const featureSettings = {
    configKey: 'isMediaDevices',
    isDefault: false,
    shouldRunPerContext: false,
    shouldRunPerSession: true,
    shouldRun: true,
    isFrameRelated: false,
    runInUns: false,
    runInSlave: false,
    runInLean: false,
    isRunning: false,
    instance: null,
};

export default class MediaDevicesFeature extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    constructor(dataQ, navigator = window.navigator) {
        super();
        this._dataQ = dataQ;
        this._navigator = navigator;
        this._metric = 'MediaDevicesFeature';
    }

    startFeature() {
        this._navigator.mediaDevices && this._navigator.mediaDevices.enumerateDevices
        && this._navigator.mediaDevices.enumerateDevices()
            .then((devices) => {
                const mediaDevices = [];
                devices.forEach((device) => {
                    const mediaDevice = [
                        device.kind || '',
                        device.label || '',
                        device.deviceId || '',
                        device.groupId || '',
                    ];
                    mediaDevices.push(mediaDevice);
                });
                let mediaDevicesContract = new MediaDevicesContract(mediaDevices);
                let mediaDevicesData = mediaDevicesContract.buildQueueMessage();
                this._dataQ.addToQueue('static_fields', mediaDevicesData, false);
            })
            .catch((err) => {
                this.cancelMonitor(this._metric);
                Log.error(`MediaDevicesFeature:startFeature failed to enumerateDevices: ${err.message}`);
            });
    }
}
