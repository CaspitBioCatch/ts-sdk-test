import DataCollector from '../DataCollector';
import DoNotTrackContract from "../../contract/staticContracts/DoNotTrackContract";

const featureSettings = {
    configKey: 'isDoNotTrack',
    isDefault: false,
    shouldRunPerContext: false,
    shouldRunPerSession: true,
    shouldRun: true,
    isFrameRelated: false,
    runInUns: true,
    runInSlave: false,
    runInLean: false,
    isRunning: false,
    instance: null,
};

export default class DoNotTrackFeature extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    constructor(dataQ) {
        super();
        this._dataQ = dataQ;
    }

    /**
     * Browsers behavior:
     * Chrome: navigator.doNotTrack == null when not set, "1" when set
     * FF: navigator.doNotTrack == "unspecified" when not set, "1" when set
     * IE 11: window.doNotTrack == null when turned off, "1" when set (default mode)
     * IE 10: navigator.msDoNotTrack == "0" when turned off, "1" when set
     * Safari 9.1: navigator.doNotTrack == null when never set, "1" when set and when again unset "0"
     * Opera: navigator.doNotTrack == null, did not find how to set it in Opera
     * Edge: window.doNotTrack == null when turned off, , "1" when set
     */
    startFeature() {
        let dnt = navigator.doNotTrack; // normal browsers
        if (dnt === undefined) {
            dnt = window.doNotTrack; // IE 11 + Edge
            if (dnt === undefined) {
                dnt = navigator.msDoNotTrack; // IE 10
            }
        }

        if (dnt === null || dnt === 'unspecified' || dnt === '0') {
            dnt = 0;
        } else if (dnt === '1') {
            dnt = 1;
        } else { // dnt is undefined or some other value (cannot really happen)
            dnt = 2;
        }
        let doNotTrackContract = new DoNotTrackContract(dnt);
        let data = doNotTrackContract.buildQueueMessage();
        this._dataQ.addToQueue('static_fields', data, false);
    }
}
