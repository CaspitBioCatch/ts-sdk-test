import DataCollector from '../DataCollector';
import DevDebugInfoContract from "../../contract/staticContracts/DevDebugInfoContract";
import Log from "../../technicalServices/log/Logger";

const featureSettings = {
    configKey: 'enableEmuidFeature',
    isDefault: false,
    shouldRunPerContext: false,
    shouldRunPerSession: true,
    shouldRun: false,
    isFrameRelated: false,
    runInUns: false,
    runInSlave: false,
    runInLean: false,
    isRunning: false,
    instance: null,
};

export default class EncryptedMuidFeature extends DataCollector {

    static getDefaultSettings() {
        return featureSettings;
    }

    constructor(dataQ, encryptedMuidService) {
        super();

        this._encryptedMuidService = encryptedMuidService;
        this._dataQ = dataQ;
    }

    async startFeature() {

        const emuid = await this._encryptedMuidService.getEncryptedMuid();

        if (emuid) {
            this._dataQ.addToQueue('static_fields', ['emuid', emuid], false);
        }
    }
}
