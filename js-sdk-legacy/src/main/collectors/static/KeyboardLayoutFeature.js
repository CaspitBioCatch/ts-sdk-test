import DataCollector from "../DataCollector";
import Log from "../../technicalServices/log/Logger";
import KeyboardLayoutContract from "../../contract/staticContracts/KeyboardLayoutContract";
import { x64hash128 } from "../../technicalServices/Hash";

const featureSettings = {
    configKey: 'isKeyboardLayoutFeature',
    isDefault: false,
    shouldRunPerContext: false,
    shouldRunPerSession: true,
    shouldRun: false,
    isFrameRelated: false,
    runInUns: false,
    runInSlave: true,
    runInLean: true,
    isRunning: false,
    instance: null,
};

export default class KeyboardLayoutFeature extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    /**
     * @param {DataQueue} dataQ
     */
    constructor(dataQ) {
        super();
        this._dataQ = dataQ;
    }

    async startFeature() {
        Log.info("Starting Keyboard Layout Feature");
        await this._collectKeyboardLayoutInfo();
    }

    getKeyboard() {
        return typeof navigator !== 'undefined' && navigator.keyboard ? navigator.keyboard : null;
    }

    async _collectKeyboardLayoutInfo() {
        Log.info('Collecting keyboard layout properties');
        try {
            const keyboardLayoutInfo = await this._getKeyboardLayoutInfo();
            const keyboardLayoutContract = new KeyboardLayoutContract(keyboardLayoutInfo);
            const contractData = keyboardLayoutContract.buildQueueMessage();
            this._dataQ.addToQueue('static_fields', contractData, false);
        } catch (error) {
            Log.error(`Error collecting keyboard layout information: ${error}`);
        }
    }

    async _getKeyboardLayoutInfo() {
        const keyboard = this.getKeyboard();
        if (!keyboard) {
            throw Error(`Could not find keyboard layout`);
        }
        const layoutMap = await keyboard.getLayoutMap();
        const map = Array.from(layoutMap.values()).join("");
        return x64hash128(map);
    }
}