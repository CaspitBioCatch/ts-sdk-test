import DataCollector from '../DataCollector';
import IsPrivateBrowsingContract from "../../contract/staticContracts/IsPrivateBrowsingContract";

const featureSettings = {
    configKey: 'isPrivateBrowsing',
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

export default class IsPrivateBrowsingFeature extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    constructor(dataQ, privateBrowsingDetector) {
        super();

        this._dataQ = dataQ;
        this._privateBrowsingDetector = privateBrowsingDetector;
    }

    startFeature() {
        this._privateBrowsingDetector.detectPrivateMode((isPrivate) => {
            let isPrivateBrowsingContract = new IsPrivateBrowsingContract(isPrivate);
            let isPrivateData  = isPrivateBrowsingContract.buildQueueMessage();
            this._dataQ.addToQueue('static_fields', isPrivateData, false);
        });
    }
}
